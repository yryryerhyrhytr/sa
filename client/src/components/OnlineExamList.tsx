import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Trophy, PlayCircle, History } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import OnlineExamTaking from './OnlineExamTaking';

interface OnlineExam {
  id: number;
  title: string;
  description: string | null;
  class: string;
  subject: string;
  duration: number;
  passingMarks: number;
  totalMarks: number;
  questionCount: number;
  isPublished: boolean;
  createdAt: Date;
}

interface ExamAttempt {
  id: number;
  examId: number;
  studentId: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  completedAt: Date;
}

export default function OnlineExamList() {
  const { user } = useAuth();
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState<number | null>(null);

  const { data: exams, isLoading: examsLoading } = useQuery<OnlineExam[]>({
    queryKey: ['/api/online-exams/student/available'],
  });

  const { data: attempts } = useQuery<ExamAttempt[]>({
    queryKey: ['/api/online-exams/student/attempts'],
  });

  const startExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      return apiRequest('POST', `/api/online-exams/student/start/${examId}`);
    },
    onSuccess: (data, examId) => {
      setSelectedExamId(examId);
      queryClient.invalidateQueries({ queryKey: ['/api/online-exams/student/attempts'] });
    },
  });

  const getExamAttempts = (examId: number) => {
    return attempts?.filter(a => a.examId === examId) || [];
  };

  const getBestScore = (examId: number) => {
    const examAttempts = getExamAttempts(examId);
    if (examAttempts.length === 0) return null;
    return Math.max(...examAttempts.map(a => a.percentage));
  };

  const handleStartExam = (examId: number) => {
    startExamMutation.mutate(examId);
  };

  const groupedExams = () => {
    if (!exams) return {};
    
    const grouped: Record<string, Record<string, OnlineExam[]>> = {};
    
    exams.forEach(exam => {
      if (!grouped[exam.class]) {
        grouped[exam.class] = {};
      }
      if (!grouped[exam.class][exam.subject]) {
        grouped[exam.class][exam.subject] = [];
      }
      grouped[exam.class][exam.subject].push(exam);
    });
    
    return grouped;
  };

  if (selectedExamId) {
    return (
      <OnlineExamTaking
        examId={selectedExamId}
        onComplete={() => {
          setSelectedExamId(null);
          queryClient.invalidateQueries({ queryKey: ['/api/online-exams/student/attempts'] });
        }}
      />
    );
  }

  const examsByClass = groupedExams();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">অনলাইন পরীক্ষা</h1>
      </div>

      {examsLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : exams && exams.length > 0 ? (
        <div className="space-y-6">
          {Object.keys(examsByClass).sort((a, b) => parseInt(a) - parseInt(b)).map(className => (
            <div key={className} className="space-y-4">
              <h2 className="text-xl font-bold">শ্রেণি {className}</h2>
              {Object.keys(examsByClass[className]).sort().map(subject => (
                <div key={subject} className="space-y-3">
                  <h3 className="text-lg font-semibold text-muted-foreground">{subject}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {examsByClass[className][subject].map((exam) => {
            const examAttempts = getExamAttempts(exam.id);
            const bestScore = getBestScore(exam.id);
            const hasAttempts = examAttempts.length > 0;

            return (
              <Card key={exam.id} data-testid={`card-exam-${exam.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{exam.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" data-testid={`badge-class-${exam.id}`}>
                          শ্রেণি {exam.class}
                        </Badge>
                        <Badge variant="outline" data-testid={`badge-subject-${exam.id}`}>
                          {exam.subject}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {exam.description && (
                    <p className="text-sm text-muted-foreground mt-2">{exam.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>{exam.duration} মিনিট</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <span>{exam.questionCount} প্রশ্ন</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-600" />
                      <span>{exam.totalMarks} নম্বর</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">পাস: {exam.passingMarks}</span>
                    </div>
                  </div>

                  {hasAttempts && bestScore !== null && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">সর্বোচ্চ স্কোর:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {bestScore.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        মোট প্রচেষ্টা: {examAttempts.length}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleStartExam(exam.id)}
                      disabled={startExamMutation.isPending}
                      data-testid={`button-start-exam-${exam.id}`}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      {hasAttempts ? 'আবার দাও' : 'শুরু করুন'}
                    </Button>
                    {hasAttempts && (
                      <Button
                        variant="outline"
                        onClick={() => setShowHistory(exam.id)}
                        data-testid={`button-history-${exam.id}`}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
                    );
                  })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">কোন পরীক্ষা পাওয়া যায়নি</p>
          </CardContent>
        </Card>
      )}

      {showHistory !== null && (
        <Dialog open={showHistory !== null} onOpenChange={() => setShowHistory(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>পরীক্ষার ইতিহাস</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getExamAttempts(showHistory)
                .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                .map((attempt, index) => (
                  <div
                    key={attempt.id}
                    className="border rounded-lg p-4"
                    data-testid={`history-item-${attempt.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">প্রচেষ্টা #{getExamAttempts(showHistory).length - index}</span>
                      <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                        {attempt.passed ? 'পাস' : 'ফেল'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">স্কোর: </span>
                        <span className="font-medium">
                          {attempt.score}/{attempt.totalQuestions} ({attempt.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">সময়: </span>
                        <span className="font-medium">
                          {format(new Date(attempt.completedAt), 'dd/MM/yyyy hh:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
