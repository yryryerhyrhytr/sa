import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Users, Plus, Pencil, Trash2, Search, Key } from 'lucide-react';

const addStudentSchema = z.object({
  firstName: z.string().min(1, 'Student name is required'),
  lastName: z.string().optional(),
  parentName: z.string().min(1, 'Parent name is required'),
  phoneNumber: z.string().min(11, 'Phone number must be at least 11 digits'),
  batchId: z.string().optional(),
  studentId: z.string().optional(),
  classLevel: z.string().optional(),
  institution: z.string().optional(),
  address: z.string().optional(),
});

const editStudentSchema = z.object({
  firstName: z.string().min(1, 'Student name is required'),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  batchId: z.string().optional(),
});

type AddStudentFormData = z.infer<typeof addStudentSchema>;
type EditStudentFormData = z.infer<typeof editStudentSchema>;

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  studentPassword?: string;
  studentId?: string;
  batchId?: string;
  classLevel?: string;
  institution?: string;
  batch?: { id: string; name: string; };
}

export default function StudentManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ['/api/batches'],
  });

  const addForm = useForm<AddStudentFormData>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      parentName: '',
      phoneNumber: '',
      batchId: '',
      studentId: '',
      classLevel: '',
      institution: '',
      address: '',
    },
  });

  const editForm = useForm<EditStudentFormData>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      batchId: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AddStudentFormData) => {
      const response = await apiRequest('POST', '/api/students', data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setGeneratedPassword(data.generatedPassword || null);
      toast({
        title: 'Student added successfully',
        description: `${data.firstName} ${data.lastName} has been enrolled.`,
      });
      addForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error adding student',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EditStudentFormData> }) => {
      const response = await apiRequest('PUT', `/api/students/${id}`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      toast({
        title: 'Student updated',
        description: `${data.firstName} ${data.lastName}'s information has been updated.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating student',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/students/${id}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      toast({
        title: 'Student removed',
        description: 'The student has been removed from the system.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting student',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/students/${id}/reset-password`, {});
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setSelectedStudent(prev => prev ? { ...prev, studentPassword: data.newPassword } : null);
      toast({
        title: 'Password reset successful',
        description: `New password: ${data.newPassword}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error resetting password',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAdd = (data: AddStudentFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    editForm.reset({
      firstName: student.firstName,
      lastName: student.lastName || '',
      phoneNumber: student.phoneNumber || '',
      batchId: student.batchId || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (data: EditStudentFormData) => {
    if (selectedStudent) {
      updateMutation.mutate({ id: selectedStudent.id, data });
    }
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedStudent) {
      deleteMutation.mutate(selectedStudent.id);
    }
  };

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName.toLowerCase().includes(searchLower) ||
      student.phoneNumber.includes(searchTerm) ||
      (student.studentId && student.studentId.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-students"
          />
        </div>
        <Button
          onClick={() => {
            addForm.reset();
            setGeneratedPassword(null);
            setIsAddDialogOpen(true);
          }}
          data-testid="button-add-student"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No students found matching your search' : 'No students added yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                  <TableCell>{student.studentId || 'N/A'}</TableCell>
                  <TableCell className="font-medium">
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{student.phoneNumber}</TableCell>
                  <TableCell>{student.batch?.name || 'No batch'}</TableCell>
                  <TableCell>{student.classLevel || 'N/A'}</TableCell>
                  <TableCell>{student.institution || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student);
                          setIsCredentialsDialogOpen(true);
                        }}
                        data-testid={`button-credentials-${student.id}`}
                        title="View Credentials"
                      >
                        <Key className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(student)}
                        data-testid={`button-edit-${student.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(student)}
                        data-testid={`button-delete-${student.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Enter the student's information. A password will be generated automatically.
            </DialogDescription>
          </DialogHeader>

          {generatedPassword ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">Student Added Successfully!</h3>
                </div>
                <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                  Please save these credentials and share them with the student:
                </p>
                <div className="bg-white dark:bg-gray-800 rounded p-3 space-y-2">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Phone Number:</span>
                    <p className="font-mono font-semibold" data-testid="text-generated-phone">{addForm.getValues('phoneNumber')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Generated Password:</span>
                    <p className="font-mono font-bold text-lg text-blue-600" data-testid="text-generated-password">{generatedPassword}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  setGeneratedPassword(null);
                  setIsAddDialogOpen(false);
                  addForm.reset();
                }}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-firstname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={addForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="01XXXXXXXXX" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="parentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent / Guardian Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter parent or guardian name" data-testid="input-parent-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Auto-generated if empty" data-testid="input-student-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="batchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-batch">
                              <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {batches.map((batch) => (
                              <SelectItem key={batch.id} value={batch.id}>
                                {batch.name} ({batch.subject})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="classLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Level</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Class 8, Class 10" data-testid="input-class-level" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="institution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="School/College name" data-testid="input-institution" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={addForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-student">
                    {createMutation.isPending ? 'Adding...' : 'Add Student'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="batchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.name} ({batch.subject})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Updating...' : 'Update Student'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {selectedStudent?.firstName} {selectedStudent?.lastName} from the system.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Credentials Dialog */}
      <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student Login Credentials</DialogTitle>
            <DialogDescription>
              Share these credentials with {selectedStudent?.firstName} {selectedStudent?.lastName} to access the student portal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Student Name:</span>
                  <p className="font-semibold" data-testid="text-cred-name">
                    {selectedStudent?.firstName} {selectedStudent?.lastName}
                  </p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Phone Number:</span>
                  <p className="font-mono font-bold text-lg" data-testid="text-cred-phone">
                    {selectedStudent?.phoneNumber}
                  </p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Password:</span>
                  <p className="font-mono font-bold text-xl text-blue-600 dark:text-blue-400" data-testid="text-cred-password">
                    {selectedStudent?.studentPassword || 'Not available'}
                  </p>
                </div>

                {selectedStudent?.batch && (
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Batch:</span>
                    <p className="font-semibold" data-testid="text-cred-batch">
                      {selectedStudent.batch.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tip: Student can login at the student portal using their phone number and password.
            </p>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedStudent?.id) {
                  resetPasswordMutation.mutate(selectedStudent.id);
                }
              }}
              disabled={resetPasswordMutation.isPending}
              data-testid="button-reset-password"
            >
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Button onClick={() => setIsCredentialsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
