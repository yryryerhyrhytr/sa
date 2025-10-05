import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['teacher', 'student', 'super_user']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'cancelled']);
export const subjectEnum = pgEnum('subject', ['math', 'higher_math', 'science']);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "excused", "absent"]);
export const smsTypeEnum = pgEnum('sms_type', ['attendance', 'exam_result', 'exam_notification', 'notice', 'reminder']);
export const batchStatusEnum = pgEnum('batch_status', ['active', 'inactive', 'completed']);

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Batches table
export const batches = pgTable("batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subject: subjectEnum("subject").notNull(),
  batchCode: varchar("batch_code").notNull().unique(),
  password: varchar("password").notNull(),
  maxStudents: integer("max_students").default(50),
  currentStudents: integer("current_students").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  classTime: varchar("class_time"),
  classDays: text("class_days"),
  schedule: text("schedule"),
  status: batchStatusEnum("status").notNull().default('active'),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username"),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default('student'),
  email: varchar("email"),
  smsCount: integer("sms_count").default(0),
  studentId: varchar("student_id"),
  phoneNumber: varchar("phone_number"),
  studentPassword: varchar("student_password"),
  address: text("address"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender"),
  institution: varchar("institution"),
  classLevel: varchar("class_level"),
  batchId: varchar("batch_id"),
  admissionDate: timestamp("admission_date"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exams table
export const exams = pgTable("exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  subject: subjectEnum("subject").notNull(),
  chapter: varchar("chapter"),
  targetClass: varchar("target_class"),
  description: text("description"),
  instructions: text("instructions"),
  examDate: timestamp("exam_date"),
  duration: integer("duration").notNull(),
  examType: varchar("exam_type").notNull(),
  examMode: varchar("exam_mode").notNull(),
  batchId: varchar("batch_id").references(() => batches.id),
  targetStudents: jsonb("target_students"),
  questionSource: varchar("question_source"),
  questionContent: text("question_content"),
  questionPaperImage: text("question_paper_image"),
  totalMarks: integer("total_marks").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull().references(() => exams.id, { onDelete: 'cascade' }),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type").notNull(),
  options: jsonb("options"),
  correctAnswer: varchar("correct_answer"),
  questionImage: text("question_image"),
  driveLink: text("drive_link"),
  marks: integer("marks").notNull().default(1),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exam submissions table
export const examSubmissions = pgTable("exam_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull().references(() => exams.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").notNull().references(() => users.id),
  answers: jsonb("answers"),
  score: integer("score"),
  manualMarks: integer("manual_marks"),
  totalMarks: integer("total_marks"),
  percentage: integer("percentage"),
  rank: integer("rank"),
  isSubmitted: boolean("is_submitted").default(false),
  submittedAt: timestamp("submitted_at"),
  timeSpent: integer("time_spent"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  batchId: varchar("batch_id").notNull().references(() => batches.id),
  date: timestamp("date").notNull(),
  attendanceStatus: attendanceStatusEnum("attendance_status").notNull().default("present"),
  subject: subjectEnum("subject"),
  notes: text("notes"),
  markedBy: varchar("marked_by").notNull().references(() => users.id),
  markedAt: timestamp("marked_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student fees table
export const studentFees = pgTable("student_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  batchId: varchar("batch_id").notNull().references(() => batches.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  month: varchar("month").notNull(),
  year: integer("year").notNull(),
  status: paymentStatusEnum("status").notNull().default('pending'),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0'),
  paidDate: timestamp("paid_date"),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueStudentMonthYear: uniqueIndex("unique_student_month_year").on(table.studentId, table.batchId, table.month, table.year),
}));

// SMS logs table
export const smsLogs = pgTable("sms_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientType: varchar("recipient_type").notNull(),
  recipientPhone: varchar("recipient_phone").notNull(),
  recipientName: varchar("recipient_name"),
  studentId: varchar("student_id").references(() => users.id),
  smsType: smsTypeEnum("sms_type").notNull(),
  subject: varchar("subject"),
  message: text("message").notNull(),
  status: varchar("status").notNull().default('pending'),
  sentBy: varchar("sent_by").notNull().references(() => users.id),
  sentAt: timestamp("sent_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Question Bank table
export const questionBank = pgTable("question_bank", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: varchar("subject").notNull(),
  category: varchar("category").notNull(),
  subCategory: varchar("sub_category").notNull(),
  chapter: varchar("chapter").notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type").notNull(),
  options: jsonb("options"),
  correctAnswer: varchar("correct_answer"),
  questionImage: text("question_image"),
  driveLink: text("drive_link"),
  difficulty: varchar("difficulty").notNull().default('medium'),
  marks: integer("marks").notNull().default(1),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notices table
export const notices = pgTable("notices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly Exams table - For monthly exam periods
export const monthlyExams = pgTable("monthly_exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  batchId: varchar("batch_id").notNull().references(() => batches.id),
  title: varchar("title").notNull(),
  isFinalized: boolean("is_finalized").default(false),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual Exams table - Individual exams within a monthly exam period
export const individualExams = pgTable("individual_exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  monthlyExamId: varchar("monthly_exam_id").notNull().references(() => monthlyExams.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(), // e.g., "Algebra Test", "Physics Quiz"
  subject: subjectEnum("subject").notNull().default('math'),
  totalMarks: integer("total_marks").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Monthly Marks table - Individual exam marks within a month
export const monthlyMarks = pgTable("monthly_marks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  monthlyExamId: varchar("monthly_exam_id").notNull().references(() => monthlyExams.id, { onDelete: 'cascade' }),
  individualExamId: varchar("individual_exam_id").notNull().references(() => individualExams.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").notNull().references(() => users.id),
  obtainedMarks: integer("obtained_marks").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("unique_monthly_mark").on(table.monthlyExamId, table.individualExamId, table.studentId),
]);

// Monthly Results table - Final calculated results with ranks
export const monthlyResults = pgTable("monthly_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  monthlyExamId: varchar("monthly_exam_id").notNull().references(() => monthlyExams.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").notNull().references(() => users.id),
  totalExamMarks: integer("total_exam_marks").default(0), // Sum of all exam marks
  attendanceMarks: integer("attendance_marks").default(0), // 1 mark per present day
  bonusMarks: integer("bonus_marks").default(0), // Bonus from teacher
  finalTotal: integer("final_total").default(0), // Total of all marks
  rank: integer("rank"),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  gpa: decimal("gpa", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueMonthlyExamStudent: uniqueIndex("unique_monthly_exam_student").on(table.monthlyExamId, table.studentId),
}));

// SMS Templates table
export const smsTemplates = pgTable("sms_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  templateType: varchar("template_type").notNull(), // 'exam_marks', 'monthly_result', 'attendance', 'custom'
  message: text("message").notNull(), // Can contain placeholders like {studentName}, {marks}, {totalMarks}
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Settings table - System settings for SMS and other configurations
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  smsCount: integer("sms_count").notNull().default(0),
  smsApiKey: varchar("sms_api_key"),
  smsSenderId: varchar("sms_sender_id").default('8809617628909'),
  smsApiUrl: varchar("sms_api_url").default('http://bulksmsbd.net/api/smsapi'),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertExamSubmissionSchema = createInsertSchema(examSubmissions).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  markedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentFeeSchema = createInsertSchema(studentFees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsLogSchema = createInsertSchema(smsLogs).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionBankSchema = createInsertSchema(questionBank).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoticeSchema = createInsertSchema(notices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMonthlyExamSchema = createInsertSchema(monthlyExams).omit({
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

export const insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
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

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  batch: one(batches, {
    fields: [users.batchId],
    references: [batches.id],
  }),
  examSubmissions: many(examSubmissions),
  attendance: many(attendance),
  fees: many(studentFees),
}));

export const batchesRelations = relations(batches, ({ many }) => ({
  students: many(users),
  exams: many(exams),
  attendance: many(attendance),
  fees: many(studentFees),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  batch: one(batches, {
    fields: [exams.batchId],
    references: [batches.id],
  }),
  questions: many(questions),
  submissions: many(examSubmissions),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  exam: one(exams, {
    fields: [questions.examId],
    references: [exams.id],
  }),
}));

export const examSubmissionsRelations = relations(examSubmissions, ({ one }) => ({
  exam: one(exams, {
    fields: [examSubmissions.examId],
    references: [exams.id],
  }),
  student: one(users, {
    fields: [examSubmissions.studentId],
    references: [users.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(users, {
    fields: [attendance.studentId],
    references: [users.id],
  }),
  batch: one(batches, {
    fields: [attendance.batchId],
    references: [batches.id],
  }),
}));

export const studentFeesRelations = relations(studentFees, ({ one }) => ({
  student: one(users, {
    fields: [studentFees.studentId],
    references: [users.id],
  }),
  batch: one(batches, {
    fields: [studentFees.batchId],
    references: [batches.id],
  }),
}));

// Syllabus structure for Praggo AI
export const syllabusClasses = pgTable("syllabus_classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  level: varchar("level").notNull(),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const syllabusSubjects = pgTable("syllabus_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull().references(() => syllabusClasses.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  code: varchar("code").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const syllabusChapters = pgTable("syllabus_chapters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").notNull().references(() => syllabusSubjects.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  titleBn: varchar("title_bn"),
  code: varchar("code"),
  sequence: integer("sequence").notNull(),
  topics: text("topics").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for syllabus tables
export const insertSyllabusClassSchema = createInsertSchema(syllabusClasses).omit({
  id: true,
  createdAt: true,
});

export const insertSyllabusSubjectSchema = createInsertSchema(syllabusSubjects).omit({
  id: true,
  createdAt: true,
});

export const insertSyllabusChapterSchema = createInsertSchema(syllabusChapters).omit({
  id: true,
  createdAt: true,
});

// Types for syllabus
export type SyllabusClass = typeof syllabusClasses.$inferSelect;
export type InsertSyllabusClass = z.infer<typeof insertSyllabusClassSchema>;

export type SyllabusSubject = typeof syllabusSubjects.$inferSelect;
export type InsertSyllabusSubject = z.infer<typeof insertSyllabusSubjectSchema>;

export type SyllabusChapter = typeof syllabusChapters.$inferSelect;
export type InsertSyllabusChapter = z.infer<typeof insertSyllabusChapterSchema>;

// Online Exams System
export const onlineExamStatusEnum = pgEnum('online_exam_status', ['draft', 'published', 'archived']);
export const optionEnum = pgEnum('option_enum', ['A', 'B', 'C', 'D']);

export const onlineExams = pgTable("online_exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  classId: varchar("class_id").notNull().references(() => syllabusClasses.id),
  subjectId: varchar("subject_id").notNull().references(() => syllabusSubjects.id),
  durationMinutes: integer("duration_minutes").notNull(),
  maxQuestions: integer("max_questions").notNull().default(30),
  status: onlineExamStatusEnum("status").notNull().default('draft'),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const examQuestions = pgTable("exam_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull().references(() => onlineExams.id, { onDelete: 'cascade' }),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctOption: optionEnum("correct_option").notNull(),
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const examAttempts = pgTable("exam_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull().references(() => onlineExams.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  attemptNumber: integer("attempt_number").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  score: integer("score").default(0),
  totalQuestions: integer("total_questions").notNull(),
  completed: boolean("completed").default(false),
  autoSubmitted: boolean("auto_submitted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attemptAnswers = pgTable("attempt_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").notNull().references(() => examAttempts.id, { onDelete: 'cascade' }),
  questionId: varchar("question_id").notNull().references(() => examQuestions.id, { onDelete: 'cascade' }),
  selectedOption: optionEnum("selected_option"),
  isCorrect: boolean("is_correct").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for online exams
export const insertOnlineExamSchema = createInsertSchema(onlineExams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExamQuestionSchema = createInsertSchema(examQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertExamAttemptSchema = createInsertSchema(examAttempts).omit({
  id: true,
  createdAt: true,
});

export const insertAttemptAnswerSchema = createInsertSchema(attemptAnswers).omit({
  id: true,
  createdAt: true,
});

// Types for online exams
export type OnlineExam = typeof onlineExams.$inferSelect;
export type InsertOnlineExam = z.infer<typeof insertOnlineExamSchema>;

export type ExamQuestion = typeof examQuestions.$inferSelect;
export type InsertExamQuestion = z.infer<typeof insertExamQuestionSchema>;

export type ExamAttempt = typeof examAttempts.$inferSelect;
export type InsertExamAttempt = z.infer<typeof insertExamAttemptSchema>;

export type AttemptAnswer = typeof attemptAnswers.$inferSelect;
export type InsertAttemptAnswer = z.infer<typeof insertAttemptAnswerSchema>;

// Relations
export const syllabusClassesRelations = relations(syllabusClasses, ({ many }) => ({
  subjects: many(syllabusSubjects),
}));

export const syllabusSubjectsRelations = relations(syllabusSubjects, ({ one, many }) => ({
  class: one(syllabusClasses, {
    fields: [syllabusSubjects.classId],
    references: [syllabusClasses.id],
  }),
  chapters: many(syllabusChapters),
}));

export const syllabusChaptersRelations = relations(syllabusChapters, ({ one }) => ({
  subject: one(syllabusSubjects, {
    fields: [syllabusChapters.subjectId],
    references: [syllabusSubjects.id],
  }),
}));
