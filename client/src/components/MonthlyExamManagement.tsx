import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calendar, FileText, Trophy, Download, CheckCircle, Send } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Component for individual exam card
function ExamCard({ exam, selectedMonth, students, isDarkMode, onOpenMarkEntry, allMonthlyMarks }: any) {
  const marksData = allMonthlyMarks.filter((m: any) => m.individualExamId === exam.id);
  
  const marksCount = marksData.length;
  const totalStudents = students.filter((s: any) => s.batchId === selectedMonth?.batchId).length;
  const hasMarks = marksCount > 0;
  
  return (
    <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
      <CardHeader>
        <CardTitle className="text-base">{exam.name}</CardTitle>
        {hasMarks && (
          <Badge variant="outline" className="text-xs w-fit mt-1">
            {marksCount}/{totalStudents} marks saved
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Subject: <span className="font-medium">{exam.subject}</span>
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Marks: <span className="font-medium">{exam.totalMarks}</span>
          </p>
          <Button 
            size="sm" 
            className="w-full" 
            onClick={() => onOpenMarkEntry(exam)}
            data-testid={`button-enter-marks-${exam.id}`}
          >
            <FileText className="w-4 h-4 mr-2" />
            {hasMarks ? 'View/Edit Marks' : 'Enter Marks'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MonthlyExamManagement() {
  const { theme } = useTheme();
  const { toast } = useToast();
  const isDarkMode = theme === 'dark';
  
  const [isCreateMonthOpen, setIsCreateMonthOpen] = useState(false);
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isMarkEntryOpen, setIsMarkEntryOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);

  // Form states
  const [monthForm, setMonthForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    batchId: '',
    title: ''
  });

  const [examForm, setExamForm] = useState({
    name: '',
    subject: 'math' as 'math' | 'higher_math' | 'science',
    totalMarks: 100
  });

  const [markEntries, setMarkEntries] = useState<{ studentId: string; obtainedMarks: number }[]>([]);
  const [bonusMarks, setBonusMarks] = useState<{ [studentId: string]: number }>({});

  // Fetch batches
  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches'],
  });

  // Fetch monthly exams
  const { data: monthlyExams = [] } = useQuery<any[]>({
    queryKey: ['/api/monthly-exams'],
  });

  // Fetch students for selected batch
  const { data: students = [] } = useQuery<any[]>({
    queryKey: ['/api/students'],
    enabled: !!selectedMonth
  });

  // Fetch individual exams for selected month
  const { data: individualExams = [] } = useQuery<any[]>({
    queryKey: ['/api/monthly-exams', selectedMonth?.id, 'exams'],
    enabled: !!selectedMonth
  });

  // Fetch monthly results
  const { data: monthlyResults = [] } = useQuery<any[]>({
    queryKey: ['/api/monthly-exams', selectedMonth?.id, 'results'],
    enabled: !!selectedMonth
  });

  // Fetch all marks for the monthly exam (for results table display)
  const { data: allMonthlyMarks = [] } = useQuery<any[]>({
    queryKey: ['/api/monthly-exams', selectedMonth?.id, 'marks'],
    enabled: !!selectedMonth
  });

  // Fetch existing marks for selected exam
  const { data: existingMarks = [] } = useQuery<any[]>({
    queryKey: ['/api/individual-exams', selectedExam?.id, 'marks'],
    enabled: !!selectedExam && isMarkEntryOpen
  });

  // Fetch settings for SMS balance
  const { data: settings } = useQuery<any>({
    queryKey: ['/api/settings'],
  });

  // Initialize markEntries with existing marks when dialog opens
  useEffect(() => {
    if (isMarkEntryOpen && selectedExam && selectedMonth) {
      const batchStudents = students.filter(s => s.batchId === selectedMonth.batchId);
      
      if (existingMarks && existingMarks.length > 0) {
        // Populate with existing marks
        setMarkEntries(existingMarks.map(mark => ({
          studentId: mark.studentId,
          obtainedMarks: mark.obtainedMarks
        })));
      } else {
        // Initialize with 0 for all batch students
        setMarkEntries(batchStudents.map(student => ({
          studentId: student.id,
          obtainedMarks: 0
        })));
      }
    }
  }, [isMarkEntryOpen, selectedExam, selectedMonth, existingMarks, students]);

  // Create monthly exam mutation
  const createMonthMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/monthly-exams', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-exams'] });
      setIsCreateMonthOpen(false);
      setMonthForm({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), batchId: '', title: '' });
      toast({ title: 'Success', description: 'Monthly exam period created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create monthly exam', variant: 'destructive' });
    },
  });

  // Create individual exam mutation
  const createExamMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/individual-exams', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-exams', selectedMonth?.id, 'exams'] });
      setIsCreateExamOpen(false);
      setExamForm({ name: '', subject: 'math', totalMarks: 100 });
      toast({ title: 'Success', description: 'Individual exam created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create exam', variant: 'destructive' });
    },
  });

  // Save marks mutation
  const saveMarksMutation = useMutation({
    mutationFn: async (data: { marks: any[], sendSms: boolean }) => {
      const res = await apiRequest('POST', '/api/monthly-marks/bulk', data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/individual-exams', selectedExam?.id, 'marks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-exams', selectedMonth?.id, 'marks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setIsMarkEntryOpen(false);
      setMarkEntries([]);
      
      let description = `${data.marksCount} marks saved successfully`;
      if (data.smsCount) {
        description += `. ${data.smsCount} SMS sent (${data.smsCount} SMS used, ${data.newBalance} remaining)`;
      }
      
      toast({ title: 'Success', description });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to save marks', variant: 'destructive' });
    },
  });

  // Finalize monthly exam mutation
  const finalizeMutation = useMutation({
    mutationFn: async (monthlyExamId: string) => {
      return await apiRequest('POST', `/api/monthly-exams/${monthlyExamId}/finalize`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-exams'] });
      toast({ title: 'Success', description: 'Monthly exam finalized and ranks generated!' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to finalize exam', variant: 'destructive' });
    },
  });

  // Unfinalize monthly exam mutation
  const unfinalizeMutation = useMutation({
    mutationFn: async (monthlyExamId: string) => {
      const res = await apiRequest('PATCH', `/api/monthly-exams/${monthlyExamId}/unfinalize`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-exams'] });
      toast({ title: 'Success', description: 'Monthly exam unfinalized. You can now edit and regenerate rankings.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to unfinalize exam', variant: 'destructive' });
    },
  });

  // Update bonus marks mutation
  const updateBonusMutation = useMutation({
    mutationFn: async ({ monthlyExamId, studentId, bonusMarks }: any) => {
      return await apiRequest('PUT', `/api/monthly-exams/${monthlyExamId}/bonus-marks`, { studentId, bonusMarks });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-exams', selectedMonth?.id, 'results'] });
      toast({ title: 'Success', description: 'Bonus marks updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update bonus marks', variant: 'destructive' });
    },
  });

  // Generate final ranking mutation
  const generateRankingMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('POST', `/api/monthly-exams/${id}/generate-ranking`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-exams', selectedMonth?.id, 'results'] });
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-exams'] });
      toast({ title: 'Success', description: 'Final ranking generated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to generate ranking', variant: 'destructive' });
    },
  });

  const downloadRankTable = () => {
    if (!monthlyResults || monthlyResults.length === 0) {
      toast({ title: 'Error', description: 'No results available to download', variant: 'destructive' });
      return;
    }

    // Helper function to escape CSV fields
    const escapeCsvField = (field: any): string => {
      const str = String(field);
      // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Get batch name from selected month
    const batch = batches.find(b => b.id === selectedMonth?.batchId);
    const batchName = batch?.name || 'Unknown Batch';
    const monthYear = `${selectedMonth?.title || 'Unknown Month'}`;

    // Build CSV content with proper escaping
    const headers = ['Rank', 'Student Name', 'Exam Marks', 'Attendance Marks', 'Bonus Marks', 'Final Total', 'Percentage'];
    
    // Create a sorted copy to avoid mutating state
    const sortedResults = [...monthlyResults].sort((a, b) => (a.rank || 999) - (b.rank || 999));
    
    const rows = sortedResults.map(result => {
      const student = students.find(s => s.id === result.studentId);
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown';
      return [
        escapeCsvField(result.rank || '-'),
        escapeCsvField(studentName),
        escapeCsvField(result.totalExamMarks || 0),
        escapeCsvField(result.attendanceMarks || 0),
        escapeCsvField(result.bonusMarks || 0),
        escapeCsvField(result.finalTotal || 0),
        escapeCsvField(result.percentage ? `${result.percentage}%` : '-')
      ];
    });

    // Convert to CSV
    const csvContent = [
      escapeCsvField(`Monthly Exam Results - ${batchName} - ${monthYear}`),
      '', // Empty row
      headers.map(h => escapeCsvField(h)).join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rank_Table_${batchName.replace(/\s+/g, '_')}_${monthYear.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: 'Success', description: 'Rank table downloaded successfully' });
  };

  const handleCreateMonth = () => {
    if (!monthForm.batchId || !monthForm.title) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    createMonthMutation.mutate(monthForm);
  };

  const handleCreateExam = () => {
    if (!examForm.name || !selectedMonth) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    createExamMutation.mutate({
      ...examForm,
      monthlyExamId: selectedMonth.id
    });
  };

  const handleMarkEntry = (studentId: string, marks: number) => {
    setMarkEntries(prev => {
      const existing = prev.find(m => m.studentId === studentId);
      if (existing) {
        return prev.map(m => m.studentId === studentId ? { ...m, obtainedMarks: marks } : m);
      }
      return [...prev, { studentId, obtainedMarks: marks }];
    });
  };

  const handleSaveMarks = (sendSms: boolean = false) => {
    if (!selectedExam || markEntries.length === 0) {
      toast({ title: 'Error', description: 'Please enter marks for at least one student', variant: 'destructive' });
      return;
    }

    const marks = markEntries.map(entry => ({
      monthlyExamId: selectedMonth.id,
      individualExamId: selectedExam.id,
      studentId: entry.studentId,
      obtainedMarks: entry.obtainedMarks
    }));

    saveMarksMutation.mutate({ marks, sendSms });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  const batchStudents = students.filter(s => s.batchId === selectedMonth?.batchId);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Monthly Exam Management
        </h1>
        
        <Dialog open={isCreateMonthOpen} onOpenChange={setIsCreateMonthOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-month">
              <Plus className="w-4 h-4 mr-2" />
              Create Month Period
            </Button>
          </DialogTrigger>
          <DialogContent className={isDarkMode ? 'bg-slate-800 text-white' : 'bg-white'}>
            <DialogHeader>
              <DialogTitle>Create Monthly Exam Period</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Month</Label>
                <Select
                  value={monthForm.month.toString()}
                  onValueChange={(value) => setMonthForm({ ...monthForm, month: parseInt(value) })}
                >
                  <SelectTrigger data-testid="select-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  value={monthForm.year}
                  onChange={(e) => setMonthForm({ ...monthForm, year: parseInt(e.target.value) })}
                  data-testid="input-year"
                />
              </div>

              <div>
                <Label>Batch</Label>
                <Select
                  value={monthForm.batchId}
                  onValueChange={(value) => setMonthForm({ ...monthForm, batchId: value })}
                >
                  <SelectTrigger data-testid="select-batch">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} - Class {batch.classTime || 'N/A'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={monthForm.title}
                  onChange={(e) => setMonthForm({ ...monthForm, title: e.target.value })}
                  placeholder="e.g., November 2025 Monthly Exam"
                  data-testid="input-title"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateMonthOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateMonth} disabled={createMonthMutation.isPending} data-testid="button-submit-month">
                  {createMonthMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedMonth ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedMonth.title}
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Managing individual exams for this month
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedMonth(null)}>
                Back to List
              </Button>
              {!selectedMonth.isFinalized && (
                <Button onClick={() => finalizeMutation.mutate(selectedMonth.id)} disabled={finalizeMutation.isPending}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {finalizeMutation.isPending ? 'Finalizing...' : 'Finalize & Generate Ranks'}
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="exams">
            <TabsList>
              <TabsTrigger value="exams">Individual Exams</TabsTrigger>
              <TabsTrigger value="results">Results & Rankings</TabsTrigger>
            </TabsList>

            <TabsContent value="exams" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Individual Exams
                </h3>
                <Dialog open={isCreateExamOpen} onOpenChange={setIsCreateExamOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-exam">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Exam
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={isDarkMode ? 'bg-slate-800 text-white' : 'bg-white'}>
                    <DialogHeader>
                      <DialogTitle>Create Individual Exam</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Exam Name</Label>
                        <Input
                          value={examForm.name}
                          onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                          placeholder="e.g., Algebra Test, Physics Quiz"
                          data-testid="input-exam-name"
                        />
                      </div>

                      <div>
                        <Label>Subject</Label>
                        <Select
                          value={examForm.subject}
                          onValueChange={(value: any) => setExamForm({ ...examForm, subject: value })}
                        >
                          <SelectTrigger data-testid="select-subject">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="math">Mathematics</SelectItem>
                            <SelectItem value="higher_math">Higher Math</SelectItem>
                            <SelectItem value="science">Science</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Total Marks</Label>
                        <Input
                          type="number"
                          value={examForm.totalMarks}
                          onChange={(e) => setExamForm({ ...examForm, totalMarks: parseInt(e.target.value) })}
                          data-testid="input-total-marks"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setIsCreateExamOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateExam} disabled={createExamMutation.isPending} data-testid="button-submit-exam">
                          {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {individualExams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    selectedMonth={selectedMonth}
                    students={students}
                    isDarkMode={isDarkMode}
                    allMonthlyMarks={allMonthlyMarks}
                    onOpenMarkEntry={(exam: any) => {
                      setSelectedExam(exam);
                      setIsMarkEntryOpen(true);
                    }}
                  />
                ))}

                {individualExams.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <FileText className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No individual exams created yet
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4 mt-4">
              {!selectedMonth.isFinalized && monthlyResults.length === 0 && individualExams.length > 0 && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-amber-900/30 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`}>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                    📋 How to Generate Rankings:
                  </h4>
                  <ol className={`text-sm space-y-1 list-decimal list-inside ${isDarkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                    <li>Enter marks for all individual exams in the "Individual Exams" tab</li>
                    <li>Come back to this "Results & Rankings" tab</li>
                    <li>Click "Generate Final Ranking" button below</li>
                    <li>Review the results and add bonus marks if needed</li>
                    <li>Click "Finalize & Generate Ranks" to lock the results</li>
                  </ol>
                </div>
              )}
              {!selectedMonth.isFinalized && monthlyResults.length > 0 && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>
                    <strong>💡 Tip:</strong> If you edited any exam marks or bonus marks, click "Generate Final Ranking" again to update the rankings before finalizing.
                  </p>
                </div>
              )}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Monthly Results & Rankings
                  </h3>
                  {selectedMonth.isFinalized && (
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      This exam is finalized. Results are locked.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedMonth.isFinalized ? (
                    <Button 
                      onClick={() => unfinalizeMutation.mutate(selectedMonth.id)}
                      disabled={unfinalizeMutation.isPending}
                      variant="outline"
                      data-testid="button-unfinalize"
                    >
                      {unfinalizeMutation.isPending ? 'Unfinalizing...' : 'Unfinalize Exam'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => generateRankingMutation.mutate(selectedMonth.id)}
                      disabled={generateRankingMutation.isPending}
                      data-testid="button-generate-ranking"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      {generateRankingMutation.isPending ? 'Generating...' : 'Generate Final Ranking'}
                    </Button>
                  )}
                  <Button 
                    onClick={() => downloadRankTable()}
                    disabled={monthlyResults.length === 0}
                    variant="outline"
                    data-testid="button-download-rank-table"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Rank Table
                  </Button>
                </div>
              </div>

              {monthlyResults.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Student Name</TableHead>
                        {individualExams.map((exam) => (
                          <TableHead key={exam.id} className="text-center">
                            {exam.name}<br/>
                            <span className="text-xs font-normal">({exam.totalMarks})</span>
                          </TableHead>
                        ))}
                        <TableHead className="text-center">Total Exam</TableHead>
                        <TableHead className="text-center">Attendance</TableHead>
                        <TableHead className="text-center">Bonus</TableHead>
                        <TableHead className="text-center font-semibold">Final Total</TableHead>
                        <TableHead className="text-center">Percentage</TableHead>
                        <TableHead className="text-center">GPA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyResults.map((result) => {
                        const student = students.find(s => s.id === result.studentId);
                        return (
                          <TableRow key={result.id}>
                            <TableCell className="font-bold">
                              {result.rank ? `#${result.rank}` : '-'}
                            </TableCell>
                            <TableCell>
                              {student ? `${student.firstName} ${student.lastName}` : 'Unknown'}
                            </TableCell>
                            {individualExams.map((exam) => {
                              const studentMark = allMonthlyMarks.find(
                                m => m.studentId === result.studentId && m.individualExamId === exam.id
                              );
                              const obtainedMarks = studentMark?.obtainedMarks || 0;
                              const percentage = exam.totalMarks > 0 ? (obtainedMarks / exam.totalMarks) * 100 : 0;
                              const isPassed = percentage >= 40;
                              
                              return (
                                <TableCell key={exam.id} className="text-center">
                                  <span className={isPassed ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    {obtainedMarks}
                                  </span>
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-semibold">{result.totalExamMarks || 0}</TableCell>
                            <TableCell className="text-center">{result.attendanceMarks || 0}</TableCell>
                            <TableCell className="text-center">
                              {selectedMonth.isFinalized ? (
                                <span>{result.bonusMarks || 0}</span>
                              ) : (
                                <Input
                                  type="number"
                                  min="0"
                                  value={bonusMarks[result.studentId] ?? result.bonusMarks ?? 0}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    setBonusMarks({ ...bonusMarks, [result.studentId]: value });
                                  }}
                                  onBlur={() => {
                                    const value = bonusMarks[result.studentId] ?? result.bonusMarks ?? 0;
                                    if (value !== result.bonusMarks) {
                                      updateBonusMutation.mutate({
                                        monthlyExamId: selectedMonth.id,
                                        studentId: result.studentId,
                                        bonusMarks: value
                                      });
                                    }
                                  }}
                                  className="w-20"
                                  data-testid={`input-bonus-${result.studentId}`}
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-center font-bold text-blue-600">{result.finalTotal || 0}</TableCell>
                            <TableCell className="text-center">{result.percentage ? `${result.percentage}%` : '-'}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={
                                result.gpa >= 5.0 ? 'bg-green-600' : 
                                result.gpa >= 4.0 ? 'bg-blue-600' : 
                                result.gpa >= 3.0 ? 'bg-yellow-600' : 
                                result.gpa >= 2.0 ? 'bg-orange-600' : 
                                'bg-red-600'
                              }>
                                {result.gpa || '0.0'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                    No results generated yet
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Enter marks for individual exams, then click "Generate Final Ranking"
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthlyExams.map((monthExam) => {
            const batch = batches.find(b => b.id === monthExam.batchId);
            
            return (
              <Card key={monthExam.id} className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} data-testid={`card-month-${monthExam.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{monthExam.title}</CardTitle>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {monthNames[monthExam.month - 1]} {monthExam.year}
                      </p>
                    </div>
                    {monthExam.isFinalized && (
                      <Badge className="bg-green-600">Finalized</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Batch</p>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {batch?.name || 'Unknown'}
                      </p>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={() => setSelectedMonth(monthExam)}
                      data-testid={`button-manage-${monthExam.id}`}
                    >
                      Manage Exams
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {monthlyExams.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Calendar className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No monthly exam periods created yet
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mark Entry Dialog */}
      <Dialog open={isMarkEntryOpen} onOpenChange={setIsMarkEntryOpen}>
        <DialogContent className={`max-w-4xl ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {existingMarks && existingMarks.length > 0 ? 'View/Edit Marks' : 'Enter Marks'}: {selectedExam?.name} ({selectedExam?.totalMarks} marks)
              </span>
              {settings ? (
                <Badge variant="outline" className="ml-2 text-sm" data-testid="badge-sms-balance">
                  <Send className="w-3 h-3 mr-1" />
                  SMS: {settings.smsCount || 0}
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-2 text-sm opacity-50" data-testid="badge-sms-loading">
                  <Send className="w-3 h-3 mr-1" />
                  SMS: ...
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {existingMarks && existingMarks.length > 0 && (
            <div className={`p-3 rounded-lg mb-2 ${isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                <strong>Note:</strong> Marks have been previously entered for this exam. You can edit them below and click "Save Marks" to update. After saving, go to "Results & Rankings" tab and click "Generate Final Ranking" to update the rankings.
              </p>
            </div>
          )}
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Obtained Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchStudents.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{student.firstName} {student.lastName}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max={selectedExam?.totalMarks || 100}
                        value={markEntries.find(m => m.studentId === student.id)?.obtainedMarks || 0}
                        onChange={(e) => handleMarkEntry(student.id, parseFloat(e.target.value) || 0)}
                        data-testid={`input-marks-${student.id}`}
                        className="w-24"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setIsMarkEntryOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleSaveMarks(false)} 
              disabled={saveMarksMutation.isPending}
              data-testid="button-save-marks"
            >
              {saveMarksMutation.isPending ? 'Saving...' : 'Save Marks'}
            </Button>
            <Button 
              onClick={() => handleSaveMarks(true)} 
              disabled={saveMarksMutation.isPending}
              data-testid="button-save-send-sms"
            >
              <Send className="w-4 h-4 mr-2" />
              {saveMarksMutation.isPending ? 'Saving...' : 'Save & Send SMS'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
