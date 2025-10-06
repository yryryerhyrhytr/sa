import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Save, Send, Users, CheckCircle, XCircle, AlertTriangle, History, Calendar } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  parentPhoneNumber?: string;
  studentId?: string;
  batchId?: string;
}

interface Batch {
  id: string;
  name: string;
  subject: string;
  batchCode: string;
  currentStudents?: number;
}

interface Settings {
  smsCount: number;
}

interface AttendanceRecord {
  id: string;
  date: string;
  attendanceStatus: 'present' | 'absent';
  studentId: string;
  batchId: string;
  subject?: string;
  notes?: string;
  student?: {
    firstName: string;
    lastName: string;
    studentId?: string;
  };
}

export default function AttendanceManagement() {
  const { theme } = useTheme();
  const { toast } = useToast();
  const isDarkMode = theme === 'dark';

  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [key: string]: 'present' | 'absent' | undefined }>({});
  const [sendSMS, setSendSMS] = useState(false);

  // For history view
  const [historyBatch, setHistoryBatch] = useState<string>('');
  const [historyStartDate, setHistoryStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [historyEndDate, setHistoryEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // For monthly sheet view
  const [sheetBatch, setSheetBatch] = useState<string>('');
  const [sheetMonth, setSheetMonth] = useState<number>(new Date().getMonth());
  const [sheetYear, setSheetYear] = useState<number>(new Date().getFullYear());

  // Fetch batches
  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['/api/batches'],
  });

  // Fetch students for selected batch
  const { data: allStudents = [] } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  // Fetch settings for SMS balance - refetch to ensure dynamic updates
  const { data: settings, refetch: refetchSettings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to force refetch
  });

  // Fetch SMS templates
  const { data: smsTemplates = [] } = useQuery<any[]>({
    queryKey: ['/api/sms/templates'],
  });

  // Fetch attendance history
  const { data: attendanceHistory = [], isLoading: historyLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance', historyBatch],
    enabled: !!historyBatch,
  });

  // Fetch monthly attendance for sheet view - with auto-refresh
  const { data: monthlyAttendance = [], isLoading: sheetLoading } = useQuery<AttendanceRecord[]>({
    queryKey: sheetBatch ? [`/api/attendance?batchId=${sheetBatch}`] : ['/api/attendance'],
    enabled: !!sheetBatch,
    refetchInterval: 5000, // Auto-refresh every 5 seconds for dynamic updates
    refetchOnWindowFocus: true,
  });

  // Filter students by selected batch
  const students = allStudents.filter(s => s.batchId === selectedBatch);

  // Initialize attendance records when batch or date changes
  useEffect(() => {
    if (students.length > 0) {
      const initialRecords: { [key: string]: 'present' | 'absent' | undefined } = {};
      students.forEach(student => {
        initialRecords[student.id] = undefined;
      });
      setAttendanceRecords(initialRecords);
    } else {
      setAttendanceRecords({});
    }
  }, [selectedBatch, selectedDate]);

  // Calculate required SMS count (both present and absent)
  const calculateRequiredSmsCount = () => {
    const recipientCount = students.filter(s => 
      (attendanceRecords[s.id] === 'present' || attendanceRecords[s.id] === 'absent') && s.phoneNumber
    ).length;
    return recipientCount;
  };

  const smsCount = settings?.smsCount || 0;
  const requiredSmsCount = calculateRequiredSmsCount();
  const hasSufficientBalance = smsCount >= requiredSmsCount;

  // Save attendance mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: async ({ withSMS }: { withSMS: boolean }) => {
      const attendanceData = students
        .filter(student => attendanceRecords[student.id])
        .map(student => ({
          studentId: student.id,
          batchId: selectedBatch,
          date: new Date(selectedDate).toISOString(),
          attendanceStatus: attendanceRecords[student.id]!,
          subject: batches.find(b => b.id === selectedBatch)?.subject
        }));

      const savedRecords = await Promise.all(
        attendanceData.map(async (data) => {
          const res = await apiRequest('POST', '/api/attendance', data);
          return await res.json();
        })
      );

      let smsResult = null;
      if (withSMS) {
        // Check balance first
        if (!hasSufficientBalance) {
          throw new Error(`Insufficient SMS balance. Required: ${requiredSmsCount} SMS, Available: ${smsCount} SMS`);
        }

        const presentStudents = students.filter(s => attendanceRecords[s.id] === 'present');
        const absentStudents = students.filter(s => attendanceRecords[s.id] === 'absent');
        
        const batchName = batches.find(b => b.id === selectedBatch)?.name || 'Class';
        const formattedDate = new Date(selectedDate).toLocaleDateString('en-GB');
        
        const recipients: Array<{type: string; phone: string; name: string; studentId: string; message: string}> = [];

        // Present students SMS
        if (presentStudents.length > 0) {
          const presentTemplate = smsTemplates.find(t => t.templateType === 'attendance_present');
          const presentMessage = presentTemplate?.message || 
            'Assalamu Alaikum. {studentName} attended {batchName} on {date}. Thank you for regular attendance.';
          
          console.log('📨 Present SMS Template:', presentTemplate?.name, '|', presentMessage);

          presentStudents.filter(s => s.phoneNumber).forEach(s => {
            const studentName = `${s.firstName} ${s.lastName}`;
            const personalizedMessage = presentMessage
              .replace(/{studentName}/g, studentName)
              .replace(/{batchName}/g, batchName)
              .replace(/{date}/g, formattedDate);
            
            recipients.push({
              type: 'student',
              phone: s.phoneNumber,
              name: studentName,
              studentId: s.id,
              message: personalizedMessage
            });
          });
        }

        // Absent students SMS
        if (absentStudents.length > 0) {
          const absentTemplate = smsTemplates.find(t => t.templateType === 'attendance_absent');
          const absentMessage = absentTemplate?.message || 
            'Assalamu Alaikum. {studentName} was absent from {batchName} on {date}. Please ensure regular attendance.';
          
          console.log('📨 Absent SMS Template:', absentTemplate?.name, '|', absentMessage);

          absentStudents.filter(s => s.phoneNumber).forEach(s => {
            const studentName = `${s.firstName} ${s.lastName}`;
            const personalizedMessage = absentMessage
              .replace(/{studentName}/g, studentName)
              .replace(/{batchName}/g, batchName)
              .replace(/{date}/g, formattedDate);
            
            recipients.push({
              type: 'student',
              phone: s.phoneNumber,
              name: studentName,
              studentId: s.id,
              message: personalizedMessage
            });
          });
        }

        if (recipients.length > 0) {
          const res = await apiRequest('POST', '/api/sms/send', {
            recipients,
            message: 'Attendance notification',
            smsType: 'attendance',
            subject: 'Attendance Notification'
          });
          smsResult = await res.json();
        }
      }

      return { savedRecords, smsResult };
    },
    onSuccess: async (data) => {
      // Invalidate all attendance queries to refresh monthly sheet and other views
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/attendance');
        }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      // Explicitly refetch settings to update SMS balance immediately
      await refetchSettings();
      
      const message = data.smsResult 
        ? `Attendance saved successfully! ${data.smsResult.count || 0} SMS sent to students.`
        : 'Attendance saved successfully!';
      
      toast({
        title: 'Success',
        description: message,
      });

      setAttendanceRecords(
        Object.fromEntries(students.map(student => [student.id, undefined]))
      );
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save attendance',
        variant: 'destructive',
      });
    },
  });

  const toggleAttendance = (studentId: string, status: 'present' | 'absent') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllPresent = () => {
    const newRecords: { [key: string]: 'present' | 'absent' } = {};
    students.forEach(student => {
      newRecords[student.id] = 'present';
    });
    setAttendanceRecords(newRecords);
  };

  const presentCount = Object.values(attendanceRecords).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceRecords).filter(s => s === 'absent').length;
  const totalMarked = presentCount + absentCount;

  // Filter attendance history by date range
  const filteredHistory = attendanceHistory.filter(record => {
    const recordDate = new Date(record.date).toISOString().split('T')[0];
    return recordDate >= historyStartDate && recordDate <= historyEndDate;
  });

  // Group history by date
  const historyByDate = filteredHistory.reduce((acc, record) => {
    const dateKey = new Date(record.date).toLocaleDateString('en-GB');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Attendance Management
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Mark attendance and view history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            SMS Count: {smsCount} SMS
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="mark" className="w-full">
        <TabsList className={isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}>
          <TabsTrigger value="mark" data-testid="tab-mark-attendance">
            <CalendarDays className="w-4 h-4 mr-2" />
            Mark Attendance
          </TabsTrigger>
          <TabsTrigger value="sheet" data-testid="tab-monthly-sheet">
            <Calendar className="w-4 h-4 mr-2" />
            Monthly Sheet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="space-y-6">
          {/* Filters */}
          <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                <CalendarDays className="w-5 h-5 inline mr-2" />
                Select Batch & Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="batch-select" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    Batch
                  </Label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger 
                      id="batch-select"
                      className={isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}
                      data-testid="select-batch"
                    >
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map(batch => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name} ({batch.batchCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date-select" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    Date
                  </Label>
                  <input
                    id="date-select"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                    data-testid="input-date"
                  />
                </div>
              </div>

              {selectedBatch && students.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Present: {presentCount}
                  </Badge>
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    <XCircle className="w-3 h-3 mr-1" />
                    Absent: {absentCount}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance List */}
          {selectedBatch && students.length > 0 ? (
            <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
                <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  <Users className="w-5 h-5 inline mr-2" />
                  Students ({students.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllPresent}
                  data-testid="button-mark-all-present"
                >
                  Mark All Present
                </Button>
              </CardHeader>
              <CardContent>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className={isDarkMode ? 'border-slate-700' : 'border-gray-200'}>
                        <TableHead className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Student</TableHead>
                        <TableHead className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Student ID</TableHead>
                        <TableHead className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Phone</TableHead>
                        <TableHead className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Status</TableHead>
                        <TableHead className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Mark Attendance
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow 
                          key={student.id}
                          className={isDarkMode ? 'border-slate-700' : 'border-gray-200'}
                        >
                          <TableCell className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {student.studentId || '-'}
                          </TableCell>
                          <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {student.phoneNumber}
                          </TableCell>
                          <TableCell>
                            {attendanceRecords[student.id] === 'present' && (
                              <Badge className="bg-green-500 text-white">Present</Badge>
                            )}
                            {attendanceRecords[student.id] === 'absent' && (
                              <Badge className="bg-red-500 text-white">Absent</Badge>
                            )}
                            {!attendanceRecords[student.id] && (
                              <Badge variant="outline" className="text-gray-500">Not Marked</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant={attendanceRecords[student.id] === 'present' ? 'default' : 'outline'}
                                onClick={() => toggleAttendance(student.id, 'present')}
                                data-testid={`button-present-${student.id}`}
                              >
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant={attendanceRecords[student.id] === 'absent' ? 'destructive' : 'outline'}
                                onClick={() => toggleAttendance(student.id, 'absent')}
                                data-testid={`button-absent-${student.id}`}
                              >
                                Absent
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {students.map((student) => (
                    <Card 
                      key={student.id}
                      className={isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50'}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {student.firstName} {student.lastName}
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              ID: {student.studentId || '-'} • {student.phoneNumber}
                            </p>
                          </div>
                          {attendanceRecords[student.id] === 'present' && (
                            <Badge className="bg-green-500 text-white">Present</Badge>
                          )}
                          {attendanceRecords[student.id] === 'absent' && (
                            <Badge className="bg-red-500 text-white">Absent</Badge>
                          )}
                          {!attendanceRecords[student.id] && (
                            <Badge variant="outline" className="text-gray-500">Not Marked</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            variant={attendanceRecords[student.id] === 'present' ? 'default' : 'outline'}
                            onClick={() => toggleAttendance(student.id, 'present')}
                            data-testid={`button-present-${student.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            className="flex-1"
                            variant={attendanceRecords[student.id] === 'absent' ? 'destructive' : 'outline'}
                            onClick={() => toggleAttendance(student.id, 'absent')}
                            data-testid={`button-absent-${student.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 space-y-4">
                  {totalMarked > 0 && (
                    <>
                      <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-slate-700/50 rounded-lg border border-blue-200 dark:border-slate-600">
                        <Checkbox
                          id="send-sms"
                          checked={sendSMS}
                          onCheckedChange={(checked) => setSendSMS(checked as boolean)}
                          data-testid="checkbox-send-sms"
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor="send-sms" 
                            className={`font-medium cursor-pointer ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            Send SMS to parents ({presentCount} present, {absentCount} absent)
                          </Label>
                          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {requiredSmsCount} SMS will be sent. Available: {smsCount} SMS
                          </p>
                          {!hasSufficientBalance && sendSMS && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Insufficient SMS count! Available: {smsCount} SMS, Required: {requiredSmsCount} SMS
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => saveAttendanceMutation.mutate({ withSMS: false })}
                      disabled={saveAttendanceMutation.isPending || totalMarked === 0}
                      className="flex-1"
                      data-testid="button-save-attendance"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saveAttendanceMutation.isPending ? 'Saving...' : totalMarked === 0 ? 'Mark Attendance First' : 'Save Attendance'}
                    </Button>

                    {sendSMS && requiredSmsCount > 0 && (
                      <Button
                        onClick={() => saveAttendanceMutation.mutate({ withSMS: true })}
                        disabled={saveAttendanceMutation.isPending || !hasSufficientBalance}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        data-testid="button-save-send-sms"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {saveAttendanceMutation.isPending ? 'Saving & Sending...' : 'Save & Send SMS'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : selectedBatch ? (
            <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
              <CardContent className="text-center py-12">
                <Users className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  No students found in this batch
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
              <CardContent className="text-center py-12">
                <CalendarDays className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Please select a batch to mark attendance
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sheet" className="space-y-6">
          {/* Month & Batch Selection */}
          <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                <Calendar className="w-5 h-5 inline mr-2" />
                Select Batch & Month
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sheet-batch" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    Batch
                  </Label>
                  <Select value={sheetBatch} onValueChange={setSheetBatch}>
                    <SelectTrigger 
                      id="sheet-batch"
                      className={isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}
                      data-testid="select-sheet-batch"
                    >
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map(batch => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name} ({batch.batchCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sheet-month" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    Month
                  </Label>
                  <Select value={sheetMonth.toString()} onValueChange={(value) => setSheetMonth(parseInt(value))}>
                    <SelectTrigger 
                      id="sheet-month"
                      className={isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}
                      data-testid="select-sheet-month"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sheet-year" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    Year
                  </Label>
                  <Select value={sheetYear.toString()} onValueChange={(value) => setSheetYear(parseInt(value))}>
                    <SelectTrigger 
                      id="sheet-year"
                      className={isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'}
                      data-testid="select-sheet-year"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Attendance Sheet */}
          {sheetBatch && (() => {
            const sheetStudents = allStudents.filter(s => s.batchId === sheetBatch);
            const daysInMonth = new Date(sheetYear, sheetMonth + 1, 0).getDate();
            const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

            // Build attendance map: studentId -> { date -> status }
            const attendanceMap: Record<string, Record<number, 'present' | 'absent'>> = {};
            monthlyAttendance.forEach(record => {
              const recordDate = new Date(record.date);
              if (recordDate.getMonth() === sheetMonth && recordDate.getFullYear() === sheetYear) {
                if (!attendanceMap[record.studentId]) {
                  attendanceMap[record.studentId] = {};
                }
                attendanceMap[record.studentId][recordDate.getDate()] = record.attendanceStatus;
              }
            });

            return sheetStudents.length > 0 ? (
              <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    Monthly Attendance Sheet - {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][sheetMonth]} {sheetYear}
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className={isDarkMode ? 'border-slate-700' : 'border-gray-200'}>
                        <TableHead className={`sticky left-0 z-10 ${isDarkMode ? 'bg-slate-800 text-gray-300' : 'bg-white text-gray-700'}`}>
                          Student Name
                        </TableHead>
                        {dates.map(date => (
                          <TableHead key={date} className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {date}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheetStudents.map(student => (
                        <TableRow key={student.id} className={isDarkMode ? 'border-slate-700' : 'border-gray-200'}>
                          <TableCell className={`sticky left-0 z-10 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'} font-medium`}>
                            {student.firstName} {student.lastName}
                          </TableCell>
                          {dates.map(date => {
                            const status = attendanceMap[student.id]?.[date];
                            return (
                              <TableCell key={date} className="text-center">
                                {status === 'present' ? (
                                  <span className="text-green-600 font-bold">P</span>
                                ) : status === 'absent' ? (
                                  <span className="text-red-600 font-bold">A</span>
                                ) : (
                                  <span className={isDarkMode ? 'text-gray-600' : 'text-gray-400'}>-</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
                <CardContent className="text-center py-12">
                  <Users className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    No students found in this batch
                  </p>
                </CardContent>
              </Card>
            );
          })()}

          {!sheetBatch && (
            <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
              <CardContent className="text-center py-12">
                <Calendar className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  Please select a batch to view monthly attendance sheet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
