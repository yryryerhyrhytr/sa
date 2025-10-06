import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  text,
  sqliteTable,
  integer,
  real,
  blob,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for SQLite
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(), // JSON string
    expire: integer("expire").notNull(), // Unix timestamp
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Batches table
export const batches = sqliteTable("batches", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  name: text("name").notNull(),
  subject: text("subject").notNull(), // 'math', 'higher_math', 'science'
  batchCode: text("batch_code").notNull().unique(),
  password: text("password").notNull(),
  maxStudents: integer("max_students").default(50),
  currentStudents: integer("current_students").default(0),
  startDate: integer("start_date"), // Unix timestamp
  endDate: integer("end_date"), // Unix timestamp
  classTime: text("class_time"),
  classDays: text("class_days"),
  schedule: text("schedule"),
  status: text("status").notNull().default('active'), // 'active', 'inactive', 'completed'
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").default(sql`unixepoch()`),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
});

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  username: text("username"),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default('student'), // 'teacher', 'student', 'super_user'
  email: text("email"),
  smsCount: integer("sms_count").default(0),
  studentId: text("student_id"),
  phoneNumber: text("phone_number"),
  studentPassword: text("student_password"),
  address: text("address"),
  dateOfBirth: integer("date_of_birth"), // Unix timestamp
  gender: text("gender"),
  institution: text("institution"),
  classLevel: text("class_level"),
  batchId: text("batch_id"),
  admissionDate: integer("admission_date"), // Unix timestamp
  isActive: integer("is_active").default(1), // 1 for true, 0 for false
  lastLogin: integer("last_login"), // Unix timestamp
  createdAt: integer("created_at").default(sql`unixepoch()`),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
});

// Exams table
export const exams = sqliteTable("exams", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  title: text("title").notNull(),
  subject: text("subject").notNull(), // 'math', 'higher_math', 'science'
  chapter: text("chapter"),
  targetClass: text("target_class"),
  description: text("description"),
  instructions: text("instructions"),
  examDate: integer("exam_date"), // Unix timestamp
  duration: integer("duration").notNull(),
  examType: text("exam_type").notNull(),
  examMode: text("exam_mode").notNull(),
  batchId: text("batch_id"),
  targetStudents: text("target_students"), // JSON string
  questionSource: text("question_source"),
  questionContent: text("question_content"),
  questionPaperImage: text("question_paper_image"),
  totalMarks: integer("total_marks").default(0),
  isActive: integer("is_active").default(1), // 1 for true, 0 for false
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").default(sql`unixepoch()`),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
});

// Questions table
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  examId: text("exam_id").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(),
  options: text("options"), // JSON string
  correctAnswer: text("correct_answer"),
  questionImage: text("question_image"),
  driveLink: text("drive_link"),
  marks: integer("marks").notNull().default(1),
  orderIndex: integer("order_index").notNull(),
  createdAt: integer("created_at").default(sql`unixepoch()`),
});

// Exam submissions table
export const examSubmissions = sqliteTable("exam_submissions", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  examId: text("exam_id").notNull(),
  studentId: text("student_id").notNull(),
  answers: text("answers"), // JSON string
  score: integer("score"),
  manualMarks: integer("manual_marks"),
  totalMarks: integer("total_marks"),
  percentage: integer("percentage"),
  rank: integer("rank"),
  isSubmitted: integer("is_submitted").default(0), // 1 for true, 0 for false
  submittedAt: integer("submitted_at"), // Unix timestamp
  timeSpent: integer("time_spent"),
  feedback: text("feedback"),
  createdAt: integer("created_at").default(sql`unixepoch()`),
});

// Attendance table
export const attendance = sqliteTable("attendance", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  studentId: text("student_id").notNull(),
  batchId: text("batch_id").notNull(),
  date: integer("date").notNull(), // Unix timestamp
  attendanceStatus: text("attendance_status").notNull().default("present"), // "present", "excused", "absent"
  subject: text("subject"), // 'math', 'higher_math', 'science'
  notes: text("notes"),
  markedBy: text("marked_by").notNull(),
  markedAt: integer("marked_at").default(sql`unixepoch()`),
  createdAt: integer("created_at").default(sql`unixepoch()`),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
});

