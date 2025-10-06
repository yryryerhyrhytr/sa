import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMathJax } from '@/hooks/useMathJax';
import { Plus, Trash2, Edit2, CheckCircle2, Clock, FileText, Eye, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

interface OnlineExam {
  id: string;
  title: string;
  classId: string;
  subjectId: string;
  durationMinutes: number;
  maxQuestions: number;
  status: string;
  createdAt: string;
}

interface ExamQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string | null;
  orderIndex: number;
}

interface SyllabusHierarchy {
  id: string;
  name: string;
  displayName: string;
  subjects: {
    id: string;
    displayName: string;
  }[];
}

export default function OnlineExamManager() {
  const { toast } = useToast();
  const [step, setStep] = useState<'list' | 'create' | 'questions'>('list');
  const [selectedExam, setSelectedExam] = useState<OnlineExam | null>(null);
  
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [maxQuestions, setMaxQuestions] = useState('30');
  
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState('A');
  const [explanation, setExplanation] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);

  const { data: exams = [], refetch: refetchExams } = useQuery<OnlineExam[]>({
    queryKey: ['/api/online-exams'],
  });

  const { data: syllabusHierarchy = [] } = useQuery<SyllabusHierarchy[]>({
    queryKey: ['/api/syllabus/hierarchy'],
  });

  const { data: examWithQuestions, refetch: refetchQuestions } = useQuery({
    queryKey: ['/api/online-exams', selectedExam?.id],
    enabled: !!selectedExam,
  });

  useMathJax([step, selectedExam?.id, editingQuestion?.id, JSON.stringify(examWithQuestions?.questions)]);

  const createExamMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/online-exams', data);
      return await response.json();
    },
    onSuccess: (data) => {
      setSelectedExam(data);
      setStep('questions');
      queryClient.invalidateQueries({ queryKey: ['/api/online-exams'] });
      toast({ title: 'পরীক্ষা তৈরি সফল!', description: 'এখন প্রশ্ন যোগ করুন।' });
    },
    onError: () => {
      toast({ title: 'ত্রুটি', description: 'পরীক্ষা তৈরি করতে ব্যর্থ হয়েছে।', variant: 'destructive' });
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/online-exams/${selectedExam?.id}/questions`, data);
      return await response.json();
    },
    onSuccess: () => {
      refetchQuestions();
      resetQuestionForm();
      toast({ title: 'প্রশ্ন যোগ সফল!', description: 'প্রশ্ন সফলভাবে যোগ করা হয়েছে।' });
    },
    onError: () => {
      toast({ title: 'ত্রুটি', description: 'প্রশ্ন যোগ করতে ব্যর্থ হয়েছে।', variant: 'destructive' });
    },
  });

  const publishExamMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/online-exams/${id}/publish`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/online-exams'] });
      toast({ title: 'পরীক্ষা প্রকাশিত!', description: 'শিক্ষার্থীরা এখন এই পরীক্ষা দিতে পারবে।' });
      setStep('list');
      setSelectedExam(null);
    },
    onError: (error: any) => {
      toast({ title: 'ত্রুটি', description: error.message || 'পরীক্ষা প্রকাশ করতে ব্যর্থ হয়েছে।', variant: 'destructive' });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await apiRequest('DELETE', `/api/online-exams/${selectedExam?.id}/questions/${questionId}`, {});
      return await response.json();
    },
    onSuccess: () => {
      refetchQuestions();
      toast({ title: 'প্রশ্ন মুছে ফেলা হয়েছে', description: 'প্রশ্ন সফলভাবে মুছে ফেলা হয়েছে।' });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/online-exams/${id}`, {});
      return await response.json();
    },
    onSuccess: () => {
      refetchExams();
      toast({ title: 'পরীক্ষা মুছে ফেলা হয়েছে', description: 'পরীক্ষা সফলভাবে মুছে ফেলা হয়েছে।' });
    },
  });

  const selectedClass = syllabusHierarchy.find(c => c.id === classId);

  const handleCreateExam = () => {
    if (!title || !classId || !subjectId || !durationMinutes) {
      toast({ title: 'ত্রুটি', description: 'সকল প্রয়োজনীয় তথ্য পূরণ করুন।', variant: 'destructive' });
      return;
    }
    
    createExamMutation.mutate({ title, classId, subjectId, durationMinutes, maxQuestions });
  };

  const handleAddQuestion = () => {
    if (!questionText || !optionA || !optionB || !optionC || !optionD) {
      toast({ title: 'ত্রুটি', description: 'সকল প্রশ্ন তথ্য পূরণ করুন।', variant: 'destructive' });
      return;
    }
    
    addQuestionMutation.mutate({
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      explanation: explanation || null
    });
  };

  const resetQuestionForm = () => {
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectOption('A');
    setExplanation('');
    setEditingQuestion(null);
  };

  const handlePublish = () => {
    if (!selectedExam) return;
    publishExamMutation.mutate(selectedExam.id);
  };

  if (step === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              অনলাইন পরীক্ষা
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">পরীক্ষা তৈরি এবং পরিচালনা করুন</p>
          </div>
          <Button 
            onClick={() => setStep('create')} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            data-testid="button-create-exam"
          >
            <Plus className="mr-2 h-4 w-4" />
            নতুন পরীক্ষা তৈরি করুন
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <Card key={exam.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-xl hover-elevate" data-testid={`exam-${exam.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{exam.title}</CardTitle>
                  <Badge className={
                    exam.status === 'published' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0' 
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0'
                  }>
                    {exam.status === 'published' ? 'প্রকাশিত' : 'খসড়া'}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <Clock className="w-4 h-4" />
                  {exam.durationMinutes} মিনিট
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedExam(exam);
                      setStep('questions');
                    }}
                    data-testid={`button-view-${exam.id}`}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    দেখুন
                  </Button>
                  {exam.status === 'draft' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteExamMutation.mutate(exam.id)}
                      data-testid={`button-delete-${exam.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {exams.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">কোনো পরীক্ষা তৈরি করা হয়নি</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">নতুন পরীক্ষা তৈরি করতে উপরের বাটনে ক্লিক করুন</p>
          </div>
        )}
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              নতুন অনলাইন পরীক্ষা তৈরি করুন
            </CardTitle>
            <CardDescription>পরীক্ষার বিস্তারিত তথ্য দিন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="exam-title" data-testid="label-exam-title">পরীক্ষার নাম *</Label>
              <Input
                id="exam-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: বার্ষিক পরীক্ষা ২০২৫"
                data-testid="input-exam-title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class-select" data-testid="label-class">শ্রেণী *</Label>
                <Select value={classId} onValueChange={(value) => {
                  setClassId(value);
                  setSubjectId('');
                }}>
                  <SelectTrigger id="class-select" data-testid="select-class">
                    <SelectValue placeholder="শ্রেণী নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {syllabusHierarchy.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject-select" data-testid="label-subject">বিষয় *</Label>
                <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
                  <SelectTrigger id="subject-select" data-testid="select-subject">
                    <SelectValue placeholder="বিষয় নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedClass?.subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" data-testid="label-duration">সময়সীমা (মিনিট) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="60"
                  data-testid="input-duration"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-questions" data-testid="label-max-questions">সর্বোচ্চ প্রশ্ন সংখ্যা</Label>
                <Input
                  id="max-questions"
                  type="number"
                  value={maxQuestions}
                  onChange={(e) => setMaxQuestions(e.target.value)}
                  placeholder="30"
                  data-testid="input-max-questions"
                  max="30"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('list')}
                data-testid="button-cancel"
              >
                বাতিল করুন
              </Button>
              <Button
                onClick={handleCreateExam}
                disabled={createExamMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                data-testid="button-create"
              >
                {createExamMutation.isPending ? 'তৈরি হচ্ছে...' : 'পরীক্ষা তৈরি করুন'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'questions') {
    const questions = examWithQuestions?.questions || [];
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{selectedExam?.title}</h2>
            <p className="text-gray-600 dark:text-gray-400">প্রশ্ন যোগ করুন ({questions.length}/{selectedExam?.maxQuestions})</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setStep('list');
              setSelectedExam(null);
            }}>
              ফিরে যান
            </Button>
            {selectedExam?.status === 'draft' && questions.length > 0 && (
              <Button
                onClick={handlePublish}
                disabled={publishExamMutation.isPending}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                data-testid="button-publish"
              >
                <Send className="mr-2 h-4 w-4" />
                {publishExamMutation.isPending ? 'প্রকাশ হচ্ছে...' : 'পরীক্ষা প্রকাশ করুন'}
              </Button>
            )}
          </div>
        </div>

        {selectedExam?.status === 'draft' && questions.length < (selectedExam?.maxQuestions || 30) && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-xl">
            <CardHeader>
              <CardTitle>নতুন প্রশ্ন যোগ করুন</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question-text" data-testid="label-question">প্রশ্ন (বাংলা ও সমীকরণ সমর্থিত) *</Label>
                <Textarea
                  id="question-text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="প্রশ্ন লিখুন... (LaTeX সমীকরণের জন্য $...$ ব্যবহার করুন)"
                  rows={3}
                  data-testid="input-question"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="option-a" data-testid="label-option-a">অপশন A *</Label>
                  <Input id="option-a" value={optionA} onChange={(e) => setOptionA(e.target.value)} data-testid="input-option-a" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="option-b" data-testid="label-option-b">অপশন B *</Label>
                  <Input id="option-b" value={optionB} onChange={(e) => setOptionB(e.target.value)} data-testid="input-option-b" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="option-c" data-testid="label-option-c">অপশন C *</Label>
                  <Input id="option-c" value={optionC} onChange={(e) => setOptionC(e.target.value)} data-testid="input-option-c" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="option-d" data-testid="label-option-d">অপশন D *</Label>
                  <Input id="option-d" value={optionD} onChange={(e) => setOptionD(e.target.value)} data-testid="input-option-d" />
                </div>
              </div>

              <div className="space-y-2">
                <Label data-testid="label-correct-answer">সঠিক উত্তর *</Label>
                <RadioGroup value={correctOption} onValueChange={setCorrectOption}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="A" id="correct-a" data-testid="radio-correct-a" />
                      <Label htmlFor="correct-a">A</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="B" id="correct-b" data-testid="radio-correct-b" />
                      <Label htmlFor="correct-b">B</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="C" id="correct-c" data-testid="radio-correct-c" />
                      <Label htmlFor="correct-c">C</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="D" id="correct-d" data-testid="radio-correct-d" />
                      <Label htmlFor="correct-d">D</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation" data-testid="label-explanation">ব্যাখ্যা (ঐচ্ছিক)</Label>
                <Textarea
                  id="explanation"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="উত্তরের ব্যাখ্যা লিখুন..."
                  rows={2}
                  data-testid="input-explanation"
                />
              </div>

              <Button
                onClick={handleAddQuestion}
                disabled={addQuestionMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                data-testid="button-add-question"
              >
                <Plus className="mr-2 h-4 w-4" />
                {addQuestionMutation.isPending ? 'যোগ হচ্ছে...' : 'প্রশ্ন যোগ করুন'}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">যোগকৃত প্রশ্ন ({questions.length})</h3>
          {questions.map((q: ExamQuestion, index: number) => (
            <Card key={q.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg" data-testid={`question-${q.id}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold mb-3">প্রশ্ন {index + 1}: {q.questionText}</p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className={`p-2 rounded ${q.correctOption === 'A' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        A. {q.optionA}
                      </div>
                      <div className={`p-2 rounded ${q.correctOption === 'B' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        B. {q.optionB}
                      </div>
                      <div className={`p-2 rounded ${q.correctOption === 'C' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        C. {q.optionC}
                      </div>
                      <div className={`p-2 rounded ${q.correctOption === 'D' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        D. {q.optionD}
                      </div>
                    </div>
                    {q.explanation && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <strong>ব্যাখ্যা:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                  {selectedExam?.status === 'draft' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteQuestionMutation.mutate(q.id)}
                      data-testid={`button-delete-question-${q.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
