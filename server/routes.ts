import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { monthlyExams, syllabusClasses, syllabusSubjects, syllabusChapters } from "@shared/schema";
import { eq } from "drizzle-orm";
import session from 'express-session';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { insertUserSchema, insertBatchSchema, insertExamSchema, insertAttendanceSchema, insertStudentFeeSchema, insertSmsLogSchema, insertQuestionBankSchema, insertMonthlyExamSchema, insertIndividualExamSchema, insertMonthlyMarkSchema, insertSmsTemplateSchema, users, attendance } from "@shared/schema";
import { generateQuestions, solveWithAI } from './services/praggoAI';

// Generate a secure random 6-character uppercase alphanumeric password
// Uses crypto.randomInt to avoid modulo bias and ensure uniform distribution
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  
  for (let i = 0; i < 6; i++) {
    password += chars[crypto.randomInt(0, chars.length)];
  }
  
  return password;
}

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("🏫 Student Nursing Center - Initializing backend");

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // Rate limiting for login attempts
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'coaching-center-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    rolling: true,
    name: 'coaching.sid'
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  };

  // Teacher-only authorization middleware
  const requireTeacher = (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (req.session.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Forbidden: Teacher access required' });
    }
    next();
  };

  // Student authorization middleware
  const requireStudent = (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (req.session.user.role !== 'student') {
      return res.status(403).json({ message: 'Forbidden: Student access required' });
    }
    next();
  };

  // Super user authorization middleware
  const requireSuperUser = (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (req.session.user.role !== 'super_user') {
      return res.status(403).json({ message: 'Forbidden: Super user access required' });
    }
    next();
  };

  // Authentication routes
  app.post('/api/auth/login', loginLimiter, async (req, res) => {
    try {
      const { phoneNumber, password } = req.body;

      if (!phoneNumber || !password) {
        return res.status(400).json({ message: 'Phone number and password required' });
      }

      console.log(`🔐 Login attempt for phone: ${phoneNumber}`);

      // 🔒 HARDCODED AUTHENTICATION - Always check first before database
      if (phoneNumber === '01762602056' && password === 'sir@123@') {
        console.log(`✅ Hardcoded teacher login successful`);
        
        const settings = await storage.getSettings();
        const smsCount = settings?.smsCount || 0;
        
        const sessionUser = {
          id: 'hardcoded-teacher',
          role: 'teacher',
          name: 'Hardcoded Teacher',
          firstName: 'Hardcoded',
          lastName: 'Teacher',
          phoneNumber: '01762602056',
          email: 'teacher@gsteaching.com',
          smsCount: smsCount,
          batchId: null
        };

        (req as any).session.user = sessionUser;

        return res.json({
          success: true,
          user: sessionUser
        });
      }

      if (phoneNumber === '01818291546' && password === 'sahidx@123@') {
        console.log(`✅ Hardcoded admin login successful`);
        
        const settings = await storage.getSettings();
        const smsCount = settings?.smsCount || 0;
        
        const sessionUser = {
          id: 'hardcoded-admin',
          role: 'super_user',
          name: 'Hardcoded Admin',
          firstName: 'Hardcoded',
          lastName: 'Admin',
          phoneNumber: '01818291546',
          email: 'admin@gsteaching.com',
          smsCount: smsCount,
          batchId: null
        };

        (req as any).session.user = sessionUser;

        return res.json({
          success: true,
          user: sessionUser
        });
      }

      // 📁 DATABASE AUTHENTICATION - Check database users after hardcoded
      try {
        // Look up user by phone number
        const user = await storage.getUserByPhoneNumber(phoneNumber);

        if (!user) {
          console.log(`❌ User not found for phone: ${phoneNumber}`);
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password based on role
        let isValidPassword = false;

        if (user.role === 'teacher' || user.role === 'super_user') {
          // Teachers and super users use bcrypt hashed passwords
          if (user.password) {
            isValidPassword = await bcrypt.compare(password, user.password);
          }
        } else if (user.role === 'student') {
          // Students use plaintext passwords
          isValidPassword = user.studentPassword === password;
        }

        if (!isValidPassword) {
          console.log(`❌ Invalid password for user: ${phoneNumber}`);
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`✅ Database login successful for user: ${user.firstName} ${user.lastName} (${user.role})`);

        // Get SMS count from settings for teachers/super_user
        let smsCount = 0;
        if (user.role === 'teacher' || user.role === 'super_user') {
          const settings = await storage.getSettings();
          smsCount = settings?.smsCount || 0;
        }

        // Store user in session
        const sessionUser = {
          id: user.id,
          role: user.role,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          email: user.email,
          smsCount: smsCount,
          batchId: user.batchId // Include batchId for student access control
        };

        (req as any).session.user = sessionUser;

        res.json({
          success: true,
          user: sessionUser
        });

      } catch (dbError) {
        console.error('❌ Database authentication error:', dbError);
        // If database fails, still allow hardcoded users to work
        return res.status(401).json({ message: 'Invalid credentials' });
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.get('/api/auth/user', (req, res) => {
    if (req.session?.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  // Student routes
  app.get('/api/students', requireAuth, async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      
      // Enrich with batch data
      const studentsWithBatches = await Promise.all(students.map(async (student) => {
        if (student.batchId) {
          const batch = await storage.getBatchById(student.batchId);
          return { ...student, batch };
        }
        return student;
      }));

      res.json(studentsWithBatches);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Failed to fetch students' });
    }
  });

  app.post('/api/students', requireAuth, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse({
        ...req.body,
        role: 'student',
        isActive: true
      });

      // Generate a secure random password for the student
      const randomPassword = generateSecurePassword();
      validatedData.studentPassword = randomPassword;

      const student = await storage.createUser(validatedData);

      // Update batch student count if batchId is provided
      if (student.batchId) {
        const batch = await storage.getBatchById(student.batchId);
        if (batch) {
          await storage.updateBatch(batch.id, {
            currentStudents: (batch.currentStudents || 0) + 1
          });
        }
      }

      res.json({ ...student, generatedPassword: randomPassword });
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({ message: 'Failed to create student' });
    }
  });

  app.put('/api/students/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const student = await storage.updateUser(id, req.body);
      res.json(student);
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ message: 'Failed to update student' });
    }
  });

  app.post('/api/students/:id/reset-password', requireTeacher, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify student exists and is actually a student
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      if (existingUser.role !== 'student') {
        return res.status(400).json({ message: 'User is not a student' });
      }
      
      // Generate new password and update
      const randomPassword = generateSecurePassword();
      const student = await storage.updateUser(id, { studentPassword: randomPassword });
      
      // Return updated student with new password (needed for teacher to share with student)
      res.json({ ...student, newPassword: randomPassword });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  app.delete('/api/students/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const student = await storage.getUser(id);
      
      if (student && student.batchId) {
        const batch = await storage.getBatchById(student.batchId);
        if (batch) {
          await storage.updateBatch(batch.id, {
            currentStudents: Math.max(0, (batch.currentStudents || 0) - 1)
          });
        }
      }

      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ message: 'Failed to delete student' });
    }
  });

  // Public batch endpoint for landing page
  app.get('/api/public/batches', async (req, res) => {
    try {
      const batches = await storage.getAllBatches();
      // Only return active batches with limited information for public view
      const publicBatches = batches
        .filter(batch => batch.status === 'active')
        .map(batch => ({
          id: batch.id,
          name: batch.name,
          subject: batch.subject,
          classTime: batch.classTime,
          classDays: batch.classDays,
          currentStudents: batch.currentStudents,
          maxStudents: batch.maxStudents,
          status: batch.status
        }));
      res.json(publicBatches);
    } catch (error) {
      console.error('Error fetching public batches:', error);
      res.status(500).json({ message: 'Failed to fetch batches' });
    }
  });

  // Batch routes
  app.get('/api/batches', requireAuth, async (req, res) => {
    try {
      const batches = await storage.getAllBatches();
      res.json(batches);
    } catch (error) {
      console.error('Error fetching batches:', error);
      res.status(500).json({ message: 'Failed to fetch batches' });
    }
  });

  app.post('/api/batches', requireAuth, async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const validatedData = insertBatchSchema.parse({
        ...req.body,
        createdBy: req.session.user.id,
        status: 'active'
      });

      const batch = await storage.createBatch(validatedData);
      res.json(batch);
    } catch (error) {
      console.error('Error creating batch:', error);
      res.status(500).json({ message: 'Failed to create batch' });
    }
  });

  app.put('/api/batches/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const batch = await storage.updateBatch(id, req.body);
      res.json(batch);
    } catch (error) {
      console.error('Error updating batch:', error);
      res.status(500).json({ message: 'Failed to update batch' });
    }
  });

  app.delete('/api/batches/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBatch(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting batch:', error);
      res.status(500).json({ message: 'Failed to delete batch' });
    }
  });

  // Exam routes
  app.get('/api/exams', requireAuth, async (req, res) => {
    try {
      const exams = await storage.getAllExams();
      res.json(exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({ message: 'Failed to fetch exams' });
    }
  });

  app.post('/api/exams', requireAuth, async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const validatedData = insertExamSchema.parse({
        ...req.body,
        createdBy: req.session.user.id,
        isActive: true
      });

      const exam = await storage.createExam(validatedData);
      res.json(exam);
    } catch (error) {
      console.error('Error creating exam:', error);
      res.status(500).json({ message: 'Failed to create exam' });
    }
  });

  app.get('/api/exams/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const exam = await storage.getExamById(id);
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }
      const questions = await storage.getQuestionsByExam(id);
      res.json({ ...exam, questions });
    } catch (error) {
      console.error('Error fetching exam:', error);
      res.status(500).json({ message: 'Failed to fetch exam' });
    }
  });

  // Attendance routes
  app.get('/api/attendance', requireAuth, async (req, res) => {
    try {
      const { studentId, batchId } = req.query;
      
      if (studentId) {
        const attendance = await storage.getAttendanceByStudent(studentId as string);
        return res.json(attendance);
      }
      
      if (batchId) {
        const attendance = await storage.getAttendanceByBatch(batchId as string);
        
        const studentIdsSet = new Set(attendance.map(a => a.studentId));
        const studentIds = Array.from(studentIdsSet);
        const students = await Promise.all(
          studentIds.map(id => storage.getUser(id))
        );
        const studentMap = new Map(students.filter(s => s).map(s => [s!.id, s]));
        
        const attendanceWithStudents = attendance.map(record => ({
          ...record,
          student: studentMap.get(record.studentId) ? {
            firstName: studentMap.get(record.studentId)!.firstName,
            lastName: studentMap.get(record.studentId)!.lastName,
            studentId: studentMap.get(record.studentId)!.studentId
          } : null
        }));
        
        return res.json(attendanceWithStudents);
      }

      res.json([]);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ message: 'Failed to fetch attendance' });
    }
  });

  app.post('/api/attendance', requireAuth, async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const validatedData = insertAttendanceSchema.parse({
        ...req.body,
        date: new Date(req.body.date),
        markedBy: req.session.user.id
      });

      // Check for duplicate attendance (same student, batch, date)
      // Get all attendance for the batch (without date filter)
      const existingAttendance = await storage.getAttendanceByBatch(validatedData.batchId);
      
      // Compare dates by converting to YYYY-MM-DD string format
      const requestDateStr = new Date(validatedData.date).toISOString().split('T')[0];
      const duplicate = existingAttendance.find(a => {
        const existingDateStr = new Date(a.date).toISOString().split('T')[0];
        return a.studentId === validatedData.studentId && existingDateStr === requestDateStr;
      });

      if (duplicate) {
        // Update existing attendance instead of creating duplicate
        const [updated] = await db
          .update(attendance)
          .set({
            attendanceStatus: validatedData.attendanceStatus,
            subject: validatedData.subject,
            markedBy: validatedData.markedBy
          })
          .where(eq(attendance.id, duplicate.id))
          .returning();
        console.log(`✅ Updated duplicate attendance: ${duplicate.id} → ${validatedData.attendanceStatus}`);
        return res.json(updated);
      }

      const attendanceRecord = await storage.createAttendance(validatedData);
      res.json(attendanceRecord);
    } catch (error) {
      console.error('Error creating attendance:', error);
      res.status(500).json({ message: 'Failed to create attendance' });
    }
  });

  // Fee routes
  app.get('/api/fees', requireAuth, async (req, res) => {
    try {
      const { studentId } = req.query;
      
      if (studentId) {
        const fees = await storage.getFeesByStudent(studentId as string);
        return res.json(fees);
      }

      const fees = await storage.getAllFees();
      res.json(fees);
    } catch (error) {
      console.error('Error fetching fees:', error);
      res.status(500).json({ message: 'Failed to fetch fees' });
    }
  });

  app.post('/api/fees', requireAuth, async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const validatedData = insertStudentFeeSchema.parse({
        ...req.body,
        createdBy: req.session.user.id
      });

      const fee = await storage.upsertFee(validatedData);
      res.json(fee);
    } catch (error) {
      console.error('Error creating/updating fee:', error);
      res.status(500).json({ message: 'Failed to create/update fee' });
    }
  });

  app.put('/api/fees/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const fee = await storage.updateFee(id, req.body);
      res.json(fee);
    } catch (error) {
      console.error('Error updating fee:', error);
      res.status(500).json({ message: 'Failed to update fee' });
    }
  });

  app.get('/api/fees/batch/:batchId/:year', requireAuth, async (req, res) => {
    try {
      const { batchId, year } = req.params;
      const fees = await storage.getFeesByBatchAndYear(batchId, parseInt(year));
      res.json(fees);
    } catch (error) {
      console.error('Error fetching fees by batch and year:', error);
      res.status(500).json({ message: 'Failed to fetch fees' });
    }
  });

  // SMS routes
  app.get('/api/sms/logs', requireAuth, async (req, res) => {
    try {
      const logs = await storage.getSmsLogs();
      res.json(logs);
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
      res.status(500).json({ message: 'Failed to fetch SMS logs' });
    }
  });

  app.post('/api/sms/send', requireAuth, async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { recipients, message, smsType, subject } = req.body;

      if (!recipients || !message) {
        return res.status(400).json({ message: 'Recipients and message are required' });
      }

      const settings = await storage.getSettings();
      const shouldSendRealSMS = settings?.smsApiKey;

      // Always check SMS balance, regardless of test/production mode
      const requiredSmsCount = recipients.length;
      const currentSmsCount = settings?.smsCount || 0;
      
      if (currentSmsCount < requiredSmsCount) {
        return res.status(400).json({ 
          message: `Insufficient SMS balance. Required: ${requiredSmsCount} SMS, Available: ${currentSmsCount} SMS` 
        });
      }

      const logs = await Promise.all(
        recipients.map(async (recipient: any) => {
          // In test mode (no API key), mark as 'sent' so balance reduces for testing
          // In production (with API key), only mark as 'sent' if API succeeds
          let status = shouldSendRealSMS ? 'failed' : 'sent';
          const recipientMessage = recipient.message || message;
          
          if (shouldSendRealSMS && settings) {
            const apiUrl = settings.smsApiUrl || 'http://bulksmsbd.net/api/smsapi';
            const apiKey = settings.smsApiKey!;
            const senderId = settings.smsSenderId || '8809617628909';

            const params = new URLSearchParams({
              api_key: apiKey,
              type: 'text',
              number: recipient.phone,
              senderid: senderId,
              message: recipientMessage
            });

            try {
              const response = await fetch(`${apiUrl}?${params.toString()}`);
              const result = await response.text();
              
              // BulkSMSBD returns JSON: {"response_code":202,"message_id":123,"success_message":"SMS Submitted Successfully","error_message":""}
              try {
                const jsonResult = JSON.parse(result);
                status = (response.ok && (jsonResult.response_code === 202 || jsonResult.success_message)) ? 'sent' : 'failed';
              } catch {
                // Fallback to text parsing if not JSON
                status = (response.ok && !result.toLowerCase().includes('error')) ? 'sent' : 'failed';
              }
              
              if (status === 'failed') {
                console.error('❌ SMS API returned error for', recipient.phone, ':', result);
              }
            } catch (error) {
              console.error('❌ SMS API error for', recipient.phone, ':', error);
              status = 'failed';
            }
          }

          const smsLogData = insertSmsLogSchema.parse({
            recipientType: recipient.type || 'student',
            recipientPhone: recipient.phone,
            recipientName: recipient.name,
            studentId: recipient.studentId,
            smsType: smsType || 'notice',
            subject: subject || 'Notification',
            message: recipientMessage,
            status: status,
            sentBy: req.session.user!.id
          });

          return await storage.createSmsLog(smsLogData);
        })
      );

      // Reduce SMS balance only for successfully sent messages
      // In test mode (no API key), all messages are marked 'sent' so balance reduces for testing
      // In production (with API key), only successful API calls are marked 'sent'
      if (settings) {
        const successfulSmsCount = logs.filter(log => log.status === 'sent').length;
        if (successfulSmsCount > 0) {
          const latestSettings = await storage.getSettings();
          const latestCount = latestSettings?.smsCount || 0;
          const newCount = Math.max(0, latestCount - successfulSmsCount);
          
          await storage.updateSettings({
            smsCount: newCount
          });
          
          console.log(`✅ SMS balance reduced: ${latestCount} → ${newCount} (${successfulSmsCount} SMS sent)`);
        }
        
        const failedSmsCount = logs.filter(log => log.status === 'failed').length;
        if (failedSmsCount > 0) {
          console.warn(`⚠️ ${failedSmsCount} SMS failed - balance NOT reduced (check API configuration)`);
        }
      }

      res.json({ success: true, count: logs.length, logs });
    } catch (error) {
      console.error('Error sending SMS:', error);
      res.status(500).json({ message: 'Failed to send SMS' });
    }
  });

  app.post('/api/sms/send-test', requireAuth, async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({ message: 'Phone number and message are required' });
      }

      const settings = await storage.getSettings();
      const shouldSendRealSMS = settings?.smsApiKey;

      const currentSmsCount = settings?.smsCount || 0;
      
      if (currentSmsCount < 1) {
        return res.status(400).json({ 
          message: `Insufficient SMS balance. Required: 1 SMS, Available: ${currentSmsCount} SMS` 
        });
      }

      // In test mode (no API key), mark as 'sent' so balance reduces for testing
      // In production (with API key), only mark as 'sent' if API succeeds
      let status = shouldSendRealSMS ? 'failed' : 'sent';
      let apiResponse = '';

      if (shouldSendRealSMS && settings) {
        const apiUrl = settings.smsApiUrl || 'http://bulksmsbd.net/api/smsapi';
        const apiKey = settings.smsApiKey!;
        const senderId = settings.smsSenderId || '8809617628909';

        const params = new URLSearchParams({
          api_key: apiKey,
          type: 'text',
          number: phoneNumber,
          senderid: senderId,
          message: message
        });

        try {
          const response = await fetch(`${apiUrl}?${params.toString()}`);
          const result = await response.text();
          apiResponse = result;
          
          // BulkSMSBD returns JSON: {"response_code":202,"message_id":123,"success_message":"SMS Submitted Successfully","error_message":""}
          try {
            const jsonResult = JSON.parse(result);
            // Check for successful response (response_code 202 or success_message present)
            status = (response.ok && (jsonResult.response_code === 202 || jsonResult.success_message)) ? 'sent' : 'failed';
          } catch {
            // Fallback to text parsing if not JSON
            status = (response.ok && !result.toLowerCase().includes('error')) ? 'sent' : 'failed';
          }
        } catch (error) {
          console.error('❌ SMS API error:', error);
          status = 'failed';
        }
      }

      const smsLogData = insertSmsLogSchema.parse({
        recipientType: 'test',
        recipientPhone: phoneNumber,
        recipientName: 'Test Recipient',
        studentId: null,
        smsType: 'notice',
        subject: 'Test SMS',
        message: message,
        status: status,
        sentBy: req.session.user!.id
      });

      const log = await storage.createSmsLog(smsLogData);

      // Reduce balance only for successfully sent messages
      if (status === 'sent' && settings) {
        const latestSettings = await storage.getSettings();
        const latestCount = latestSettings?.smsCount || 0;
        const newCount = Math.max(0, latestCount - 1);
        
        await storage.updateSettings({
          smsCount: newCount
        });
        
        console.log(`✅ SMS balance reduced: ${latestCount} → ${newCount} (Test SMS sent)`);
      }

      res.json({ 
        success: status === 'sent', 
        message: status === 'sent' ? 'SMS sent successfully' : 'SMS sending failed',
        apiResponse: apiResponse,
        log 
      });
    } catch (error: any) {
      console.error('Error sending test SMS:', error);
      res.status(500).json({ 
        message: 'Failed to send test SMS', 
        error: error.message 
      });
    }
  });

  // SMS Template routes
  app.get('/api/sms/templates', requireAuth, async (req, res) => {
    try {
      const templates = await storage.getSmsTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching SMS templates:', error);
      res.status(500).json({ message: 'Failed to fetch SMS templates' });
    }
  });

  app.post('/api/sms/templates', requireAuth, async (req, res) => {
    try {
      const validatedData = insertSmsTemplateSchema.parse({
        ...req.body,
        createdBy: req.session.user!.id
      });
      const template = await storage.createSmsTemplate(validatedData);
      res.json(template);
    } catch (error: any) {
      console.error('Error creating SMS template:', error);
      res.status(400).json({ message: error.message || 'Failed to create template' });
    }
  });

  app.put('/api/sms/templates/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.updateSmsTemplate(id, req.body);
      res.json(template);
    } catch (error: any) {
      console.error('Error updating SMS template:', error);
      res.status(400).json({ message: error.message || 'Failed to update template' });
    }
  });

  app.delete('/api/sms/templates/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSmsTemplate(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting SMS template:', error);
      res.status(400).json({ message: error.message || 'Failed to delete template' });
    }
  });

  app.post('/api/sms/templates/seed-defaults', requireAuth, async (req, res) => {
    try {
      const defaultTemplates = [
        {
          name: 'Attendance - Present',
          templateType: 'attendance',
          message: 'Assalamu Alaikum. {studentName} attended {batchName} on {date}. Thank you for regular attendance. - GS Student Nursing Center',
          createdBy: req.session.user!.id
        },
        {
          name: 'Attendance - Absent',
          templateType: 'attendance_absent',
          message: 'Assalamu Alaikum. {studentName} was absent from {batchName} on {date}. Please ensure regular attendance. - GS Student Nursing Center',
          createdBy: req.session.user!.id
        },
        {
          name: 'Exam Marks Notification',
          templateType: 'exam_marks',
          message: 'Dear Parent, {studentName} scored {marks}/{totalMarks} in {examName}. Subject: {subject}. Keep up the good work! - GS Student Nursing Center',
          createdBy: req.session.user!.id
        },
        {
          name: 'Monthly Result',
          templateType: 'monthly_result',
          message: 'Assalamu Alaikum. {studentName} - Monthly Result: Total {totalMarks}, Rank: {rank}. Attendance: {attendanceMarks}. Great effort! - GS Student Nursing Center',
          createdBy: req.session.user!.id
        },
        {
          name: 'Test SMS',
          templateType: 'custom',
          message: 'Assalamu Alaikum. This is a test SMS from GS Student Nursing Center. Your SMS system is working correctly!',
          createdBy: req.session.user!.id
        }
      ];

      const createdTemplates = await Promise.all(
        defaultTemplates.map(async (template) => {
          const validatedData = insertSmsTemplateSchema.parse(template);
          return await storage.createSmsTemplate(validatedData);
        })
      );

      res.json({ 
        success: true, 
        message: 'Default templates created successfully',
        templates: createdTemplates 
      });
    } catch (error: any) {
      console.error('Error creating default templates:', error);
      res.status(400).json({ message: error.message || 'Failed to create default templates' });
    }
  });

  // Question Bank routes
  app.get('/api/question-bank', requireAuth, async (req, res) => {
    try {
      const questions = await storage.getQuestionBankItems();
      res.json(questions);
    } catch (error) {
      console.error('Error fetching question bank:', error);
      res.status(500).json({ message: 'Failed to fetch question bank' });
    }
  });

  app.post('/api/question-bank', requireAuth, async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const validatedData = insertQuestionBankSchema.parse({
        ...req.body,
        teacherId: req.session.user.id
      });

      const questionItem = await storage.createQuestionBankItem(validatedData);
      res.json(questionItem);
    } catch (error) {
      console.error('Error creating question bank item:', error);
      res.status(500).json({ message: 'Failed to create question' });
    }
  });

  // AI Question Generation (placeholder - would integrate with actual AI service)
  app.post('/api/ai/generate-questions', requireAuth, async (req, res) => {
    try {
      const { subject, chapter, difficulty, count } = req.body;

      // This is a placeholder - in real implementation, this would call an AI service
      const generatedQuestions = Array.from({ length: count || 5 }, (_, i) => ({
        subject,
        chapter,
        difficulty: difficulty || 'medium',
        questionText: `Generated ${subject} question ${i + 1} for chapter: ${chapter}`,
        questionType: 'mcq',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        marks: 1
      }));

      res.json({ success: true, questions: generatedQuestions });
    } catch (error) {
      console.error('Error generating questions:', error);
      res.status(500).json({ message: 'Failed to generate questions' });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const students = await storage.getAllStudents();
      const batches = await storage.getAllBatches();
      const fees = await storage.getAllFees();
      const settings = await storage.getSettings();
      
      const pendingFees = fees.filter(f => f.status === 'pending');
      const totalPending = pendingFees.reduce((sum, fee) => {
        const amount = typeof fee.amount === 'string' ? parseFloat(fee.amount) : fee.amount;
        const paid = typeof fee.paidAmount === 'string' ? parseFloat(fee.paidAmount || '0') : (fee.paidAmount || 0);
        return sum + (amount - paid);
      }, 0);

      res.json({
        totalStudents: students.length,
        activeBatches: batches.filter(b => b.status === 'active').length,
        pendingFees: totalPending,
        smsCount: settings?.smsCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Student-specific routes
  app.get('/api/student/batch', requireAuth, async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.session.user.id;
      
      // Get student user to find their batchId
      const user = await storage.getUser(userId);
      if (!user || !user.batchId) {
        return res.json(null);
      }

      const batch = await storage.getBatchById(user.batchId);
      res.json(batch);
    } catch (error) {
      console.error('Error fetching student batch:', error);
      res.status(500).json({ message: 'Failed to fetch batch' });
    }
  });

  app.get('/api/student/exam-results', requireAuth, async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.session.user.id;
      const submissions = await storage.getSubmissionsByStudent(userId);
      
      // Enhance with exam details
      const results = await Promise.all(
        submissions.map(async (sub) => {
          const exam = await storage.getExamById(sub.examId);
          return {
            ...sub,
            examTitle: exam?.title || 'Unknown Exam',
            examSubject: exam?.subject || 'Unknown',
            examDate: exam?.examDate || new Date().toISOString(),
            totalMarks: exam?.totalMarks || 0
          };
        })
      );
      
      res.json(results);
    } catch (error) {
      console.error('Error fetching exam results:', error);
      res.status(500).json({ message: 'Failed to fetch results' });
    }
  });

  app.get('/api/student/upcoming-exams', requireAuth, async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.session.user.id;
      
      // Get student user to find their batchId
      const user = await storage.getUser(userId);
      if (!user || !user.batchId) {
        return res.json([]);
      }

      const exams = await storage.getAllExams();
      const now = new Date();
      
      // Filter upcoming exams for student's batch
      const upcomingExams = exams.filter(exam => {
        if (!exam.examDate) return false;
        const examDate = new Date(exam.examDate);
        return (
          exam.batchId === user.batchId &&
          examDate >= now &&
          exam.isActive
        );
      }).sort((a, b) => {
        if (!a.examDate || !b.examDate) return 0;
        return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
      });

      res.json(upcomingExams);
    } catch (error) {
      console.error('Error fetching upcoming exams:', error);
      res.status(500).json({ message: 'Failed to fetch exams' });
    }
  });

  app.get('/api/student/attendance', requireAuth, async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const userId = req.session.user.id;
      const attendance = await storage.getAttendanceByStudent(userId);
      
      // Enhance with batch name
      const records = await Promise.all(
        attendance.map(async (record) => {
          const batch = await storage.getBatchById(record.batchId);
          return {
            ...record,
            batchName: batch?.name || 'Unknown Batch'
          };
        })
      );
      
      res.json(records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ message: 'Failed to fetch attendance' });
    }
  });

  // Get student's monthly exam results with individual marks and rankings
  app.get('/api/student/monthly-exams', requireAuth, async (req, res) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      
      // Get student to find their batchId
      const user = await storage.getUser(userId);
      if (!user || !user.batchId) {
        return res.json([]);
      }

      // Get all monthly exams for student's batch (both finalized and not finalized)
      const monthlyExams = await storage.getMonthlyExamsByBatch(user.batchId);

      // Get results and individual marks for each monthly exam
      const examData = await Promise.all(
        monthlyExams.map(async (monthlyExam) => {
          // Get monthly result (rank, final total, etc.) - only exists if finalized
          const result = await storage.getMonthlyResultByStudentAndExam(userId, monthlyExam.id);
          
          // Get individual exam marks - show these even if not finalized
          const individualExams = await storage.getIndividualExamsByMonthlyExam(monthlyExam.id);
          const marks = await Promise.all(
            individualExams.map(async (individualExam) => {
              const mark = await storage.getMonthlyMarkByStudentAndExam(userId, individualExam.id);
              return {
                examId: individualExam.id,
                examName: individualExam.name,
                subject: individualExam.subject,
                totalMarks: individualExam.totalMarks,
                obtainedMarks: mark?.obtainedMarks || 0,
                percentage: mark ? ((mark.obtainedMarks / individualExam.totalMarks) * 100).toFixed(2) : '0.00'
              };
            })
          );

          return {
            monthlyExamId: monthlyExam.id,
            month: monthlyExam.month,
            year: monthlyExam.year,
            title: monthlyExam.title,
            isFinalized: monthlyExam.isFinalized,
            individualExams: marks,
            result: result ? {
              totalExamMarks: result.totalExamMarks,
              attendanceMarks: result.attendanceMarks,
              bonusMarks: result.bonusMarks,
              finalTotal: result.finalTotal,
              rank: result.rank,
              percentage: result.percentage,
              gpa: result.gpa
            } : null
          };
        })
      );

      // Sort by year and month descending (newest first)
      examData.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      res.json(examData);
    } catch (error) {
      console.error('Error fetching student monthly exams:', error);
      res.status(500).json({ message: 'Failed to fetch monthly exams' });
    }
  });

  // Monthly Exam Routes
  app.get('/api/monthly-exams', requireAuth, async (req, res) => {
    try {
      const user = req.session.user!;
      const monthlyExams = await storage.getAllMonthlyExams();
      
      // Students can only view monthly exams for their own batch
      if (user.role === 'student') {
        const studentBatchExams = monthlyExams.filter(exam => exam.batchId === user.batchId);
        return res.json(studentBatchExams);
      }
      
      // Teachers can view all monthly exams
      res.json(monthlyExams);
    } catch (error) {
      console.error('Error fetching monthly exams:', error);
      res.status(500).json({ message: 'Failed to fetch monthly exams' });
    }
  });

  app.post('/api/monthly-exams', requireAuth, async (req, res) => {
    try {
      const validated = insertMonthlyExamSchema.parse({
        ...req.body,
        createdBy: req.session.user!.id
      });
      const monthlyExam = await storage.createMonthlyExam(validated);
      res.json(monthlyExam);
    } catch (error: any) {
      console.error('Error creating monthly exam:', error);
      res.status(400).json({ message: error.message || 'Failed to create monthly exam' });
    }
  });

  app.get('/api/monthly-exams/:id/exams', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.session.user!;
      
      // Get the monthly exam to check batch
      const monthlyExam = await storage.getMonthlyExamById(id);
      if (!monthlyExam) {
        return res.status(404).json({ message: 'Monthly exam not found' });
      }
      
      // Students can only view exams for their own batch
      if (user.role === 'student' && user.batchId !== monthlyExam.batchId) {
        return res.status(403).json({ message: 'Access denied. You can only view exams for your own batch.' });
      }
      
      const exams = await storage.getExamsByMonthlyExam(id);
      res.json(exams);
    } catch (error) {
      console.error('Error fetching individual exams:', error);
      res.status(500).json({ message: 'Failed to fetch exams' });
    }
  });

  app.post('/api/individual-exams', requireAuth, async (req, res) => {
    try {
      const validated = insertIndividualExamSchema.parse(req.body);
      const exam = await storage.createIndividualExam(validated);
      res.json(exam);
    } catch (error: any) {
      console.error('Error creating individual exam:', error);
      res.status(400).json({ message: error.message || 'Failed to create exam' });
    }
  });

  app.get('/api/individual-exams/:id/marks', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const marks = await storage.getMarksByExam(id);
      res.json(marks);
    } catch (error) {
      console.error('Error fetching marks:', error);
      res.status(500).json({ message: 'Failed to fetch marks' });
    }
  });

  app.post('/api/monthly-marks', requireAuth, async (req, res) => {
    try {
      const validated = insertMonthlyMarkSchema.parse(req.body);
      const mark = await storage.createOrUpdateMonthlyMark(validated);
      res.json(mark);
    } catch (error: any) {
      console.error('Error saving mark:', error);
      res.status(400).json({ message: error.message || 'Failed to save mark' });
    }
  });

  app.post('/api/monthly-marks/bulk', requireAuth, async (req, res) => {
    try {
      const { marks, sendSms } = req.body;

      if (!marks || !Array.isArray(marks) || marks.length === 0) {
        return res.status(400).json({ message: 'Marks array is required' });
      }

      // PRE-VALIDATION: If SMS requested, check balance BEFORE saving marks
      let smsData = null;
      if (sendSms) {
        const settings = await storage.getSettings();
        if (!settings) {
          return res.status(400).json({ message: 'SMS settings not configured' });
        }

        // Get exam details
        const firstMark = marks[0];
        const exam = await storage.getIndividualExamById(firstMark.individualExamId);
        if (!exam) {
          return res.status(400).json({ message: 'Exam not found' });
        }

        // Count students with valid phone numbers for accurate cost calculation
        const studentsWithPhones = await Promise.all(
          marks.map(async mark => {
            const student = await storage.getUser(mark.studentId);
            return student?.phoneNumber ? 1 : 0;
          })
        );
        const recipientCount = studentsWithPhones.reduce((sum: number, has: number) => sum + has, 0);

        const currentSmsCount = settings.smsCount || 0;

        if (currentSmsCount < recipientCount) {
          return res.status(400).json({ 
            message: `Insufficient SMS count. Required: ${recipientCount} SMS, Available: ${currentSmsCount} SMS` 
          });
        }

        smsData = { settings, exam };
      }

      // ATOMIC OPERATION: Save all marks (now that SMS validation passed)
      const savedMarks = await Promise.all(
        marks.map(mark => storage.createOrUpdateMonthlyMark(mark))
      );

      // Send SMS if requested (validation already passed)
      if (sendSms && smsData) {
        const { settings, exam } = smsData;
        let sentCount = 0;
        const smsLogs = [];

        for (const mark of marks) {
          const student = await storage.getUser(mark.studentId);
          if (student?.phoneNumber) {
            const message = `Dear Parent, ${student.firstName} ${student.lastName} scored ${mark.obtainedMarks}/${exam.totalMarks} in ${exam.name}. - Student Nursing Center`;
            
            // BulkSMSBD API Integration
            try {
              if (settings.smsApiKey && settings.smsApiUrl && settings.smsSenderId) {
                const params = new URLSearchParams({
                  api_key: settings.smsApiKey,
                  type: 'text',
                  number: student.phoneNumber,
                  senderid: settings.smsSenderId,
                  message: message
                });

                const smsResponse = await fetch(`${settings.smsApiUrl}?${params.toString()}`);
                const result = await smsResponse.text();
                
                // BulkSMSBD returns JSON: {"response_code":202,"message_id":123,"success_message":"SMS Submitted Successfully","error_message":""}
                let status = 'failed';
                try {
                  const jsonResult = JSON.parse(result);
                  status = (smsResponse.ok && (jsonResult.response_code === 202 || jsonResult.success_message)) ? 'sent' : 'failed';
                } catch {
                  // Fallback to text parsing if not JSON
                  status = (smsResponse.ok && !result.toLowerCase().includes('error')) ? 'sent' : 'failed';
                }
                
                smsLogs.push({
                  recipientType: 'parent',
                  recipientPhone: student.phoneNumber,
                  recipientName: `${student.firstName} ${student.lastName}'s Parent`,
                  studentId: student.id,
                  smsType: 'exam_result' as const,
                  subject: `${exam.name} Result`,
                  message,
                  status,
                  sentBy: req.session.user!.id
                });
                
                if (status === 'sent') sentCount++;
              } else {
                // SMS API not configured (test mode) - mark as 'sent' so balance reduces for testing
                smsLogs.push({
                  recipientType: 'parent',
                  recipientPhone: student.phoneNumber,
                  recipientName: `${student.firstName} ${student.lastName}'s Parent`,
                  studentId: student.id,
                  smsType: 'exam_result' as const,
                  subject: `${exam.name} Result`,
                  message,
                  status: 'sent',
                  sentBy: req.session.user!.id
                });
                sentCount++;
              }
            } catch (smsError) {
              console.error('SMS sending error:', smsError);
              smsLogs.push({
                recipientType: 'parent',
                recipientPhone: student.phoneNumber,
                recipientName: `${student.firstName} ${student.lastName}'s Parent`,
                studentId: student.id,
                smsType: 'exam_result',
                subject: `${exam.name} Result`,
                message,
                status: 'failed',
                sentBy: req.session.user!.id
              });
            }
          }
        }

        // Create SMS logs with proper type casting
        await Promise.all(smsLogs.map(log => storage.createSmsLog({
          ...log,
          smsType: log.smsType as 'exam_result'
        })));

        // Update SMS count (deduct sent messages)
        const latestSettings = await storage.getSettings();
        const currentCount = latestSettings?.smsCount || 0;
        const newCount = currentCount - sentCount;
        
        await storage.updateSettings({
          smsCount: newCount,
          updatedBy: req.session.user!.id
        });

        return res.json({ 
          success: true, 
          marksCount: savedMarks.length, 
          smsCount: sentCount,
          balanceUsed: sentCount,
          newBalance: newCount
        });
      }

      res.json({ success: true, marksCount: savedMarks.length });
    } catch (error: any) {
      console.error('Error saving marks:', error);
      res.status(400).json({ message: error.message || 'Failed to save marks' });
    }
  });

  app.post('/api/monthly-exams/:id/finalize', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.finalizeMonthlyExam(id);
      res.json(result);
    } catch (error: any) {
      console.error('Error finalizing monthly exam:', error);
      res.status(400).json({ message: error.message || 'Failed to finalize exam' });
    }
  });

  app.patch('/api/monthly-exams/:id/unfinalize', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const [exam] = await db
        .update(monthlyExams)
        .set({ isFinalized: false, updatedAt: new Date() })
        .where(eq(monthlyExams.id, id))
        .returning();
      res.json(exam);
    } catch (error: any) {
      console.error('Error unfinalizing monthly exam:', error);
      res.status(400).json({ message: error.message || 'Failed to unfinalize exam' });
    }
  });

  app.get('/api/monthly-exams/:id/results', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.session.user!;
      
      // Get the monthly exam to check batch
      const monthlyExam = await storage.getMonthlyExamById(id);
      if (!monthlyExam) {
        return res.status(404).json({ message: 'Monthly exam not found' });
      }
      
      // Students can only view results for their own batch
      if (user.role === 'student' && user.batchId !== monthlyExam.batchId) {
        return res.status(403).json({ message: 'Access denied. You can only view results for your own batch.' });
      }
      
      const results = await storage.getMonthlyResults(id);
      res.json(results);
    } catch (error) {
      console.error('Error fetching results:', error);
      res.status(500).json({ message: 'Failed to fetch results' });
    }
  });

  app.get('/api/monthly-exams/:id/marks', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.session.user!;
      
      // Get the monthly exam to check batch
      const monthlyExam = await storage.getMonthlyExamById(id);
      if (!monthlyExam) {
        return res.status(404).json({ message: 'Monthly exam not found' });
      }
      
      // Students can only view marks for their own batch
      if (user.role === 'student' && user.batchId !== monthlyExam.batchId) {
        return res.status(403).json({ message: 'Access denied. You can only view marks for your own batch.' });
      }
      
      const marks = await storage.getAllMarksByMonthlyExam(id);
      res.json(marks);
    } catch (error) {
      console.error('Error fetching marks:', error);
      res.status(500).json({ message: 'Failed to fetch marks' });
    }
  });

  app.put('/api/monthly-exams/:id/bonus-marks', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { studentId, bonusMarks } = req.body;
      await storage.updateBonusMarks(id, studentId, bonusMarks);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating bonus marks:', error);
      res.status(400).json({ message: error.message || 'Failed to update bonus marks' });
    }
  });

  app.post('/api/monthly-exams/:id/generate-ranking', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.generateFinalRanking(id);
      const results = await storage.getMonthlyResults(id);
      res.json(results);
    } catch (error: any) {
      console.error('Error generating ranking:', error);
      res.status(400).json({ message: error.message || 'Failed to generate ranking' });
    }
  });

  app.get('/api/settings', requireAuth, async (req, res) => {
    try {
      // Disable all caching for settings to ensure fresh SMS balance
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Surrogate-Control', 'no-store');
      
      const settings = await storage.getSettings();
      const responseData = settings || {
        smsCount: 0,
        smsApiKey: '',
        smsSenderId: '8809617628909',
        smsApiUrl: 'http://bulksmsbd.net/api/smsapi'
      };
      
      // Force 200 status and send response
      res.status(200).json(responseData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  app.put('/api/settings', requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const settings = await storage.updateSettings({
        ...updates,
        updatedBy: req.session.user!.id
      });
      res.json(settings);
    } catch (error: any) {
      console.error('Error updating settings:', error);
      res.status(400).json({ message: error.message || 'Failed to update settings' });
    }
  });

  // Get top 3 achievers from current month's finalized monthly exams for each batch (public endpoint)
  app.get('/api/top-achievers', async (req, res) => {
    try {
      const batches = await storage.getAllBatches();
      const allMonthlyExams = await storage.getAllMonthlyExams();
      
      // Get current month and year
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
      const currentYear = now.getFullYear();
      
      // Find current month's finalized exam per batch, fallback to latest if not available
      const latestExamsPerBatch = batches.map(batch => {
        const batchExams = allMonthlyExams.filter(exam => exam.batchId === batch.id && exam.isFinalized);
        
        // Try to find current month's exam first
        let currentMonthExam = batchExams.find(exam => exam.month === currentMonth && exam.year === currentYear);
        
        // If no exam for current month, get the latest finalized exam
        if (!currentMonthExam && batchExams.length > 0) {
          currentMonthExam = batchExams.sort((a, b) => {
            const dateA = new Date(a.year, a.month - 1);
            const dateB = new Date(b.year, b.month - 1);
            return dateB.getTime() - dateA.getTime();
          })[0];
        }
        
        return currentMonthExam ? { batch, exam: currentMonthExam } : null;
      }).filter(Boolean);

      if (latestExamsPerBatch.length === 0) {
        return res.json([]);
      }

      // Bulk fetch all results
      const allResults = await Promise.all(
        latestExamsPerBatch.map(item => item!.exam.id).map(id => storage.getMonthlyResults(id))
      );
      
      // Collect all unique student IDs from top 3 results
      const allStudentIds = new Set<string>();
      const top3PerBatch: Array<{ batch: any, exam: any, results: any[] }> = [];
      
      for (let i = 0; i < latestExamsPerBatch.length; i++) {
        const { batch, exam } = latestExamsPerBatch[i]!;
        const results = allResults[i];
        
        // Get top 3 with valid ranks (1-3), fallback to sorting by finalTotal
        let top3 = results
          .filter(r => r.rank && r.rank >= 1 && r.rank <= 3)
          .sort((a, b) => (a.rank || 999) - (b.rank || 999))
          .slice(0, 3);
        
        // Fallback: if fewer than 3 ranked results, sort by finalTotal
        if (top3.length < 3 && results.length > 0) {
          top3 = results
            .filter(r => r.finalTotal !== null && r.finalTotal !== undefined)
            .sort((a, b) => (b.finalTotal || 0) - (a.finalTotal || 0))
            .slice(0, 3);
        }
        
        top3.forEach(r => allStudentIds.add(r.studentId));
        top3PerBatch.push({ batch, exam, results: top3 });
      }
      
      // Fetch all students in one batch
      const studentMap = new Map();
      const students = await Promise.all(Array.from(allStudentIds).map(id => storage.getUser(id)));
      students.forEach(student => {
        if (student) studentMap.set(student.id, student);
      });
      
      // Build response
      const topAchievers = [];
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      
      for (const { batch, exam, results } of top3PerBatch) {
        const monthYear = `${monthNames[exam.month - 1]} ${exam.year}`;
        
        for (const result of results) {
          const student = studentMap.get(result.studentId);
          if (student) {
            topAchievers.push({
              studentName: `${student.firstName} ${student.lastName}`,
              batchName: batch.name,
              rank: result.rank,
              finalTotal: result.finalTotal,
              percentage: result.percentage,
              examTitle: exam.title,
              monthYear: monthYear
            });
          }
        }
      }

      res.json(topAchievers);
    } catch (error: any) {
      console.error('Error fetching top achievers:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch top achievers' });
    }
  });

  // Super user routes
  app.get('/api/super/teachers', requireSuperUser, async (req, res) => {
    try {
      // Query teachers directly from database since getAllUsers doesn't exist
      const teachers = await db.select().from(users).where(eq(users.role, 'teacher'));
      res.json(teachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      res.status(500).json({ message: 'Failed to fetch teachers' });
    }
  });

  app.put('/api/super/teacher/:id/password', requireSuperUser, async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: 'New password is required' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(id, { password: hashedPassword });

      res.json({ success: true, message: 'Teacher password updated successfully' });
    } catch (error: any) {
      console.error('Error updating teacher password:', error);
      res.status(500).json({ message: error.message || 'Failed to update password' });
    }
  });

  app.put('/api/super/sms-count', requireSuperUser, async (req, res) => {
    try {
      const { smsCount } = req.body;

      if (smsCount === undefined || smsCount === null) {
        return res.status(400).json({ message: 'SMS count is required' });
      }

      const settings = await storage.updateSettings({
        smsCount: parseInt(smsCount),
        updatedBy: req.session.user!.id
      });

      res.json(settings);
    } catch (error: any) {
      console.error('Error updating SMS count:', error);
      res.status(500).json({ message: error.message || 'Failed to update SMS count' });
    }
  });

  // Praggo AI routes
  app.get('/api/syllabus/hierarchy', requireAuth, async (req, res) => {
    try {
      const classes = await db.select().from(syllabusClasses);
      
      const hierarchy = await Promise.all(classes.map(async (cls) => {
        const subjects = await db.select().from(syllabusSubjects).where(eq(syllabusSubjects.classId, cls.id));
        
        const subjectsWithChapters = await Promise.all(subjects.map(async (subject) => {
          const chapters = await db.select().from(syllabusChapters).where(eq(syllabusChapters.subjectId, subject.id));
          return {
            ...subject,
            chapters: chapters.sort((a, b) => a.sequence - b.sequence)
          };
        }));
        
        return {
          ...cls,
          subjects: subjectsWithChapters.sort((a, b) => a.displayOrder - b.displayOrder)
        };
      }));
      
      res.json(hierarchy.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (error: any) {
      console.error('Error fetching syllabus hierarchy:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch syllabus hierarchy' });
    }
  });

  app.post('/api/praggo/generate-questions', requireTeacher, async (req, res) => {
    try {
      const { classId, subjectId, chapterId, questionType, difficulty, category, quantity } = req.body;

      if (!classId || !subjectId || !questionType || !difficulty || !category || !quantity) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const classData = await db.select().from(syllabusClasses).where(eq(syllabusClasses.id, classId)).limit(1);
      const subjectData = await db.select().from(syllabusSubjects).where(eq(syllabusSubjects.id, subjectId)).limit(1);
      
      if (classData.length === 0 || subjectData.length === 0) {
        return res.status(404).json({ message: 'Class or subject not found' });
      }

      let chapterTitle: string | undefined;
      if (chapterId) {
        const chapterData = await db.select().from(syllabusChapters).where(eq(syllabusChapters.id, chapterId)).limit(1);
        if (chapterData.length > 0) {
          chapterTitle = chapterData[0].title;
        }
      }

      const questions = await generateQuestions({
        classId,
        className: classData[0].displayName,
        subjectId,
        subjectName: subjectData[0].displayName,
        chapterId,
        chapterTitle,
        questionType,
        difficulty,
        category,
        quantity: parseInt(quantity)
      });

      res.json(questions);
    } catch (error: any) {
      console.error('Error generating questions:', error);
      res.status(500).json({ message: error.message || 'Failed to generate questions' });
    }
  });

  app.post('/api/praggo/solve', requireAuth, async (req, res) => {
    try {
      const { classId, subjectId, chapterId, prompt, conversationHistory } = req.body;

      if (!classId || !subjectId || !prompt) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const classData = await db.select().from(syllabusClasses).where(eq(syllabusClasses.id, classId)).limit(1);
      const subjectData = await db.select().from(syllabusSubjects).where(eq(syllabusSubjects.id, subjectId)).limit(1);
      
      if (classData.length === 0 || subjectData.length === 0) {
        return res.status(404).json({ message: 'Class or subject not found' });
      }

      let chapterTitle: string | undefined;
      if (chapterId) {
        const chapterData = await db.select().from(syllabusChapters).where(eq(syllabusChapters.id, chapterId)).limit(1);
        if (chapterData.length > 0) {
          chapterTitle = chapterData[0].title;
        }
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const aiStream = solveWithAI({
        classId,
        className: classData[0].displayName,
        subjectId,
        subjectName: subjectData[0].displayName,
        chapterTitle,
        prompt,
        conversationHistory
      });

      for await (const chunk of aiStream) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error('Error in AI solve:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: error.message || 'Failed to process AI request' });
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to process AI request' })}\n\n`);
        res.end();
      }
    }
  });

  // ========== ONLINE EXAM ROUTES ==========
  
  // Teacher: Create online exam
  app.post('/api/online-exams', requireTeacher, async (req, res) => {
    try {
      const { title, classId, subjectId, durationMinutes, maxQuestions } = req.body;
      
      if (!title || !classId || !subjectId || !durationMinutes) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const exam = await storage.createOnlineExam({
        title,
        classId,
        subjectId,
        durationMinutes: parseInt(durationMinutes),
        maxQuestions: parseInt(maxQuestions) || 30,
        createdBy: req.session.user!.id,
        status: 'draft'
      });
      
      res.json(exam);
    } catch (error: any) {
      console.error('Error creating online exam:', error);
      res.status(500).json({ message: error.message || 'Failed to create exam' });
    }
  });
  
  // Teacher: Get all exams created by teacher
  app.get('/api/online-exams', requireTeacher, async (req, res) => {
    try {
      const exams = await storage.getOnlineExamsByTeacher(req.session.user!.id);
      res.json(exams);
    } catch (error: any) {
      console.error('Error fetching online exams:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch exams' });
    }
  });
  
  // Teacher: Get exam by ID with questions
  app.get('/api/online-exams/:id', requireTeacher, async (req, res) => {
    try {
      const exam = await storage.getOnlineExamById(req.params.id);
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }
      
      const questions = await storage.getQuestionsByOnlineExam(exam.id);
      res.json({ ...exam, questions });
    } catch (error: any) {
      console.error('Error fetching online exam:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch exam' });
    }
  });
  
  // Teacher: Update exam
  app.put('/api/online-exams/:id', requireTeacher, async (req, res) => {
    try {
      const exam = await storage.updateOnlineExam(req.params.id, req.body);
      res.json(exam);
    } catch (error: any) {
      console.error('Error updating online exam:', error);
      res.status(500).json({ message: error.message || 'Failed to update exam' });
    }
  });
  
  // Teacher: Publish exam
  app.post('/api/online-exams/:id/publish', requireTeacher, async (req, res) => {
    try {
      const questions = await storage.getQuestionsByOnlineExam(req.params.id);
      if (questions.length === 0) {
        return res.status(400).json({ message: 'Cannot publish exam without questions' });
      }
      
      const exam = await storage.updateOnlineExam(req.params.id, { status: 'published' });
      res.json(exam);
    } catch (error: any) {
      console.error('Error publishing online exam:', error);
      res.status(500).json({ message: error.message || 'Failed to publish exam' });
    }
  });
  
  // Teacher: Delete exam
  app.delete('/api/online-exams/:id', requireTeacher, async (req, res) => {
    try {
      await storage.deleteOnlineExam(req.params.id);
      res.json({ message: 'Exam deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting online exam:', error);
      res.status(500).json({ message: error.message || 'Failed to delete exam' });
    }
  });
  
  // Teacher: Add question to exam
  app.post('/api/online-exams/:id/questions', requireTeacher, async (req, res) => {
    try {
      const { questionText, optionA, optionB, optionC, optionD, correctOption, explanation } = req.body;
      
      if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctOption) {
        return res.status(400).json({ message: 'Missing required question fields' });
      }
      
      const existingQuestions = await storage.getQuestionsByOnlineExam(req.params.id);
      const orderIndex = existingQuestions.length;
      
      const question = await storage.createExamQuestion({
        examId: req.params.id,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
        explanation: explanation || null,
        orderIndex
      });
      
      res.json(question);
    } catch (error: any) {
      console.error('Error adding question:', error);
      res.status(500).json({ message: error.message || 'Failed to add question' });
    }
  });
  
  // Teacher: Get questions for exam
  app.get('/api/online-exams/:id/questions', requireTeacher, async (req, res) => {
    try {
      const questions = await storage.getQuestionsByOnlineExam(req.params.id);
      res.json(questions);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch questions' });
    }
  });
  
  // Teacher: Update question
  app.put('/api/online-exams/:id/questions/:questionId', requireTeacher, async (req, res) => {
    try {
      const question = await storage.updateExamQuestion(req.params.questionId, req.body);
      res.json(question);
    } catch (error: any) {
      console.error('Error updating question:', error);
      res.status(500).json({ message: error.message || 'Failed to update question' });
    }
  });
  
  // Teacher: Delete question
  app.delete('/api/online-exams/:id/questions/:questionId', requireTeacher, async (req, res) => {
    try {
      await storage.deleteExamQuestion(req.params.questionId);
      res.json({ message: 'Question deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting question:', error);
      res.status(500).json({ message: error.message || 'Failed to delete question' });
    }
  });
  
  // Student: Get all published exams
  app.get('/api/student/online-exams', requireStudent, async (req, res) => {
    try {
      const exams = await storage.getPublishedOnlineExams();
      res.json(exams);
    } catch (error: any) {
      console.error('Error fetching published exams:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch exams' });
    }
  });
  
  // Student: Start exam attempt
  app.post('/api/student/online-exams/:id/start', requireStudent, async (req, res) => {
    try {
      const exam = await storage.getOnlineExamById(req.params.id);
      if (!exam || exam.status !== 'published') {
        return res.status(404).json({ message: 'Exam not found or not published' });
      }
      
      const questions = await storage.getQuestionsByOnlineExam(exam.id);
      const previousAttempts = await storage.getStudentAttemptsByExam(exam.id, req.session.user!.id);
      const attemptNumber = previousAttempts.length + 1;
      
      const attempt = await storage.createExamAttempt({
        examId: exam.id,
        studentId: req.session.user!.id,
        attemptNumber,
        startTime: new Date(),
        totalQuestions: questions.length,
        completed: false
      });
      
      res.json({ attempt, questions, serverTime: new Date().toISOString() });
    } catch (error: any) {
      console.error('Error starting exam attempt:', error);
      res.status(500).json({ message: error.message || 'Failed to start exam' });
    }
  });
  
  // Student: Submit exam
  app.post('/api/student/online-exams/attempts/:attemptId/submit', requireStudent, async (req, res) => {
    try {
      const { answers } = req.body;
      const attempt = await storage.getAttemptById(req.params.attemptId);
      
      if (!attempt || attempt.studentId !== req.session.user!.id) {
        return res.status(404).json({ message: 'Attempt not found' });
      }
      
      if (attempt.completed) {
        return res.status(400).json({ message: 'Attempt already submitted' });
      }
      
      const exam = await storage.getOnlineExamById(attempt.examId);
      const questions = await storage.getQuestionsByOnlineExam(attempt.examId);
      
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - new Date(attempt.startTime).getTime()) / 1000);
      const autoSubmitted = exam && duration > exam.durationMinutes * 60;
      
      let score = 0;
      const results = [];
      
      for (const question of questions) {
        const studentAnswer = answers[question.id];
        const isCorrect = studentAnswer === question.correctOption;
        if (isCorrect) score++;
        
        await storage.createAttemptAnswer({
          attemptId: attempt.id,
          questionId: question.id,
          selectedOption: studentAnswer || null,
          isCorrect
        });
        
        results.push({
          questionId: question.id,
          questionText: question.questionText,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          correctOption: question.correctOption,
          selectedOption: studentAnswer,
          isCorrect,
          explanation: question.explanation
        });
      }
      
      await storage.updateExamAttempt(attempt.id, {
        endTime,
        score,
        completed: true,
        autoSubmitted
      });
      
      res.json({
        score,
        totalQuestions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        results,
        autoSubmitted
      });
    } catch (error: any) {
      console.error('Error submitting exam:', error);
      res.status(500).json({ message: error.message || 'Failed to submit exam' });
    }
  });
  
  // Student: Get student attempts for an exam
  app.get('/api/student/online-exams/:id/attempts', requireStudent, async (req, res) => {
    try {
      const attempts = await storage.getStudentAttemptsByExam(req.params.id, req.session.user!.id);
      res.json(attempts);
    } catch (error: any) {
      console.error('Error fetching attempts:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch attempts' });
    }
  });
  
  // Student: Get attempt result
  app.get('/api/student/online-exams/attempts/:attemptId/result', requireStudent, async (req, res) => {
    try {
      const attempt = await storage.getAttemptById(req.params.attemptId);
      if (!attempt || attempt.studentId !== req.session.user!.id) {
        return res.status(404).json({ message: 'Attempt not found' });
      }
      
      const answers = await storage.getAnswersByAttempt(attempt.id);
      const questions = await storage.getQuestionsByOnlineExam(attempt.examId);
      
      const results = questions.map(q => {
        const answer = answers.find(a => a.questionId === q.id);
        return {
          questionId: q.id,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          selectedOption: answer?.selectedOption || null,
          isCorrect: answer?.isCorrect || false,
          explanation: q.explanation
        };
      });
      
      res.json({
        attempt,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        percentage: Math.round((attempt.score / attempt.totalQuestions) * 100),
        results
      });
    } catch (error: any) {
      console.error('Error fetching result:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch result' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
