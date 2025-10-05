import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Clock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useMathJax } from '@/hooks/useMathJax';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExamQuestion {
  id: number;
  questionText: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  orderIndex: number;
}

interface ExamData {
  exam: {
    id: number;
    title: string;
    duration: number;
    totalMarks: number;
    passingMarks: number;
  };
  questions: ExamQuestion[];
  attemptId: number;
}

interface ExamResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  correctAnswers: number[];
  userAnswers: { questionId: number; selectedOption: number }[];
}

interface Props {
  examId: number;
  onComplete: () => void;
}

export default function OnlineExamTaking({ examId, onComplete }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: examData, isLoading } = useQuery<ExamData>({
    queryKey: ['/api/online-exams/student/exam', examId],
    queryFn: async () => {
      const response = await fetch(`/api/online-exams/student/exam/${examId}`);
      if (!response.ok) throw new Error('Failed to fetch exam');
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (examData) {
      setTimeRemaining(examData.exam.duration * 60);
    }
  }, [examData]);

  useEffect(() => {
    if (timeRemaining > 0 && !examResult) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining, examResult]);

  const submitExamMutation = useMutation({
    mutationFn: async (answers: { questionId: number; selectedOption: number }[]) => {
      if (!examData) throw new Error('No exam data');
      const response = await apiRequest('POST', `/api/online-exams/student/submit/${examData.attemptId}`, { answers });
      return response.json();
    },
    onSuccess: (result: ExamResult) => {
      setExamResult(result);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    },
  });

  useMathJax([currentQuestionIndex, JSON.stringify(examResult), JSON.stringify(examData?.questions)]);

  const handleAutoSubmit = () => {
    if (!examData || examResult) return;
    
    const answerArray = examData.questions.map((q) => ({
      questionId: q.id,
      selectedOption: answers[q.id] || 0,
    }));
    
    submitExamMutation.mutate(answerArray);
  };

  const handleSubmit = () => {
    setShowSubmitDialog(false);
    
    if (!examData) return;
    
    const answerArray = examData.questions.map((q) => ({
      questionId: q.id,
      selectedOption: answers[q.id] || 0,
    }));
    
    submitExamMutation.mutate(answerArray);
  };

  const handleAnswerChange = (questionId: number, option: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">পরীক্ষা লোড হচ্ছে...</div>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-red-600">পরীক্ষা লোড করতে ব্যর্থ</div>
          <Button onClick={onComplete} className="mt-4">ফিরে যান</Button>
        </div>
      </div>
    );
  }

  if (examResult) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">পরীক্ষার ফলাফল</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className={`text-6xl font-bold mb-4 ${examResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                {examResult.percentage.toFixed(1)}%
              </div>
              <div className="text-2xl mb-2">
                {examResult.passed ? (
                  <span className="text-green-600 flex items-center justify-center gap-2">
                    <CheckCircle className="h-8 w-8" />
                    পাস
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center justify-center gap-2">
                    <AlertCircle className="h-8 w-8" />
                    ফেল
                  </span>
                )}
              </div>
              <div className="text-lg text-muted-foreground">
                সঠিক উত্তর: {examResult.score} / {examResult.totalQuestions}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">উত্তরপত্র পর্যালোচনা</h3>
              <div className="space-y-4">
                {examData.questions
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((question, index) => {
                    const userAnswer = examResult.userAnswers.find(a => a.questionId === question.id);
                    const isCorrect = examResult.correctAnswers.includes(question.id);
                    const selectedOption = userAnswer?.selectedOption || 0;

                    return (
                      <Card key={question.id} data-testid={`result-question-${question.id}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {isCorrect ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium mb-3" dangerouslySetInnerHTML={{ __html: `${index + 1}. ${question.questionText}` }} />
                              <div className="space-y-2">
                                {[1, 2, 3, 4].map((optNum) => {
                                  const optionText = question[`option${optNum}` as keyof ExamQuestion] as string;
                                  const isSelected = selectedOption === optNum;
                                  
                                  return (
                                    <div
                                      key={optNum}
                                      className={`p-2 rounded ${
                                        isSelected
                                          ? isCorrect
                                            ? 'bg-green-100 dark:bg-green-950 border-green-500'
                                            : 'bg-red-100 dark:bg-red-950 border-red-500'
                                          : ''
                                      }`}
                                    >
                                      <span dangerouslySetInnerHTML={{ __html: `${optNum}. ${optionText}` }} />
                                      {isSelected && <span className="ml-2 font-semibold">(আপনার উত্তর)</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={onComplete} className="flex-1" data-testid="button-back-to-exams">
                পরীক্ষা তালিকায় ফিরে যান
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setExamResult(null);
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                  setTimeRemaining(examData.exam.duration * 60);
                  onComplete();
                }}
                data-testid="button-retake-exam"
              >
                আবার দিন
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = examData.questions.sort((a, b) => a.orderIndex - b.orderIndex)[currentQuestionIndex];
  const totalQuestions = examData.questions.length;
  const answeredCount = getAnsweredCount();

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-4 flex items-center justify-between sticky top-0 bg-background z-10 pb-4 border-b">
        <div>
          <h2 className="text-xl font-bold">{examData.exam.title}</h2>
          <p className="text-sm text-muted-foreground">
            প্রশ্ন {currentQuestionIndex + 1} / {totalQuestions} • উত্তর দেওয়া হয়েছে: {answeredCount}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          timeRemaining < 60 ? 'bg-red-100 dark:bg-red-950 text-red-600' : 'bg-blue-100 dark:bg-blue-950 text-blue-600'
        }`}>
          <Clock className="h-5 w-5" />
          <span className="text-lg font-bold" data-testid="text-timer">{formatTime(timeRemaining)}</span>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            <div dangerouslySetInnerHTML={{ __html: `${currentQuestionIndex + 1}. ${currentQuestion.questionText}` }} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion.id]?.toString() || ''}
            onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
            data-testid={`radiogroup-question-${currentQuestion.id}`}
          >
            {[1, 2, 3, 4].map((optNum) => {
              const optionText = currentQuestion[`option${optNum}` as keyof ExamQuestion] as string;
              return (
                <div key={optNum} className="flex items-center space-x-3 p-3 rounded-lg hover-elevate">
                  <RadioGroupItem value={optNum.toString()} id={`opt-${optNum}`} data-testid={`radio-option-${optNum}`} />
                  <Label htmlFor={`opt-${optNum}`} className="flex-1 cursor-pointer">
                    <span dangerouslySetInnerHTML={{ __html: `${optNum}. ${optionText}` }} />
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          disabled={currentQuestionIndex === 0}
          data-testid="button-prev-question"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          পূর্ববর্তী
        </Button>

        <div className="flex gap-2 flex-wrap justify-center">
          {examData.questions
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((q, idx) => (
              <Button
                key={q.id}
                variant={currentQuestionIndex === idx ? 'default' : answers[q.id] ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setCurrentQuestionIndex(idx)}
                className="w-10 h-10"
                data-testid={`button-question-nav-${idx + 1}`}
              >
                {idx + 1}
              </Button>
            ))}
        </div>

        {currentQuestionIndex < totalQuestions - 1 ? (
          <Button
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            data-testid="button-next-question"
          >
            পরবর্তী
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={() => setShowSubmitDialog(true)}
            className="bg-green-600 hover:bg-green-700"
            data-testid="button-submit-exam"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            জমা দিন
          </Button>
        )}
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>পরীক্ষা জমা দিন?</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি {answeredCount} টি প্রশ্নের উত্তর দিয়েছেন মোট {totalQuestions} টি প্রশ্নের মধ্যে।
              {answeredCount < totalQuestions && (
                <span className="block mt-2 text-amber-600">
                  সতর্কতা: {totalQuestions - answeredCount} টি প্রশ্নের উত্তর দেওয়া হয়নি।
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-submit">বাতিল করুন</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={submitExamMutation.isPending}
              data-testid="button-confirm-submit"
            >
              {submitExamMutation.isPending ? 'জমা দেওয়া হচ্ছে...' : 'হ্যাঁ, জমা দিন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