// Student fees table
export const studentFees = sqliteTable("student_fees", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  studentId: text("student_id").notNull(),
  batchId: text("batch_id").notNull(),
  amount: real("amount").notNull(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'completed', 'failed', 'cancelled'
  paidAmount: real("paid_amount").default(0),
  paidDate: integer("paid_date"), // Unix timestamp
  dueDate: integer("due_date"), // Unix timestamp
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").default(sql`unixepoch()`),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
}, (table) => ({
  uniqueStudentMonthYear: uniqueIndex("unique_student_month_year").on(table.studentId, table.batchId, table.month, table.year),
}));

// SMS logs table
export const smsLogs = sqliteTable("sms_logs", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  recipientType: text("recipient_type").notNull(),
  recipientPhone: text("recipient_phone").notNull(),
  recipientName: text("recipient_name"),
  studentId: text("student_id"),
  smsType: text("sms_type").notNull(), // 'attendance', 'exam_result', 'exam_notification', 'notice', 'reminder'
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").notNull().default('pending'),
  sentBy: text("sent_by").notNull(),
  sentAt: integer("sent_at").default(sql`unixepoch()`),
  createdAt: integer("created_at").default(sql`unixepoch()`),
});

// Question Bank table
export const questionBank = sqliteTable("question_bank", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  teacherId: text("teacher_id").notNull(),
  subject: text("subject").notNull(),
  category: text("category").notNull(),
  subCategory: text("sub_category").notNull(),
  chapter: text("chapter").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(),
  options: text("options"), // JSON string
  correctAnswer: text("correct_answer"),
  questionImage: text("question_image"),
  driveLink: text("drive_link"),
  difficulty: text("difficulty").notNull().default('medium'),
  marks: integer("marks").notNull().default(1),
  isPublic: integer("is_public").notNull().default(1), // 1 for true, 0 for false
  createdAt: integer("created_at").default(sql`unixepoch()`),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
});

// Notices table
export const notices = sqliteTable("notices", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(),
  isActive: integer("is_active").default(1), // 1 for true, 0 for false
  createdAt: integer("created_at").default(sql`unixepoch()`),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
});

// Monthly Exams table - For monthly exam periods
export const monthlyExams = sqliteTable("monthly_exams", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  batchId: text("batch_id").notNull(),
  title: text("title").notNull(),
  isFinalized: integer("is_finalized").default(0), // 1 for true, 0 for false
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").default(sql`unixepoch()`),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
});

// Individual Exams table - Individual exams within a monthly exam period
export const individualExams = sqliteTable("individual_exams", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  monthlyExamId: text("monthly_exam_id").notNull(),
  name: text("name").notNull(), // e.g., "Algebra Test", "Physics Quiz"
  subject: text("subject").notNull().default('math'), // 'math', 'higher_math', 'science'
  totalMarks: integer("total_marks").notNull().default(100),
  createdAt: integer("created_at").default(sql`unixepoch()`),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
});

// Monthly Marks table - Individual exam marks within a month
export const monthlyMarks = sqliteTable("monthly_marks", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  monthlyExamId: text("monthly_exam_id").notNull(),
  individualExamId: text("individual_exam_id").notNull(),
  studentId: text("student_id").notNull(),
  obtainedMarks: integer("obtained_marks").notNull(),
  createdAt: integer("created_at").default(sql`unixepoch()`),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
}, (table) => [
  uniqueIndex("unique_monthly_mark").on(table.monthlyExamId, table.individualExamId, table.studentId),
]);

// Monthly Results table - Final calculated results with ranks
export const monthlyResults = sqliteTable("monthly_results", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  monthlyExamId: text("monthly_exam_id").notNull(),
  studentId: text("student_id").notNull(),
  totalExamMarks: integer("total_exam_marks").default(0), // Sum of all exam marks
  attendanceMarks: integer("attendance_marks").default(0), // 1 mark per present day
  bonusMarks: integer("bonus_marks").default(0), // Bonus from teacher
  finalTotal: integer("final_total").default(0), // Total of all marks
  rank: integer("rank"),
  percentage: real("percentage"),
  gpa: real("gpa"),
  createdAt: integer("created_at").default(sql`unixepoch()`),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
}, (table) => ({
  uniqueMonthlyExamStudent: uniqueIndex("unique_monthly_exam_student").on(table.monthlyExamId, table.studentId),
}));

