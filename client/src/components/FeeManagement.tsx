import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Save } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface StudentFee {
  studentId: string;
  studentName: string;
  [key: string]: any; // For monthly fee data
}

export default function FeeManagement() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [feeData, setFeeData] = useState<Record<string, Record<string, number>>>({});

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches'],
  });

  const { data: allStudents = [], isLoading: studentsLoading } = useQuery<any[]>({
    queryKey: ['/api/students'],
  });

  const { data: fees = [], isLoading: feesLoading } = useQuery<any[]>({
    queryKey: [`/api/fees/batch/${selectedBatchId}/${selectedYear}`],
    enabled: !!selectedBatchId,
  });

  const saveFeeMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/fees', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/fees/batch/${selectedBatchId}/${selectedYear}`] });
      toast({
        title: "Success",
        description: "Fee saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save fee",
        variant: "destructive",
      });
    },
  });

  // Filter students by selected batch
  const batchStudents = selectedBatchId 
    ? allStudents.filter(s => s.batchId === selectedBatchId)
    : [];

  // Build fee lookup map
  const feeMap = new Map<string, number>();
  fees.forEach((fee: any) => {
    const key = `${fee.studentId}-${fee.month}`;
    feeMap.set(key, parseFloat(fee.amount) || 0);
  });

  const handleFeeChange = (studentId: string, month: string, value: string) => {
    const amount = parseFloat(value) || 0;
    setFeeData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [month]: amount
      }
    }));
  };

  const handleSaveFee = async (studentId: string, month: string) => {
    const amount = feeData[studentId]?.[month];
    if (amount === undefined) return;

    await saveFeeMutation.mutateAsync({
      studentId,
      batchId: selectedBatchId,
      amount: amount.toString(),
      month,
      year: selectedYear,
      status: 'pending',
      paidAmount: '0',
    });

    // Clear local state after save
    setFeeData(prev => {
      const newData = { ...prev };
      if (newData[studentId]) {
        delete newData[studentId][month];
      }
      return newData;
    });
  };

  const downloadCSV = () => {
    if (!selectedBatchId) return;

    const selectedBatch = batches.find(b => b.id === selectedBatchId);
    const batchName = selectedBatch?.name || 'Unknown';

    // Create CSV header
    let csv = `Student Name,${months.join(',')},Total\n`;

    // Add rows
    batchStudents.forEach(student => {
      const row: string[] = [student.firstName + ' ' + student.lastName];
      let total = 0;

      months.forEach(month => {
        const key = `${student.id}-${month}`;
        const amount = feeMap.get(key) || 0;
        row.push(amount.toString());
        total += amount;
      });

      row.push(total.toString());
      csv += row.join(',') + '\n';
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batchName}_Fees_${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fee Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Batch</label>
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger data-testid="select-batch">
                  <SelectValue placeholder="Select a batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                <SelectTrigger data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={downloadCSV}
                disabled={!selectedBatchId || batchStudents.length === 0}
                data-testid="button-download-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </div>

          {!selectedBatchId ? (
            <div className="text-center py-12 text-gray-500">
              Please select a batch to view fee records
            </div>
          ) : studentsLoading || feesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : batchStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No students found in this batch
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Student Name</TableHead>
                    {months.map(month => (
                      <TableHead key={month} className="text-center min-w-[120px]">
                        {month.substring(0, 3)}
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchStudents.map(student => {
                    const studentName = `${student.firstName} ${student.lastName}`;
                    let yearTotal = 0;

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="sticky left-0 bg-background z-10 font-medium">
                          {studentName}
                        </TableCell>
                        {months.map(month => {
                          const key = `${student.id}-${month}`;
                          const savedAmount = feeMap.get(key) || 0;
                          const editingAmount = feeData[student.id]?.[month];
                          const displayAmount = editingAmount !== undefined ? editingAmount : savedAmount;
                          yearTotal += savedAmount;

                          return (
                            <TableCell key={month} className="p-2">
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={displayAmount || ''}
                                  onChange={(e) => handleFeeChange(student.id, month, e.target.value)}
                                  onBlur={() => {
                                    if (editingAmount !== undefined && editingAmount !== savedAmount) {
                                      handleSaveFee(student.id, month);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveFee(student.id, month);
                                    }
                                  }}
                                  className="w-full text-right"
                                  placeholder="0"
                                  data-testid={`input-fee-${student.id}-${month}`}
                                />
                              </div>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-bold">
                          <Badge className="bg-blue-600">{yearTotal.toFixed(2)}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
