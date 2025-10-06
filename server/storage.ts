// Referenced from javascript_database blueprint - DatabaseStorage implementation
import {
  users,
  batches,
  exams,
  questions,
  examSubmissions,
  attendance,
  studentFees,
  smsLogs,
  questionBank,
  notices,
  monthlyExams,
  individualExams,
  monthlyMarks,
  monthlyResults,
  smsTemplates,
  settings,
  syllabusClasses,
  syllabusSubjects,
  syllabusChapters,
  type User,
  type InsertUser,
  type Batch,
  type InsertBatch,
  type Exam,
  type InsertExam,
  type Question,
  type InsertQuestion,
  type ExamSubmission,
  type InsertExamSubmission,
  type Attendance,
  type InsertAttendance,
  type StudentFee,
  type InsertStudentFee,
  type SmsLog,
  type InsertSmsLog,
  type QuestionBankItem,
  type InsertQuestionBank,
  type Notice,
  type InsertNotice,
  type MonthlyExam,
  type InsertMonthlyExam,
  type IndividualExam,
  type InsertIndividualExam,
  type MonthlyMark,
  type InsertMonthlyMark,
  type MonthlyResult,
  type SmsTemplate,
  type InsertSmsTemplate,
  type Settings,
  type InsertSettings,
  type SyllabusClass,
  type SyllabusSubject,
  type SyllabusChapter,
  onlineExams,
  examQuestions,
  examAttempts,
  attemptAnswers,
  type OnlineExam,
  type InsertOnlineExam,
  type ExamQuestion,
  type InsertExamQuestion,
  type ExamAttempt,
  type InsertExamAttempt,
  type AttemptAnswer,
  type InsertAttemptAnswer
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getAllStudents(): Promise<User[]>;
  getStudentsByBatch(batchId: string): Promise<User[]>;
  
  // Batch operations
  getBatchById(id: string): Promise<Batch | undefined>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatch(id: string, batch: Partial<InsertBatch>): Promise<Batch>;
  deleteBatch(id: string): Promise<void>;
  getAllBatches(): Promise<Batch[]>;
  
  // Exam operations
  getExamById(id: string): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: string, exam: Partial<InsertExam>): Promise<Exam>;
  deleteExam(id: string): Promise<void>;
  getAllExams(): Promise<Exam[]>;
  getExamsByBatch(batchId: string): Promise<Exam[]>;
  
  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsByExam(examId: string): Promise<Question[]>;
  
  // Exam submission operations
  createExamSubmission(submission: InsertExamSubmission): Promise<ExamSubmission>;
  getSubmissionsByExam(examId: string): Promise<ExamSubmission[]>;
  getSubmissionsByStudent(studentId: string): Promise<ExamSubmission[]>;
  
  // Attendance operations
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceByStudent(studentId: string): Promise<Attendance[]>;
  getAttendanceByBatch(batchId: string, date?: Date): Promise<Attendance[]>;
  
  // Fee operations
  createFee(fee: InsertStudentFee): Promise<StudentFee>;
  updateFee(id: string, fee: Partial<InsertStudentFee>): Promise<StudentFee>;
  upsertFee(fee: InsertStudentFee): Promise<StudentFee>;
  getFeesByStudent(studentId: string): Promise<StudentFee[]>;
  getFeesByBatchAndYear(batchId: string, year: number): Promise<StudentFee[]>;
  getAllFees(): Promise<StudentFee[]>;
  
  // SMS operations
  createSmsLog(smsLog: InsertSmsLog): Promise<SmsLog>;
  getSmsLogs(): Promise<SmsLog[]>;

  // Syllabus operations
  getAllClasses(): Promise<SyllabusClass[]>;
  getSubjectsByClass(classId: string): Promise<SyllabusSubject[]>;
  getChaptersBySubject(subjectId: string): Promise<SyllabusChapter[]>;
  getSyllabusHierarchy(): Promise<any>;
  
  // Question bank operations
  createQuestionBankItem(item: InsertQuestionBank): Promise<QuestionBankItem>;
  getQuestionBankItems(): Promise<QuestionBankItem[]>;
  
  // Notice operations
  createNotice(notice: InsertNotice): Promise<Notice>;
  getActiveNotices(): Promise<Notice[]>;
  
  // Monthly Exam operations
  getAllMonthlyExams(): Promise<MonthlyExam[]>;
  getMonthlyExamById(id: string): Promise<MonthlyExam | undefined>;
  getMonthlyExamsByBatch(batchId: string): Promise<MonthlyExam[]>;
  createMonthlyExam(monthlyExam: InsertMonthlyExam): Promise<MonthlyExam>;
  finalizeMonthlyExam(id: string): Promise<MonthlyExam>;
  
  // Individual Exam operations
  getExamsByMonthlyExam(monthlyExamId: string): Promise<IndividualExam[]>;
  getIndividualExamsByMonthlyExam(monthlyExamId: string): Promise<IndividualExam[]>;
  getIndividualExamById(id: string): Promise<IndividualExam | undefined>;
  createIndividualExam(exam: InsertIndividualExam): Promise<IndividualExam>;
  
  // Monthly Mark operations
  getMarksByExam(examId: string): Promise<MonthlyMark[]>;
  getAllMarksByMonthlyExam(monthlyExamId: string): Promise<MonthlyMark[]>;
  getMonthlyMarkByStudentAndExam(studentId: string, individualExamId: string): Promise<MonthlyMark | undefined>;
  createOrUpdateMonthlyMark(mark: InsertMonthlyMark): Promise<MonthlyMark>;
  
  // Monthly Result operations
  getMonthlyResults(monthlyExamId: string): Promise<MonthlyResult[]>;
  getMonthlyResultByStudentAndExam(studentId: string, monthlyExamId: string): Promise<MonthlyResult | undefined>;
  updateBonusMarks(monthlyExamId: string, studentId: string, bonusMarks: number): Promise<void>;
  generateFinalRanking(monthlyExamId: string): Promise<void>;
  
  // SMS Template operations
  getSmsTemplates(): Promise<SmsTemplate[]>;
  createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate>;
  updateSmsTemplate(id: string, template: Partial<InsertSmsTemplate>): Promise<SmsTemplate>;
  deleteSmsTemplate(id: string): Promise<void>;
  
  // Settings operations
  getSettings(): Promise<Settings | undefined>;
  updateSettings(data: Partial<InsertSettings>): Promise<Settings>;
  
  // Online Exam operations
  createOnlineExam(exam: InsertOnlineExam): Promise<OnlineExam>;
  getOnlineExamById(id: string): Promise<OnlineExam | undefined>;
  getAllOnlineExams(): Promise<OnlineExam[]>;
  getOnlineExamsByTeacher(teacherId: string): Promise<OnlineExam[]>;
  getPublishedOnlineExams(): Promise<OnlineExam[]>;
  updateOnlineExam(id: string, exam: Partial<InsertOnlineExam>): Promise<OnlineExam>;
  deleteOnlineExam(id: string): Promise<void>;
  
  // Exam Question operations
  createExamQuestion(question: InsertExamQuestion): Promise<ExamQuestion>;
  getQuestionsByOnlineExam(examId: string): Promise<ExamQuestion[]>;
  updateExamQuestion(id: string, question: Partial<InsertExamQuestion>): Promise<ExamQuestion>;
  deleteExamQuestion(id: string): Promise<void>;
  
  // Exam Attempt operations
  createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt>;
  getAttemptById(id: string): Promise<ExamAttempt | undefined>;
  getAttemptsByStudent(studentId: string): Promise<ExamAttempt[]>;
  getAttemptsByExam(examId: string): Promise<ExamAttempt[]>;
  getStudentAttemptsByExam(examId: string, studentId: string): Promise<ExamAttempt[]>;
  updateExamAttempt(id: string, attempt: Partial<InsertExamAttempt>): Promise<ExamAttempt>;
  
  // Attempt Answer operations
  createAttemptAnswer(answer: InsertAttemptAnswer): Promise<AttemptAnswer>;
  getAnswersByAttempt(attemptId: string): Promise<AttemptAnswer[]>;
  updateAttemptAnswer(id: string, answer: Partial<InsertAttemptAnswer>): Promise<AttemptAnswer>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllStudents(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'student')).orderBy(desc(users.createdAt));
  }

  async getStudentsByBatch(batchId: string): Promise<User[]> {
    return await db.select().from(users).where(
      and(
        eq(users.role, 'student'),
        eq(users.batchId, batchId)
      )
    ).orderBy(users.firstName);
  }

  // Batch operations
  async getBatchById(id: string): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    return batch || undefined;
  }

  async createBatch(insertBatch: InsertBatch): Promise<Batch> {
    const [batch] = await db
      .insert(batches)
      .values(insertBatch)
      .returning();
    return batch;
  }

  async updateBatch(id: string, updateData: Partial<InsertBatch>): Promise<Batch> {
    const [batch] = await db
      .update(batches)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(batches.id, id))
      .returning();
    return batch;
  }

  async deleteBatch(id: string): Promise<void> {
    // Delete all related records first to avoid foreign key constraint violations
    // 1. Delete attendance records
    await db.delete(attendance).where(eq(attendance.batchId, id));
    
    // 2. Delete student fees
    await db.delete(studentFees).where(eq(studentFees.batchId, id));
    
    // 3. Delete monthly exam related records
    const monthlyExamsForBatch = await db.select().from(monthlyExams).where(eq(monthlyExams.batchId, id));
    const monthlyExamIds = monthlyExamsForBatch.map(me => me.id);
    
    if (monthlyExamIds.length > 0) {
      // Delete individual exams within these monthly exams
      const individualExamsForBatch = await db.select().from(individualExams).where(inArray(individualExams.monthlyExamId, monthlyExamIds));
      const individualExamIds = individualExamsForBatch.map(ie => ie.id);
      
      if (individualExamIds.length > 0) {
        // Delete monthly marks for these individual exams
        await db.delete(monthlyMarks).where(inArray(monthlyMarks.individualExamId, individualExamIds));
      }
      
      // Delete individual exams
      await db.delete(individualExams).where(inArray(individualExams.monthlyExamId, monthlyExamIds));
      
      // Delete monthly results
      await db.delete(monthlyResults).where(inArray(monthlyResults.monthlyExamId, monthlyExamIds));
      
      // Delete monthly exams
      await db.delete(monthlyExams).where(eq(monthlyExams.batchId, id));
    }
    
    // 4. Delete exams and their related data
    const examsForBatch = await db.select().from(exams).where(eq(exams.batchId, id));
    const examIds = examsForBatch.map(e => e.id);
    
    if (examIds.length > 0) {
      // Delete exam submissions
      await db.delete(examSubmissions).where(inArray(examSubmissions.examId, examIds));
      
      // Delete questions
      await db.delete(questions).where(inArray(questions.examId, examIds));
      
      // Delete exams
      await db.delete(exams).where(eq(exams.batchId, id));
    }
    
    // 5. Finally delete the batch itself
    await db.delete(batches).where(eq(batches.id, id));
  }

  async getAllBatches(): Promise<Batch[]> {
    return await db.select().from(batches).orderBy(desc(batches.createdAt));
  }

  // Exam operations
  async getExamById(id: string): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam || undefined;
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const [exam] = await db
      .insert(exams)
      .values(insertExam)
      .returning();
    return exam;
  }

  async updateExam(id: string, updateData: Partial<InsertExam>): Promise<Exam> {
    const [exam] = await db
      .update(exams)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(exams.id, id))
      .returning();
    return exam;
  }

  async deleteExam(id: string): Promise<void> {
    await db.delete(exams).where(eq(exams.id, id));
  }

  async getAllExams(): Promise<Exam[]> {
    return await db.select().from(exams).orderBy(desc(exams.createdAt));
  }

  async getExamsByBatch(batchId: string): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.batchId, batchId)).orderBy(desc(exams.createdAt));
  }

  // Question operations
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(insertQuestion)
      .returning();
    return question;
  }

  async getQuestionsByExam(examId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.examId, examId)).orderBy(questions.orderIndex);
  }

  // Exam submission operations
  async createExamSubmission(insertSubmission: InsertExamSubmission): Promise<ExamSubmission> {
    const [submission] = await db
      .insert(examSubmissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getSubmissionsByExam(examId: string): Promise<ExamSubmission[]> {
    return await db.select().from(examSubmissions).where(eq(examSubmissions.examId, examId));
  }

  async getSubmissionsByStudent(studentId: string): Promise<ExamSubmission[]> {
    return await db.select().from(examSubmissions).where(eq(examSubmissions.studentId, studentId)).orderBy(desc(examSubmissions.createdAt));
  }

  // Attendance operations
  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [attendanceRecord] = await db
      .insert(attendance)
      .values(insertAttendance)
      .returning();
    return attendanceRecord;
  }

  async getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.studentId, studentId)).orderBy(desc(attendance.date));
  }

  async getAttendanceByBatch(batchId: string, date?: Date): Promise<Attendance[]> {
    if (date) {
      return await db.select().from(attendance).where(
        and(
          eq(attendance.batchId, batchId),
          eq(attendance.date, date)
        )
      );
    }
    return await db.select().from(attendance).where(eq(attendance.batchId, batchId)).orderBy(desc(attendance.date));
  }

  // Fee operations
  async createFee(insertFee: InsertStudentFee): Promise<StudentFee> {
    const [fee] = await db
      .insert(studentFees)
      .values(insertFee)
      .returning();
    return fee;
  }

  async updateFee(id: string, updateData: Partial<InsertStudentFee>): Promise<StudentFee> {
    const [fee] = await db
      .update(studentFees)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(studentFees.id, id))
      .returning();
    return fee;
  }

  async upsertFee(insertFee: InsertStudentFee): Promise<StudentFee> {
    const [fee] = await db
      .insert(studentFees)
      .values(insertFee)
      .onConflictDoUpdate({
        target: [studentFees.studentId, studentFees.batchId, studentFees.month, studentFees.year],
        set: {
          amount: insertFee.amount,
          status: insertFee.status,
          paidAmount: insertFee.paidAmount,
          paidDate: insertFee.paidDate,
          dueDate: insertFee.dueDate,
          notes: insertFee.notes,
          updatedAt: new Date()
        }
      })
      .returning();
    return fee;
  }

  async getFeesByStudent(studentId: string): Promise<StudentFee[]> {
    return await db.select().from(studentFees).where(eq(studentFees.studentId, studentId)).orderBy(desc(studentFees.createdAt));
  }

  async getFeesByBatchAndYear(batchId: string, year: number): Promise<StudentFee[]> {
    return await db.select().from(studentFees).where(
      and(
        eq(studentFees.batchId, batchId),
        eq(studentFees.year, year)
      )
    ).orderBy(studentFees.month);
  }

  async getAllFees(): Promise<StudentFee[]> {
    return await db.select().from(studentFees).orderBy(desc(studentFees.createdAt));
  }

  // SMS operations
  async createSmsLog(insertSmsLog: InsertSmsLog): Promise<SmsLog> {
    const [smsLog] = await db
      .insert(smsLogs)
      .values(insertSmsLog)
      .returning();
    return smsLog;
  }

  async getSmsLogs(): Promise<SmsLog[]> {
    return await db.select().from(smsLogs).orderBy(desc(smsLogs.createdAt));
  }

  // Question bank operations
  async createQuestionBankItem(insertItem: InsertQuestionBank): Promise<QuestionBankItem> {
    const [item] = await db
      .insert(questionBank)
      .values(insertItem)
      .returning();
    return item;
  }

  async getQuestionBankItems(): Promise<QuestionBankItem[]> {
    return await db.select().from(questionBank).orderBy(desc(questionBank.createdAt));
  }

  // Notice operations
  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    const [notice] = await db
      .insert(notices)
      .values(insertNotice)
      .returning();
    return notice;
  }

  async getActiveNotices(): Promise<Notice[]> {
    return await db.select().from(notices).where(eq(notices.isActive, true)).orderBy(desc(notices.createdAt));
  }

  // Monthly Exam operations
  async getAllMonthlyExams(): Promise<MonthlyExam[]> {
    return await db.select().from(monthlyExams).orderBy(desc(monthlyExams.createdAt));
  }

  async getMonthlyExamById(id: string): Promise<MonthlyExam | undefined> {
    const [exam] = await db.select().from(monthlyExams).where(eq(monthlyExams.id, id));
    return exam || undefined;
  }

  async createMonthlyExam(insertMonthlyExam: InsertMonthlyExam): Promise<MonthlyExam> {
    const [exam] = await db
      .insert(monthlyExams)
      .values(insertMonthlyExam)
      .returning();
    return exam;
  }

  async getMonthlyExamsByBatch(batchId: string): Promise<MonthlyExam[]> {
    return await db.select().from(monthlyExams).where(eq(monthlyExams.batchId, batchId)).orderBy(desc(monthlyExams.createdAt));
  }

  async finalizeMonthlyExam(id: string): Promise<MonthlyExam> {
    await this.generateFinalRanking(id);
    
    const [exam] = await db
      .update(monthlyExams)
      .set({ isFinalized: true, updatedAt: new Date() })
      .where(eq(monthlyExams.id, id))
      .returning();
    
    return exam;
  }

  // Individual Exam operations
  async getExamsByMonthlyExam(monthlyExamId: string): Promise<IndividualExam[]> {
    return await db.select().from(individualExams).where(eq(individualExams.monthlyExamId, monthlyExamId)).orderBy(desc(individualExams.createdAt));
  }

  async getIndividualExamsByMonthlyExam(monthlyExamId: string): Promise<IndividualExam[]> {
    return await this.getExamsByMonthlyExam(monthlyExamId);
  }

  async getIndividualExamById(id: string): Promise<IndividualExam | undefined> {
    const [exam] = await db.select().from(individualExams).where(eq(individualExams.id, id));
    return exam || undefined;
  }

  async createIndividualExam(insertExam: InsertIndividualExam): Promise<IndividualExam> {
    const [exam] = await db
      .insert(individualExams)
      .values(insertExam)
      .returning();
    return exam;
  }

  // Monthly Mark operations
  async getMarksByExam(examId: string): Promise<MonthlyMark[]> {
    return await db.select().from(monthlyMarks).where(eq(monthlyMarks.individualExamId, examId));
  }

  async getAllMarksByMonthlyExam(monthlyExamId: string): Promise<MonthlyMark[]> {
    return await db.select().from(monthlyMarks).where(eq(monthlyMarks.monthlyExamId, monthlyExamId));
  }

  async getMonthlyMarkByStudentAndExam(studentId: string, individualExamId: string): Promise<MonthlyMark | undefined> {
    const [mark] = await db
      .select()
      .from(monthlyMarks)
      .where(and(eq(monthlyMarks.studentId, studentId), eq(monthlyMarks.individualExamId, individualExamId)));
    return mark || undefined;
  }

  async createOrUpdateMonthlyMark(insertMark: InsertMonthlyMark): Promise<MonthlyMark> {
    const [mark] = await db
      .insert(monthlyMarks)
      .values(insertMark)
      .onConflictDoUpdate({
        target: [monthlyMarks.monthlyExamId, monthlyMarks.individualExamId, monthlyMarks.studentId],
        set: { obtainedMarks: insertMark.obtainedMarks, updatedAt: new Date() }
      })
      .returning();
    return mark;
  }

  // Monthly Result operations
  async getMonthlyResults(monthlyExamId: string): Promise<MonthlyResult[]> {
    return await db.select().from(monthlyResults).where(eq(monthlyResults.monthlyExamId, monthlyExamId)).orderBy(monthlyResults.rank);
  }

  async getMonthlyResultByStudentAndExam(studentId: string, monthlyExamId: string): Promise<MonthlyResult | undefined> {
    const [result] = await db
      .select()
      .from(monthlyResults)
      .where(and(eq(monthlyResults.studentId, studentId), eq(monthlyResults.monthlyExamId, monthlyExamId)));
    return result || undefined;
  }

  async updateBonusMarks(monthlyExamId: string, studentId: string, bonusMarks: number): Promise<void> {
    // Check if monthly exam is finalized
    const exam = await this.getMonthlyExamById(monthlyExamId);
    if (exam?.isFinalized) {
      throw new Error('Cannot update bonus marks for finalized exam');
    }

    // Update bonus marks - allow insert if row doesn't exist (before first ranking generation)
    await db
      .insert(monthlyResults)
      .values({
        monthlyExamId,
        studentId,
        bonusMarks,
        totalExamMarks: 0,
        attendanceMarks: 0,
        finalTotal: bonusMarks
      })
      .onConflictDoUpdate({
        target: [monthlyResults.monthlyExamId, monthlyResults.studentId],
        set: { bonusMarks, updatedAt: new Date() }
      });
  }

  async generateFinalRanking(monthlyExamId: string): Promise<void> {
    const monthlyExam = await this.getMonthlyExamById(monthlyExamId);
    if (!monthlyExam) throw new Error('Monthly exam not found');
    if (monthlyExam.isFinalized) throw new Error('Cannot regenerate ranking for finalized exam');

    const monthStart = new Date(monthlyExam.year, monthlyExam.month - 1, 1);
    const monthEnd = new Date(monthlyExam.year, monthlyExam.month, 0);

    const batchStudents = await db.select().from(users).where(eq(users.batchId, monthlyExam.batchId!));
    const allMarks = await db.select().from(monthlyMarks).where(eq(monthlyMarks.monthlyExamId, monthlyExamId));
    const attendanceRecords = await db.select().from(attendance).where(
      and(
        eq(attendance.batchId, monthlyExam.batchId!),
        gte(attendance.date, monthStart),
        lte(attendance.date, monthEnd),
        eq(attendance.attendanceStatus, 'present')
      )
    );
    const existingResults = await db.select().from(monthlyResults).where(eq(monthlyResults.monthlyExamId, monthlyExamId));
    const bonusMap = new Map(existingResults.map(r => [r.studentId, r.bonusMarks || 0]));
    
    const individualExams = await this.getExamsByMonthlyExam(monthlyExamId);
    const totalPossibleMarks = individualExams.reduce((sum, exam) => sum + (exam.totalMarks || 0), 0);

    const studentResults: Array<{
      studentId: string;
      totalExamMarks: number;
      attendanceMarks: number;
      bonusMarks: number;
      finalTotal: number;
      percentage: number;
      gpa: number;
    }> = [];

    // Helper function to calculate GPA based on percentage
    const calculateGPA = (percentage: number): number => {
      if (percentage >= 80) return 5.0;
      if (percentage >= 70) return 4.0;
      if (percentage >= 60) return 3.5;
      if (percentage >= 50) return 3.0;
      if (percentage >= 40) return 2.0;
      if (percentage >= 33) return 1.0;
      return 0.0;
    };

    for (const student of batchStudents) {
      const examMarks = allMarks.filter(m => m.studentId === student.id)
        .reduce((sum, mark) => sum + (mark.obtainedMarks || 0), 0);
      
      const attendance = attendanceRecords.filter(a => a.studentId === student.id).length;
      
      const bonusMarks = bonusMap.get(student.id) || 0;
      const finalTotal = examMarks + attendance + bonusMarks;
      const percentage = totalPossibleMarks > 0 ? (examMarks / totalPossibleMarks) * 100 : 0;
      const gpa = calculateGPA(percentage);

      studentResults.push({
        studentId: student.id,
        totalExamMarks: examMarks,
        attendanceMarks: attendance,
        bonusMarks,
        finalTotal,
        percentage: Number(percentage.toFixed(2)),
        gpa: Number(gpa.toFixed(2))
      });
    }

    studentResults.sort((a, b) => b.finalTotal - a.finalTotal);

    for (let i = 0; i < studentResults.length; i++) {
      const result = studentResults[i];
      await db
        .insert(monthlyResults)
        .values({
          monthlyExamId,
          studentId: result.studentId,
          totalExamMarks: result.totalExamMarks,
          attendanceMarks: result.attendanceMarks,
          bonusMarks: result.bonusMarks,
          finalTotal: result.finalTotal,
          percentage: result.percentage.toString(),
          gpa: result.gpa.toString(),
          rank: i + 1
        })
        .onConflictDoUpdate({
          target: [monthlyResults.monthlyExamId, monthlyResults.studentId],
          set: {
            totalExamMarks: result.totalExamMarks,
            attendanceMarks: result.attendanceMarks,
            finalTotal: result.finalTotal,
            percentage: result.percentage.toString(),
            gpa: result.gpa.toString(),
            rank: i + 1,
            updatedAt: new Date()
          }
        });
    }
  }

  // SMS Template operations
  async getSmsTemplates(): Promise<SmsTemplate[]> {
    return await db.select().from(smsTemplates).orderBy(smsTemplates.name);
  }

  async createSmsTemplate(insertTemplate: InsertSmsTemplate): Promise<SmsTemplate> {
    const [template] = await db
      .insert(smsTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateSmsTemplate(id: string, data: Partial<InsertSmsTemplate>): Promise<SmsTemplate> {
    const [template] = await db
      .update(smsTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(smsTemplates.id, id))
      .returning();
    return template;
  }

  async deleteSmsTemplate(id: string): Promise<void> {
    await db.delete(smsTemplates).where(eq(smsTemplates.id, id));
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).limit(1);
    return setting || undefined;
  }

  async updateSettings(updateData: Partial<InsertSettings>): Promise<Settings> {
    const existing = await this.getSettings();
    
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(settings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(settings)
        .values(updateData as InsertSettings)
        .returning();
      return created;
    }
  }

  // Syllabus operations
  async getAllClasses(): Promise<SyllabusClass[]> {
    return await db.select().from(syllabusClasses).orderBy(syllabusClasses.displayOrder);
  }

  async getSubjectsByClass(classId: string): Promise<SyllabusSubject[]> {
    return await db
      .select()
      .from(syllabusSubjects)
      .where(eq(syllabusSubjects.classId, classId))
      .orderBy(syllabusSubjects.displayOrder);
  }

  async getChaptersBySubject(subjectId: string): Promise<SyllabusChapter[]> {
    return await db
      .select()
      .from(syllabusChapters)
      .where(eq(syllabusChapters.subjectId, subjectId))
      .orderBy(syllabusChapters.sequence);
  }

  async getSyllabusHierarchy(): Promise<any> {
    const classes = await this.getAllClasses();
    const result = await Promise.all(
      classes.map(async (classItem) => {
        const subjects = await this.getSubjectsByClass(classItem.id);
        const subjectsWithChapters = await Promise.all(
          subjects.map(async (subject) => {
            const chapters = await this.getChaptersBySubject(subject.id);
            return { ...subject, chapters };
          })
        );
        return { ...classItem, subjects: subjectsWithChapters };
      })
    );
    return result;
  }

  // Online Exam operations
  async createOnlineExam(exam: InsertOnlineExam): Promise<OnlineExam> {
    const [created] = await db.insert(onlineExams).values(exam).returning();
    return created;
  }

  async getOnlineExamById(id: string): Promise<OnlineExam | undefined> {
    const [exam] = await db.select().from(onlineExams).where(eq(onlineExams.id, id));
    return exam || undefined;
  }

  async getAllOnlineExams(): Promise<OnlineExam[]> {
    return await db.select().from(onlineExams).orderBy(desc(onlineExams.createdAt));
  }

  async getOnlineExamsByTeacher(teacherId: string): Promise<OnlineExam[]> {
    return await db.select().from(onlineExams).where(eq(onlineExams.createdBy, teacherId)).orderBy(desc(onlineExams.createdAt));
  }

  async getPublishedOnlineExams(): Promise<OnlineExam[]> {
    return await db.select().from(onlineExams).where(eq(onlineExams.status, 'published')).orderBy(desc(onlineExams.createdAt));
  }

  async updateOnlineExam(id: string, exam: Partial<InsertOnlineExam>): Promise<OnlineExam> {
    const [updated] = await db.update(onlineExams).set({ ...exam, updatedAt: new Date() }).where(eq(onlineExams.id, id)).returning();
    return updated;
  }

  async deleteOnlineExam(id: string): Promise<void> {
    await db.delete(onlineExams).where(eq(onlineExams.id, id));
  }

  // Exam Question operations
  async createExamQuestion(question: InsertExamQuestion): Promise<ExamQuestion> {
    const [created] = await db.insert(examQuestions).values(question).returning();
    return created;
  }

  async getQuestionsByOnlineExam(examId: string): Promise<ExamQuestion[]> {
    return await db.select().from(examQuestions).where(eq(examQuestions.examId, examId)).orderBy(examQuestions.orderIndex);
  }

  async updateExamQuestion(id: string, question: Partial<InsertExamQuestion>): Promise<ExamQuestion> {
    const [updated] = await db.update(examQuestions).set(question).where(eq(examQuestions.id, id)).returning();
    return updated;
  }

  async deleteExamQuestion(id: string): Promise<void> {
    await db.delete(examQuestions).where(eq(examQuestions.id, id));
  }

  // Exam Attempt operations
  async createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt> {
    const [created] = await db.insert(examAttempts).values(attempt).returning();
    return created;
  }

  async getAttemptById(id: string): Promise<ExamAttempt | undefined> {
    const [attempt] = await db.select().from(examAttempts).where(eq(examAttempts.id, id));
    return attempt || undefined;
  }

  async getAttemptsByStudent(studentId: string): Promise<ExamAttempt[]> {
    return await db.select().from(examAttempts).where(eq(examAttempts.studentId, studentId)).orderBy(desc(examAttempts.createdAt));
  }

  async getAttemptsByExam(examId: string): Promise<ExamAttempt[]> {
    return await db.select().from(examAttempts).where(eq(examAttempts.examId, examId)).orderBy(desc(examAttempts.createdAt));
  }

  async getStudentAttemptsByExam(examId: string, studentId: string): Promise<ExamAttempt[]> {
    return await db.select().from(examAttempts).where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, studentId))).orderBy(desc(examAttempts.attemptNumber));
  }

  async updateExamAttempt(id: string, attempt: Partial<InsertExamAttempt>): Promise<ExamAttempt> {
    const [updated] = await db.update(examAttempts).set(attempt).where(eq(examAttempts.id, id)).returning();
    return updated;
  }

  // Attempt Answer operations
  async createAttemptAnswer(answer: InsertAttemptAnswer): Promise<AttemptAnswer> {
    const [created] = await db.insert(attemptAnswers).values(answer).returning();
    return created;
  }

  async getAnswersByAttempt(attemptId: string): Promise<AttemptAnswer[]> {
    return await db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, attemptId));
  }

  async updateAttemptAnswer(id: string, answer: Partial<InsertAttemptAnswer>): Promise<AttemptAnswer> {
    const [updated] = await db.update(attemptAnswers).set(answer).where(eq(attemptAnswers.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
