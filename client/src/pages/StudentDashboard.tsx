import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  LogOut,
  Moon,
  Sun,
  Trophy,
  Clock,
  FileText,
  TrendingUp,
  ClipboardCheck
} from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { StudentSidebar } from '@/components/StudentSidebar';
import AISolver from '@/components/AISolver';
import OnlineExamList from '@/components/OnlineExamList';

interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  examSubject: string;
  examDate: string;
  submittedAt: string;
  marks: number | null;
  manualMarks: number | null;
  totalMarks: number;
  feedback: string | null;
  status: string;
  rank: number | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  batchName: string;
}

interface MonthlyExamData {
  monthlyExamId: string;
  month: number;
  year: number;
  title: string;
  isFinalized: boolean;
  individualExams: {
    examId: string;
    examName: string;
    subject: string;
    totalMarks: number;
    obtainedMarks: number;
    percentage: string;
  }[];
  result: {
    totalExamMarks: number;
    attendanceMarks: number;
    bonusMarks: number;
    finalTotal: number;
    rank: number | null;
    percentage: string;
    gpa: string;
  } | null;
}

export default function StudentDashboard() {
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [activeSection, setActiveSection] = useState('dashboard');

  const { data: studentBatch } = useQuery<any>({
    queryKey: ['/api/student/batch'],
  });

  const { data: examResults = [], isLoading: resultsLoading, error: resultsError } = useQuery<ExamSubmission[]>({
    queryKey: ['/api/student/exam-results'],
  });

  const { data: upcomingExams = [], isLoading: examsLoading, error: examsError } = useQuery<any[]>({
    queryKey: ['/api/student/upcoming-exams'],
  });

  const { data: attendanceRecords = [], isLoading: attendanceLoading, error: attendanceError } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/student/attendance'],
  });

  const { data: monthlyExams = [], isLoading: monthlyExamsLoading, error: monthlyExamsError } = useQuery<MonthlyExamData[]>({
    queryKey: ['/api/student/monthly-exams'],
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const attendancePercentage = attendanceRecords.length > 0
    ? Math.round((attendanceRecords.filter(r => r.status === 'present').length / attendanceRecords.length) * 100)
    : 0;

  const gradedResults = examResults.filter(r => r.marks !== null || r.manualMarks !== null);
  const averageMarks = gradedResults.length > 0
    ? Math.round(gradedResults.reduce((sum, r) => sum + (r.marks || r.manualMarks || 0), 0) / gradedResults.length)
    : 0;

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div>
            {/* Welcome Header with Gradient */}
            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                স্বাগতম, {user?.firstName} {user?.lastName}!
              </h2>
              <p className="text-blue-100 text-lg">
                {studentBatch ? `${studentBatch.name} - ${studentBatch.subject}` : 'No batch assigned'}
              </p>
            </div>

            {/* Stats Cards with Modern Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-xl hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0">
                      Total
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" data-testid="text-total-exams">
                    {examResults.length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">পরীক্ষা সম্পন্ন</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-xl hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0">
                      Average
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" data-testid="text-average-score">
                    {averageMarks}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">গড় নম্বর</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-xl hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                      <ClipboardCheck className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0">
                      Present
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" data-testid="text-attendance">
                    {attendancePercentage}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">উপস্থিতি ({attendanceRecords.length})</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-xl hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-0">
                      Upcoming
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" data-testid="text-upcoming-exams">
                    {upcomingExams.length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">আসন্ন পরীক্ষা</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'results':
        return (
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Exam Results</h2>
            {resultsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading results...</p>
              </div>
            ) : resultsError ? (
              <div className="text-center py-12">
                <p className="text-red-600">Failed to load results</p>
              </div>
            ) : examResults.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No exam results yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {examResults.map((result) => {
                  const score = result.marks || result.manualMarks || 0;
                  const percentage = result.totalMarks > 0 ? Math.round((score / result.totalMarks) * 100) : 0;
                  const isPassed = percentage >= 60;

                  return (
                    <Card key={result.id} className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} data-testid={`result-${result.id}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{result.examTitle}</h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{result.examSubject}</p>
                          </div>
                          <Badge className={isPassed ? 'bg-green-600' : 'bg-red-600'}>
                            {score}/{result.totalMarks}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {new Date(result.submittedAt).toLocaleDateString()}
                          </span>
                          <span className={`font-semibold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                            {percentage}%
                          </span>
                        </div>
                        {result.feedback && (
                          <div className={`mt-3 p-3 rounded ${isDarkMode ? 'bg-slate-600/50' : 'bg-blue-50'}`}>
                            <p className="text-sm font-medium mb-1">Teacher's Feedback:</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{result.feedback}</p>
                          </div>
                        )}
                        {result.rank && (
                          <div className="mt-2">
                            <Badge variant="outline">Rank: #{result.rank}</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'monthlyExams':
        return (
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Monthly Exams & Rankings</h2>
            {monthlyExamsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading monthly exams...</p>
              </div>
            ) : monthlyExamsError ? (
              <div className="text-center py-12">
                <p className="text-red-600">Failed to load monthly exams</p>
              </div>
            ) : monthlyExams.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No monthly exam results available yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {monthlyExams.map((monthlyExam) => {
                  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                  const monthName = monthNames[monthlyExam.month - 1];
                  
                  return (
                    <Card key={monthlyExam.monthlyExamId} className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} data-testid={`monthly-exam-${monthlyExam.monthlyExamId}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                              {monthlyExam.title}
                            </CardTitle>
                            <CardDescription>
                              {monthName} {monthlyExam.year}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            {!monthlyExam.isFinalized && (
                              <Badge className="bg-blue-600" data-testid={`status-${monthlyExam.monthlyExamId}`}>
                                In Progress
                              </Badge>
                            )}
                            {monthlyExam.result && monthlyExam.result.rank && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white" data-testid={`rank-${monthlyExam.monthlyExamId}`}>
                                Rank #{monthlyExam.result.rank}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Individual Exam Marks</h4>
                            {monthlyExam.individualExams.length === 0 ? (
                              <div className={`p-4 rounded text-center ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No exam marks available yet</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {monthlyExam.individualExams.map((exam) => {
                                  const percentage = parseFloat(exam.percentage);
                                  const isPassed = percentage >= 40;
                                  const hasMarks = exam.obtainedMarks > 0;
                                  
                                  return (
                                    <div key={exam.examId} className={`p-3 rounded ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`} data-testid={`individual-exam-${exam.examId}`}>
                                      <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{exam.examName}</p>
                                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{exam.subject}</p>
                                        </div>
                                        <div className="text-right">
                                          {hasMarks ? (
                                            <>
                                              <Badge className={isPassed ? 'bg-green-600' : 'bg-red-600'}>
                                                {exam.obtainedMarks}/{exam.totalMarks}
                                              </Badge>
                                              <p className={`text-sm mt-1 font-semibold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                                {exam.percentage}%
                                              </p>
                                            </>
                                          ) : (
                                            <Badge className="bg-gray-500">
                                              Not Entered
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {!monthlyExam.isFinalized && (
                            <div className={`p-3 rounded border ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                <span className="font-semibold">Note:</span> This exam is in progress. Final ranking, attendance marks, and GPA will be available once your teacher finalizes the results.
                              </p>
                            </div>
                          )}

                          {monthlyExam.isFinalized && monthlyExam.result && (
                            <div className={`p-4 rounded border-2 ${isDarkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-blue-50 border-blue-200'}`}>
                              <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Monthly Summary</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Exam Marks</p>
                                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} data-testid={`exam-marks-${monthlyExam.monthlyExamId}`}>
                                    {monthlyExam.result.totalExamMarks}
                                  </p>
                                </div>
                                <div>
                                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Attendance</p>
                                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} data-testid={`attendance-marks-${monthlyExam.monthlyExamId}`}>
                                    {monthlyExam.result.attendanceMarks}
                                  </p>
                                </div>
                                <div>
                                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bonus</p>
                                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} data-testid={`bonus-marks-${monthlyExam.monthlyExamId}`}>
                                    {monthlyExam.result.bonusMarks}
                                  </p>
                                </div>
                                <div>
                                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Final Total</p>
                                  <p className={`text-lg font-bold text-blue-600`} data-testid={`final-total-${monthlyExam.monthlyExamId}`}>
                                    {monthlyExam.result.finalTotal}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Overall Percentage</span>
                                  <span className="text-xl font-bold text-green-600" data-testid={`percentage-${monthlyExam.monthlyExamId}`}>
                                    {monthlyExam.result.percentage}%
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>GPA</span>
                                  <Badge className={
                                    Number(monthlyExam.result.gpa) >= 5.0 ? 'bg-green-600 text-xl px-3 py-1' : 
                                    Number(monthlyExam.result.gpa) >= 4.0 ? 'bg-blue-600 text-xl px-3 py-1' : 
                                    Number(monthlyExam.result.gpa) >= 3.0 ? 'bg-yellow-600 text-xl px-3 py-1' : 
                                    Number(monthlyExam.result.gpa) >= 2.0 ? 'bg-orange-600 text-xl px-3 py-1' : 
                                    'bg-red-600 text-xl px-3 py-1'
                                  } data-testid={`gpa-${monthlyExam.monthlyExamId}`}>
                                    {monthlyExam.result.gpa || '0.0'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'ai-solver':
        return <AISolver />;

      case 'online-exam':
        return <OnlineExamList />;

      default:
        return null;
    }
  };

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <StudentSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <div className={`flex flex-col flex-1 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
          <header className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10`}>
            <div className="flex items-center justify-between p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div>
                  <h2 className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Student Portal
                  </h2>
                  <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Student Nursing Center
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className={isDarkMode ? 'text-yellow-400 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'}
                  data-testid="button-toggle-theme"
                >
                  {isDarkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className={`${isDarkMode ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-red-50'} hidden md:flex`}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className={`${isDarkMode ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-red-50'} md:hidden`}
                  data-testid="button-logout-mobile"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-8">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
