import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Copy, Download, CheckCircle2, BookOpen, GraduationCap, FileQuestion, Target, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface GeneratedQuestion {
  questionText: string;
  questionType: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  solution: string;
}

interface SyllabusHierarchy {
  id: string;
  name: string;
  displayName: string;
  level: string;
  displayOrder: number;
  subjects: {
    id: string;
    name: string;
    displayName: string;
    code: string;
    displayOrder: number;
    chapters: {
      id: string;
      title: string;
      titleBn?: string;
      sequence: number;
    }[];
  }[];
}

export default function QuestionBuilder() {
  const { toast } = useToast();

  const [classId, setClassId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [chapterId, setChapterId] = useState<string>('');
  const [questionType, setQuestionType] = useState<string>('mcq');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [category, setCategory] = useState<string>('mixed');
  const [quantity, setQuantity] = useState<string>('5');
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { data: syllabusHierarchy = [], isLoading: loadingSyllabus } = useQuery<SyllabusHierarchy[]>({
    queryKey: ['/api/syllabus/hierarchy'],
  });

  const selectedClass = syllabusHierarchy.find(c => c.id === classId);
  const selectedSubject = selectedClass?.subjects.find(s => s.id === subjectId);

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/praggo/generate-questions', data);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedQuestions(data);
      toast({
        title: 'প্রশ্ন তৈরি সফল!',
        description: `${data.length}টি প্রশ্ন সফলভাবে তৈরি হয়েছে।`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'ত্রুটি',
        description: error.message || 'প্রশ্ন তৈরি করতে ব্যর্থ হয়েছে।',
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = () => {
    if (!classId || !subjectId || !questionType || !difficulty || !category || !quantity) {
      toast({
        title: 'অসম্পূর্ণ তথ্য',
        description: 'দয়া করে সকল প্রয়োজনীয় ক্ষেত্র পূরণ করুন।',
        variant: 'destructive',
      });
      return;
    }

    generateMutation.mutate({
      classId,
      subjectId,
      chapterId: chapterId || undefined,
      questionType,
      difficulty,
      category,
      quantity: parseInt(quantity),
    });
  };

  const handleCopy = (question: GeneratedQuestion, index: number) => {
    let text = `প্রশ্ন: ${question.questionText}\n\n`;
    
    if (question.options && question.options.length > 0) {
      question.options.forEach((opt, i) => {
        const label = ['ক', 'খ', 'গ', 'ঘ'][i];
        text += `${label}) ${opt}\n`;
      });
      text += `\nসঠিক উত্তর: ${question.correctAnswer}\n`;
    }
    
    if (question.explanation) {
      text += `\nব্যাখ্যা: ${question.explanation}\n`;
    }
    
    if (question.solution) {
      text += `\nসমাধান: ${question.solution}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    
    toast({
      title: 'কপি সফল!',
      description: 'প্রশ্নটি ক্লিপবোর্ডে কপি করা হয়েছে।',
    });
  };

  const handleDownload = () => {
    let content = 'প্রশ্ন ব্যাংক\n';
    content += `=====================\n\n`;
    
    generatedQuestions.forEach((q, i) => {
      content += `প্রশ্ন ${i + 1}: ${q.questionText}\n\n`;
      
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, j) => {
          const label = ['ক', 'খ', 'গ', 'ঘ'][j];
          content += `${label}) ${opt}\n`;
        });
        content += `\nসঠিক উত্তর: ${q.correctAnswer}\n`;
      }
      
      if (q.explanation) {
        content += `\nব্যাখ্যা: ${q.explanation}\n`;
      }
      
      if (q.solution) {
        content += `\nসমাধান: ${q.solution}\n`;
      }
      
      content += `\n${'='.repeat(50)}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'ডাউনলোড সফল!',
      description: 'প্রশ্নগুলো ফাইলে সংরক্ষণ করা হয়েছে।',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Praggo AI Question Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            NCTB পাঠ্যক্রম অনুযায়ী স্বয়ংক্রিয়ভাবে প্রশ্ন তৈরি করুন - AI দ্বারা চালিত
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="hover-elevate bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">ক্লাস</p>
                <p className="text-sm font-bold">{selectedClass?.displayName || 'নির্বাচন করুন'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">বিষয়</p>
                <p className="text-sm font-bold truncate">{selectedSubject?.displayName || 'নির্বাচন করুন'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileQuestion className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">প্রশ্নের ধরন</p>
                <p className="text-sm font-bold">{questionType === 'mcq' ? 'MCQ' : questionType === 'cq' ? 'CQ' : 'Creative'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">সংখ্যা</p>
                <p className="text-sm font-bold">{quantity}টি</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Configuration Card */}
        <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-xl">
          <CardHeader className="border-b dark:border-slate-700">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              প্রশ্ন তৈরির কনফিগারেশন
            </CardTitle>
            <CardDescription>প্রশ্নের ধরন, অসুবিধা এবং বিষয়বস্তু নির্বাচন করুন</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Class Selection */}
              <div className="space-y-2">
                <Label htmlFor="class-select" className="text-sm font-medium" data-testid="label-class">
                  শ্রেণী নির্বাচন করুন
                </Label>
                <Select value={classId} onValueChange={(value) => {
                  setClassId(value);
                  setSubjectId('');
                  setChapterId('');
                }}>
                  <SelectTrigger id="class-select" data-testid="select-class" className="h-11">
                    <SelectValue placeholder="শ্রেণী" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingSyllabus ? (
                      <SelectItem value="loading">লোড হচ্ছে...</SelectItem>
                    ) : (
                      syllabusHierarchy.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.displayName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Selection */}
              <div className="space-y-2">
                <Label htmlFor="subject-select" className="text-sm font-medium" data-testid="label-subject">
                  বিষয় নির্বাচন করুন
                </Label>
                <Select value={subjectId} onValueChange={(value) => {
                  setSubjectId(value);
                  setChapterId('');
                }} disabled={!classId}>
                  <SelectTrigger id="subject-select" data-testid="select-subject" className="h-11">
                    <SelectValue placeholder="বিষয়" />
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

              {/* Chapter Selection */}
              <div className="space-y-2">
                <Label htmlFor="chapter-select" className="text-sm font-medium" data-testid="label-chapter">
                  অধ্যায় (ঐচ্ছিক)
                </Label>
                <Select value={chapterId} onValueChange={setChapterId} disabled={!subjectId}>
                  <SelectTrigger id="chapter-select" data-testid="select-chapter" className="h-11">
                    <SelectValue placeholder="সকল অধ্যায়" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল অধ্যায়</SelectItem>
                    {selectedSubject?.chapters.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id}>
                        {chapter.titleBn || chapter.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question Type */}
              <div className="space-y-2">
                <Label htmlFor="question-type" className="text-sm font-medium" data-testid="label-question-type">
                  প্রশ্নের ধরন
                </Label>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger id="question-type" data-testid="select-question-type" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">MCQ (বহুনির্বাচনী)</SelectItem>
                    <SelectItem value="cq">CQ (সৃজনশীল প্রশ্ন)</SelectItem>
                    <SelectItem value="creative">Creative (সম্পূর্ণ সৃজনশীল)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label htmlFor="difficulty" className="text-sm font-medium" data-testid="label-difficulty">
                  অসুবিধার মাত্রা
                </Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty" data-testid="select-difficulty" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">সহজ</SelectItem>
                    <SelectItem value="medium">মাঝারি</SelectItem>
                    <SelectItem value="hard">কঠিন</SelectItem>
                    <SelectItem value="mixed">মিশ্র</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium" data-testid="label-category">
                  বিভাগ
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" data-testid="select-category" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">গণিত</SelectItem>
                    <SelectItem value="theory">তত্ত্ব</SelectItem>
                    <SelectItem value="mixed">মিশ্র</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="quantity" className="text-sm font-medium" data-testid="label-quantity">
                  প্রশ্নের সংখ্যা
                </Label>
                <Select value={quantity} onValueChange={setQuantity}>
                  <SelectTrigger id="quantity" data-testid="select-quantity" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">১টি প্রশ্ন</SelectItem>
                    <SelectItem value="5">৫টি প্রশ্ন</SelectItem>
                    <SelectItem value="10">১০টি প্রশ্ন</SelectItem>
                    <SelectItem value="15">১৫টি প্রশ্ন</SelectItem>
                    <SelectItem value="20">২০টি প্রশ্ন</SelectItem>
                    <SelectItem value="25">২৫টি প্রশ্ন</SelectItem>
                    <SelectItem value="30">৩০টি প্রশ্ন</SelectItem>
                    <SelectItem value="40">৪০টি প্রশ্ন</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              data-testid="button-generate"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  প্রশ্ন তৈরি হচ্ছে...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  AI দিয়ে প্রশ্ন তৈরি করুন
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Questions Section */}
        {generatedQuestions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    তৈরি করা প্রশ্ন
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    মোট {generatedQuestions.length}টি প্রশ্ন সফলভাবে তৈরি হয়েছে
                  </p>
                </div>
              </div>
              <Button onClick={handleDownload} variant="outline" size="lg" data-testid="button-download" className="gap-2">
                <Download className="h-4 w-4" />
                ডাউনলোড
              </Button>
            </div>

            <div className="grid gap-6">
              {generatedQuestions.map((question, index) => (
                <Card key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg hover-elevate">
                  <CardHeader className="border-b dark:border-slate-700 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1">
                          প্রশ্ন {index + 1}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {question.questionType === 'mcq' ? 'MCQ' : question.questionType === 'cq' ? 'CQ' : 'Creative'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(question, index)}
                        data-testid={`button-copy-${index}`}
                        className="gap-2"
                      >
                        {copiedIndex === index ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-500">কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span className="text-xs">কপি করুন</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {/* Question Text */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
                        {question.questionText}
                      </p>
                    </div>

                    {/* Options for MCQ */}
                    {question.options && question.options.length > 0 && (
                      <div className="grid gap-2">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 hover-elevate"
                          >
                            <span className="font-bold text-purple-600 dark:text-purple-400 mr-2">
                              {['ক', 'খ', 'গ', 'ঘ'][optIndex]})
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">{option}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Correct Answer */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        সঠিক উত্তর
                      </p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {question.correctAnswer}
                      </p>
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">
                          ব্যাখ্যা
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {question.explanation}
                        </p>
                      </div>
                    )}

                    {/* Solution */}
                    {question.solution && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-2">
                          সমাধান
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {question.solution}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
