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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { BookOpen, Plus, Pencil, Trash2, Users, Clock, Calendar } from 'lucide-react';

const batchSchema = z.object({
  name: z.string().min(1, 'Batch name is required'),
  subject: z.enum(['math', 'higher_math', 'science'], {
    required_error: 'Please select a subject',
  }),
  classLevel: z.string().min(1, 'Class level is required'),
});

type BatchFormData = z.infer<typeof batchSchema>;

interface Batch {
  id: string;
  name: string;
  subject: string;
  batchCode: string;
  classLevel?: string;
  maxStudents?: number;
  currentStudents?: number;
  classTime?: string;
  classDays?: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

const subjectLabels: Record<string, string> = {
  math: 'Mathematics',
  higher_math: 'Higher Mathematics',
  science: 'General Science',
};

export default function BatchManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const { data: batches = [], isLoading } = useQuery<Batch[]>({
    queryKey: ['/api/batches'],
  });

  const addForm = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      name: '',
      subject: undefined,
      classLevel: '',
    },
  });

  const editForm = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: BatchFormData) => {
      const batchCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const password = Math.random().toString(36).substring(2, 10);
      
      const payload = {
        name: data.name,
        subject: data.subject,
        classLevel: data.classLevel,
        batchCode: batchCode,
        password: password,
        maxStudents: 50,
        status: 'active',
      };
      
      const response = await apiRequest('POST', '/api/batches', payload);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setIsAddDialogOpen(false);
      toast({
        title: 'Batch created successfully',
        description: `${data.name} has been created.`,
      });
      addForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating batch',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BatchFormData> }) => {
      const response = await apiRequest('PUT', `/api/batches/${id}`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      setIsEditDialogOpen(false);
      setSelectedBatch(null);
      toast({
        title: 'Batch updated',
        description: `${data.name} has been updated.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating batch',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/batches/${id}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setIsDeleteDialogOpen(false);
      setSelectedBatch(null);
      toast({
        title: 'Batch deleted',
        description: 'The batch has been removed from the system.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting batch',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAdd = (data: BatchFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    editForm.reset({
      name: batch.name,
      subject: batch.subject as any,
      classLevel: batch.classLevel || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (data: BatchFormData) => {
    if (selectedBatch) {
      updateMutation.mutate({ id: selectedBatch.id, data });
    }
  };

  const handleDelete = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedBatch) {
      deleteMutation.mutate(selectedBatch.id);
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">All Batches ({batches.length})</h3>
        <Button
          onClick={() => {
            addForm.reset();
            setIsAddDialogOpen(true);
          }}
          data-testid="button-add-batch"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Batch
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batches...</p>
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">No batches created yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch) => (
            <Card key={batch.id} className="hover:shadow-lg transition-shadow" data-testid={`card-batch-${batch.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {batch.name}
                      <Badge variant={batch.status === 'active' ? 'default' : 'secondary'}>
                        {batch.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {subjectLabels[batch.subject] || batch.subject}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold">Code:</span>
                    <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{batch.batchCode}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold">Students:</span>
                    <span>{batch.currentStudents || 0} / {batch.maxStudents || 50}</span>
                  </div>
                  
                  {batch.classTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold">Time:</span>
                      <span>{batch.classTime}</span>
                    </div>
                  )}
                  
                  {batch.classDays && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold">Days:</span>
                      <span>{batch.classDays}</span>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(batch)}
                      className="flex-1"
                      data-testid={`button-edit-batch-${batch.id}`}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(batch)}
                      className="flex-1"
                      data-testid={`button-delete-batch-${batch.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1 text-red-600" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Batch Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
            <DialogDescription>
              Create a new batch for organizing students
            </DialogDescription>
          </DialogHeader>

          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Morning Math Batch" data-testid="input-batch-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-subject">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="math">Mathematics</SelectItem>
                        <SelectItem value="higher_math">Higher Mathematics</SelectItem>
                        <SelectItem value="science">General Science</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="classLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Level *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 9, 10, 11, 12" data-testid="input-class-level" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-batch">
                  {createMutation.isPending ? 'Creating...' : 'Create Batch'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Batch Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>
              Update batch information
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="math">Mathematics</SelectItem>
                        <SelectItem value="higher_math">Higher Mathematics</SelectItem>
                        <SelectItem value="science">General Science</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="classLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Level *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 9, 10, 11, 12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Updating...' : 'Update Batch'}
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
              This will permanently delete the batch "{selectedBatch?.name}". Students in this batch will be unassigned.
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
    </div>
  );
}
