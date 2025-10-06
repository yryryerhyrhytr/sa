# Student Nursing Center - Coach Management System

## Overview

This project is a full-stack web application designed to manage the operations of Golam Sarowar Sir's mathematics and science coaching institute. It provides a comprehensive suite of features for student management, batch organization, exam creation and grading, fee collection, attendance tracking, and communication via SMS. The system aims to streamline administrative tasks, enhance student-teacher interaction, and improve educational outcomes. Key capabilities include an AI-powered question generation and tutoring system, detailed monthly exam management with automated ranking, and a robust SMS notification system.

## User Preferences

I prefer iterative development and want to be involved in the decision-making process for major changes. I appreciate clear, concise explanations and prefer to review changes before they are implemented on the main branch. Please ensure that all new features align with the project's core vision of simplifying coaching center management and improving student engagement. Do not make changes to the `shared/schema.ts` file without explicit approval, as it affects both frontend and backend data structures.

## System Architecture

The system is built on a modern web stack, emphasizing performance, scalability, and maintainability.

### UI/UX Decisions
- **Color Scheme**: Primary blue (`#2563eb`) for an educational feel, accented with amber.
- **Theming**: Supports both light and dark modes.
- **Typography**: Uses Inter for sans-serif text and JetBrains Mono for monospace.
- **Component Library**: Built with Shadcn UI and Radix UI primitives for a responsive and accessible design.
- **Language Support**: Full support for Bengali (বাংলা) language, including custom font integration (Noto Sans Bengali, Kalpurush).
- **Mathematical Rendering**: Integrated MathJax for rendering LaTeX-based mathematical equations.
- **SEO**: Comprehensive meta tags, OpenGraph, Twitter cards, and structured data for enhanced search engine visibility.

### Technical Implementations
- **Frontend**: React + TypeScript, Vite for fast development, Tailwind CSS for styling, Wouter for routing, React Hook Form with Zod for form management, and TanStack Query for state management.
- **Backend**: Express.js with Node.js.
- **Database**: PostgreSQL, managed with Drizzle ORM.
- **Authentication**: Session-based, role-based access control (Teacher, Student, Super User) with phone number login.
- **AI System**: Integrates Google Gemini 2.0 Flash for AI question generation and tutoring, featuring a 5-key rotation system for high availability and Server-Sent Events (SSE) for streaming responses.
- **SMS System**: Integration with BulkSMSBD API, including real-time balance management, character limit validation by language (English/Bangla), and template system with separate templates for present/absent attendance.
- **Monthly Exam System**: Supports creation of monthly exam periods, individual exams, mark entry, automated attendance mark calculation, bonus marks, GPA calculation, and ranking generation based on a specific formula (`Final Total = Exam Marks + Attendance Marks + Bonus Marks`).
- **Student Password Management**: Teachers can securely view and reset student passwords, generating 6-character uppercase alphanumeric passwords.

### Feature Specifications
- **Teacher Dashboard**: Comprehensive management of students, batches, exams, attendance, fees, SMS, and AI question generation.
- **Student Dashboard**: Personalized view of upcoming exams, results, and attendance records.
- **Public Landing Page**: Displays statistics, active courses (batches), founder profile, and top 3 achievers per batch.
- **Attendance System**: Simplified Present/Absent tracking, duplicate entry prevention, and dual SMS system.
- **Monthly Exam Student Visibility**: Students can view individual exam marks immediately, even before finalization, with clear status indicators.
- **NCTB Curriculum Coverage**: AI system supports classes 6-12 across various subjects (Math, Science, ICT) with comprehensive chapter and topic coverage.

### System Design Choices
- **Project Structure**: Clear separation between `client/` (React frontend), `server/` (Express backend), and `shared/` (common types and schemas).
- **Database Schema**: Robust schema with tables for users, batches, exams, questions, submissions, attendance, fees, SMS logs, question bank, notices, monthly exams, individual exams, monthly marks, monthly results, SMS templates, and settings.

## External Dependencies

- **Google Gemini 2.0 Flash API**: Used for AI-powered question generation and student tutoring.
- **BulkSMSBD API**: Integrated for sending SMS notifications to students and parents.
- **PostgreSQL**: Relational database management system for persistent data storage.
- **Drizzle ORM**: Object-Relational Mapper for interacting with PostgreSQL.
- **MathJax**: JavaScript display engine for rendering mathematical equations.
- **Shadcn UI & Radix UI**: Frontend component libraries for UI development.