// SMS Templates table
export const smsTemplates = sqliteTable("sms_templates", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  name: text("name").notNull(),
  templateType: text("template_type").notNull(), // 'exam_marks', 'monthly_result', 'attendance', 'custom'
  message: text("message").notNull(), // Can contain placeholders like {studentName}, {marks}, {totalMarks}
  isActive: integer("is_active").default(1), // 1 for true, 0 for false
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").default(sql`unixepoch()`),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
});

// Settings table - System settings for SMS and other configurations
export const settings = sqliteTable("settings", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  smsCount: integer("sms_count").notNull().default(0),
  smsApiKey: text("sms_api_key"),
  smsSenderId: text("sms_sender_id").default('8809617628909'),
  smsApiUrl: text("sms_api_url").default('http://bulksmsbd.net/api/smsapi'),
  updatedBy: text("updated_by"),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
});

// Syllabus structure for Praggo AI
export const syllabusClasses = sqliteTable("syllabus_classes", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  level: text("level").notNull(),
  displayOrder: integer("display_order").notNull(),
  createdAt: integer("created_at").default(sql`unixepoch()`),
});

export const syllabusSubjects = sqliteTable("syllabus_subjects", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  classId: text("class_id").notNull(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  code: text("code").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull(),
  createdAt: integer("created_at").default(sql`unixepoch()`),
});

export const syllabusChapters = sqliteTable("syllabus_chapters", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  subjectId: text("subject_id").notNull(),
  title: text("title").notNull(),
  titleBn: text("title_bn"),
  code: text("code"),
  sequence: integer("sequence").notNull(),
  topics: text("topics"), // JSON string array
  createdAt: integer("created_at").default(sql`unixepoch()`),
});

// Online Exams System
export const onlineExams = sqliteTable("online_exams", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  title: text("title").notNull(),
  classId: text("class_id").notNull(),
  subjectId: text("subject_id").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  maxQuestions: integer("max_questions").notNull().default(30),
  status: text("status").notNull().default('draft'), // 'draft', 'published', 'archived'
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").default(sql`unixepoch()`),
  updatedAt: integer("updated_at").default(sql`unixepoch()`),
});

export const examQuestions = sqliteTable("exam_questions", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  examId: text("exam_id").notNull(),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctOption: text("correct_option").notNull(), // 'A', 'B', 'C', 'D'
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull(),
  createdAt: integer("created_at").default(sql`unixepoch()`),
});

export const examAttempts = sqliteTable("exam_attempts", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  examId: text("exam_id").notNull(),
  studentId: text("student_id").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  startTime: integer("start_time").notNull(), // Unix timestamp
  endTime: integer("end_time"), // Unix timestamp
  score: integer("score").default(0),
  totalQuestions: integer("total_questions").notNull(),
  completed: integer("completed").default(0), // 1 for true, 0 for false
  autoSubmitted: integer("auto_submitted").default(0), // 1 for true, 0 for false
  createdAt: integer("created_at").default(sql`unixepoch()`),
});

