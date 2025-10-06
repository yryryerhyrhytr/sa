import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Trash2, Bot, User, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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

const samplePrompts: Record<string, string[]> = {
  'গণিত': [
    'দ্বিঘাত সমীকরণ কিভাবে সমাধান করবো?',
    'বৃত্তের ক্ষেত্রফল নির্ণয়ের সূত্র ব্যাখ্যা করুন',
    'ত্রিকোণমিতির মূলনীতি কি?',
  ],
  'পদার্থবিজ্ঞান': [
    'নিউটনের গতিসূত্র ব্যাখ্যা করুন',
    'তড়িৎ প্রবাহ কি?',
    'আলোর প্রতিসরণ কিভাবে ঘটে?',
  ],
  'রসায়ন': [
    'রাসায়নিক বন্ধন কি?',
    'অম্ল ও ক্ষার এর পার্থক্য',
    'পর্যায় সারণির ব্যবহার কি?',
  ],
  'জীববিজ্ঞান': [
    'সালোকসংশ্লেষণ প্রক্রিয়া ব্যাখ্যা করুন',
    'কোষ বিভাজন কিভাবে হয়?',
    'DNA এর গঠন কি?',
  ],
};

export default function AISolver() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { toast } = useToast();

  const [classId, setClassId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [chapterId, setChapterId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const { data: syllabusHierarchy = [], isLoading: loadingSyllabus } = useQuery<SyllabusHierarchy[]>({
    queryKey: ['/api/syllabus/hierarchy'],
  });

  const selectedClass = syllabusHierarchy.find(c => c.id === classId);
  const selectedSubject = selectedClass?.subjects.find(s => s.id === subjectId);
  const subjectPrompts = samplePrompts[selectedSubject?.displayName || ''] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  const handleSend = async () => {
    if (!inputMessage.trim() || !classId || !subjectId) {
      toast({
        title: 'অসম্পূর্ণ তথ্য',
        description: 'দয়া করে শ্রেণী, বিষয় এবং বার্তা লিখুন।',
        variant: 'destructive',
      });
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsStreaming(true);
    setCurrentResponse('');

    try {
      const conversationHistory = newMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const requestBody = {
        classId,
        subjectId,
        chapterId: chapterId || undefined,
        prompt: userMessage,
        conversationHistory: conversationHistory.slice(0, -1),
      };

      const response = await fetch('/api/praggo/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to AI solver');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                setMessages([...newMessages, { role: 'assistant', content: accumulatedResponse }]);
                setCurrentResponse('');
                setIsStreaming(false);
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.chunk) {
                  accumulatedResponse += parsed.chunk;
                  setCurrentResponse(accumulatedResponse);
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }

      if (accumulatedResponse) {
        setMessages([...newMessages, { role: 'assistant', content: accumulatedResponse }]);
      }
    } catch (error: any) {
      console.error('Error in AI solver:', error);
      toast({
        title: 'ত্রুটি',
        description: error.message || 'AI থেকে উত্তর পেতে ব্যর্থ হয়েছে।',
        variant: 'destructive',
      });
    } finally {
      setIsStreaming(false);
      setCurrentResponse('');
    }
  };

  const handleClear = () => {
    setMessages([]);
    setCurrentResponse('');
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    toast({
      title: 'পরিষ্কার করা হয়েছে',
      description: 'চ্যাট ইতিহাস মুছে ফেলা হয়েছে।',
    });
  };

  const handleSamplePrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <div className={`p-4 md:p-6 h-full flex flex-col ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="mb-6">
        <h1 className={`text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Bot className="w-7 h-7 text-blue-500" />
          AI Solver
        </h1>
        <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          আপনার প্রশ্নের উত্তর পেতে AI এর সাহায্য নিন
        </p>
      </div>

      <Card className={`mb-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
        <CardHeader>
          <CardTitle>বিষয় নির্বাচন</CardTitle>
          <CardDescription>প্রশ্ন করার জন্য শ্রেণী এবং বিষয় নির্বাচন করুন</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ai-class-select" data-testid="label-ai-class">শ্রেণী</Label>
              <Select value={classId} onValueChange={(value) => {
                setClassId(value);
                setSubjectId('');
                setChapterId('');
              }}>
                <SelectTrigger id="ai-class-select" data-testid="select-ai-class">
                  <SelectValue placeholder="শ্রেণী নির্বাচন করুন" />
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

            <div className="space-y-2">
              <Label htmlFor="ai-subject-select" data-testid="label-ai-subject">বিষয়</Label>
              <Select value={subjectId} onValueChange={(value) => {
                setSubjectId(value);
                setChapterId('');
              }} disabled={!classId}>
                <SelectTrigger id="ai-subject-select" data-testid="select-ai-subject">
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

            <div className="space-y-2">
              <Label htmlFor="ai-chapter-select" data-testid="label-ai-chapter">অধ্যায় (ঐচ্ছিক)</Label>
              <Select value={chapterId} onValueChange={setChapterId} disabled={!subjectId}>
                <SelectTrigger id="ai-chapter-select" data-testid="select-ai-chapter">
                  <SelectValue placeholder="অধ্যায় নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল অধ্যায়</SelectItem>
                  {selectedSubject?.chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {subjectPrompts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                নমুনা প্রশ্ন:
              </div>
              <div className="flex flex-wrap gap-2">
                {subjectPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSamplePrompt(prompt)}
                    disabled={isStreaming}
                    data-testid={`button-sample-${index}`}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={`flex-1 flex flex-col ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>চ্যাট</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={messages.length === 0 || isStreaming}
              data-testid="button-clear-chat"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              পরিষ্কার করুন
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && !currentResponse && (
                <div className="text-center py-12">
                  <Bot className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    আপনার প্রশ্ন জিজ্ঞাসা করুন...
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.role}-${index}`}
                >
                  {message.role === 'assistant' && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                      <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? isDarkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : isDarkMode
                        ? 'bg-slate-700 text-gray-100'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-green-900' : 'bg-green-100'}`}>
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </div>
              ))}

              {currentResponse && (
                <div className="flex gap-3 justify-start" data-testid="message-streaming">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className={`max-w-[80%] rounded-lg p-3 ${isDarkMode ? 'bg-slate-700 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
                    <p className="whitespace-pre-wrap">{currentResponse}</p>
                  </div>
                </div>
              )}

              {isStreaming && !currentResponse && (
                <div className="flex gap-3 justify-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="আপনার প্রশ্ন লিখুন..."
                disabled={isStreaming || !classId || !subjectId}
                className="flex-1"
                rows={3}
                data-testid="input-message"
              />
              <Button
                onClick={handleSend}
                disabled={isStreaming || !inputMessage.trim() || !classId || !subjectId}
                size="icon"
                className="self-end"
                data-testid="button-send"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