export const attemptAnswers = sqliteTable("attempt_answers", {
  id: text("id").primaryKey().default(sql`lower(hex(randomblob(16)))`),
  attemptId: text("attempt_id").notNull(),
  questionId: text("question_id").notNull(),
  selectedOption: text("selected_option"), // 'A', 'B', 'C', 'D'
  isCorrect: integer("is_correct").default(0), // 1 for true, 0 for false
  createdAt: integer("created_at").default(sql`unixepoch()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  dateOfBirth: z.union([z.number(), z.date(), z.string()]).optional(),
  admissionDate: z.union([z.number(), z.date(), z.string()]).optional(),
  lastLogin: z.union([z.number(), z.date(), z.string()]).optional(),
  isActive: z.union([z.boolean(), z.number()]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBatchSchema = createInsertSchema(batches, {
  startDate: z.union([z.number(), z.date(), z.string()]).optional(),
  endDate: z.union([z.number(), z.date(), z.string()]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExamSchema = createInsertSchema(exams, {
  examDate: z.union([z.number(), z.date(), z.string()]).optional(),
  isActive: z.union([z.boolean(), z.number()]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertExamSubmissionSchema = createInsertSchema(examSubmissions, {
  submittedAt: z.union([z.number(), z.date(), z.string()]).optional(),
  isSubmitted: z.union([z.boolean(), z.number()]).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance, {
  date: z.union([z.number(), z.date(), z.string()]),
}).omit({
  id: true,
  markedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentFeeSchema = createInsertSchema(studentFees, {
  paidDate: z.union([z.number(), z.date(), z.string()]).optional(),
  dueDate: z.union([z.number(), z.date(), z.string()]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsLogSchema = createInsertSchema(smsLogs).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionBankSchema = createInsertSchema(questionBank, {
  isPublic: z.union([z.boolean(), z.number()]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoticeSchema = createInsertSchema(notices, {
  isActive: z.union([z.boolean(), z.number()]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyExamSchema = createInsertSchema(monthlyExams, {
  isFinalized: z.union([z.boolean(), z.number()]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIndividualExamSchema = createInsertSchema(individualExams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyMarkSchema = createInsertSchema(monthlyMarks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyResultSchema = createInsertSchema(monthlyResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsTemplateSchema = createInsertSchema(smsTemplates, {
  isActive: z.union([z.boolean(), z.number()]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertOnlineExamSchema = createInsertSchema(onlineExams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExamQuestionSchema = createInsertSchema(examQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertExamAttemptSchema = createInsertSchema(examAttempts, {
  startTime: z.union([z.number(), z.date(), z.string()]),
  endTime: z.union([z.number(), z.date(), z.string()]).optional(),
  completed: z.union([z.boolean(), z.number()]).optional(),
  autoSubmitted: z.union([z.boolean(), z.number()]).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertAttemptAnswerSchema = createInsertSchema(attemptAnswers, {
  isCorrect: z.union([z.boolean(), z.number()]).optional(),
}).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Batch = typeof batches.$inferSelect;

export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertExamSubmission = z.infer<typeof insertExamSubmissionSchema>;
export type ExamSubmission = typeof examSubmissions.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export type InsertStudentFee = z.infer<typeof insertStudentFeeSchema>;
export type StudentFee = typeof studentFees.$inferSelect;

export type InsertSmsLog = z.infer<typeof insertSmsLogSchema>;
export type SmsLog = typeof smsLogs.$inferSelect;

export type InsertQuestionBank = z.infer<typeof insertQuestionBankSchema>;
export type QuestionBankItem = typeof questionBank.$inferSelect;

export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type Notice = typeof notices.$inferSelect;

export type InsertMonthlyExam = z.infer<typeof insertMonthlyExamSchema>;
export type MonthlyExam = typeof monthlyExams.$inferSelect;

export type InsertIndividualExam = z.infer<typeof insertIndividualExamSchema>;
export type IndividualExam = typeof individualExams.$inferSelect;

export type InsertMonthlyMark = z.infer<typeof insertMonthlyMarkSchema>;
export type MonthlyMark = typeof monthlyMarks.$inferSelect;

export type InsertMonthlyResult = z.infer<typeof insertMonthlyResultSchema>;
export type MonthlyResult = typeof monthlyResults.$inferSelect;

export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;
export type SmsTemplate = typeof smsTemplates.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type OnlineExam = typeof onlineExams.$inferSelect;
export type InsertOnlineExam = z.infer<typeof insertOnlineExamSchema>;

export type ExamQuestion = typeof examQuestions.$inferSelect;
export type InsertExamQuestion = z.infer<typeof insertExamQuestionSchema>;

export type ExamAttempt = typeof examAttempts.$inferSelect;
export type InsertExamAttempt = z.infer<typeof insertExamAttemptSchema>;

export type AttemptAnswer = typeof attemptAnswers.$inferSelect;
export type InsertAttemptAnswer = z.infer<typeof insertAttemptAnswerSchema>;

export type SyllabusClass = typeof syllabusClasses.$inferSelect;
export type SyllabusSubject = typeof syllabusSubjects.$inferSelect;
export type SyllabusChapter = typeof syllabusChapters.$inferSelect;