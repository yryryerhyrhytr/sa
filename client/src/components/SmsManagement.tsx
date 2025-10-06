import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Plus, Edit, Trash2, Mail, Send } from 'lucide-react';
import type { SmsTemplate } from '@shared/schema';

interface NewTemplate {
  name: string;
  templateType: string;
  message: string;
}

interface TestSmsForm {
  phoneNumber: string;
  message: string;
}

// Language detection and validation utilities
const detectLanguage = (text: string): 'bangla' | 'english' | 'mixed' => {
  // Remove placeholder tokens like {studentName}, {batchName}, {date}, etc. before language detection
  const textWithoutPlaceholders = text.replace(/\{[^}]+\}/g, '');
  
  const banglaRegex = /[\u0980-\u09FF]/;
  const englishRegex = /[a-zA-Z]/;
  
  const hasBangla = banglaRegex.test(textWithoutPlaceholders);
  const hasEnglish = englishRegex.test(textWithoutPlaceholders);
  
  if (hasBangla && hasEnglish) return 'mixed';
  if (hasBangla) return 'bangla';
  if (hasEnglish) return 'english';
  return 'english'; // Default
};

const getCharacterLimit = (language: 'bangla' | 'english' | 'mixed'): number => {
  if (language === 'bangla') return 65;
  return 120; // English or mixed (enforce English limit for mixed)
};

const validateSmsMessage = (message: string): { valid: boolean; error?: string; language: string; limit: number; remaining: number } => {
  const language = detectLanguage(message);
  const limit = getCharacterLimit(language);
  const length = message.length;
  const remaining = limit - length;
  
  if (language === 'mixed') {
    return {
      valid: false,
      error: 'Message must be either fully English or fully Bangla',
      language,
      limit,
      remaining
    };
  }
  
  if (length > limit) {
    return {
      valid: false,
      error: `Message exceeds ${limit} character limit for ${language}`,
      language,
      limit,
      remaining
    };
  }
  
  return { valid: true, language, limit, remaining };
};

export default function SmsManagement() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<NewTemplate>({
    name: '',
    templateType: 'custom',
    message: ''
  });
  const [testSmsForm, setTestSmsForm] = useState<TestSmsForm>({
    phoneNumber: '01818291546',
    message: ''
  });

  const { data: templates = [], isLoading } = useQuery<SmsTemplate[]>({
    queryKey: ['/api/sms/templates']
  });

  const { data: settings } = useQuery<any>({
    queryKey: ['/api/settings']
  });

  const createMutation = useMutation({
    mutationFn: async (template: NewTemplate) => {
      const res = await apiRequest('POST', '/api/sms/templates', template);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms/templates'] });
      setIsCreateDialogOpen(false);
      setNewTemplate({ name: '', templateType: 'custom', message: '' });
      toast({
        title: 'Success',
        description: 'SMS template created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create template',
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewTemplate> }) => {
      const res = await apiRequest('PUT', `/api/sms/templates/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms/templates'] });
      setEditingTemplate(null);
      toast({
        title: 'Success',
        description: 'SMS template updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update template',
        variant: 'destructive'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/sms/templates/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms/templates'] });
      toast({
        title: 'Success',
        description: 'SMS template deleted successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete template',
        variant: 'destructive'
      });
    }
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.message) {
      toast({
        title: 'Error',
        description: 'Name and message are required',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate message
    const validation = validateSmsMessage(newTemplate.message);
    if (!validation.valid) {
      toast({
        title: 'Validation Error',
        description: validation.error,
        variant: 'destructive'
      });
      return;
    }
    
    createMutation.mutate(newTemplate);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;
    
    // Validate message
    const validation = validateSmsMessage(editingTemplate.message);
    if (!validation.valid) {
      toast({
        title: 'Validation Error',
        description: validation.error,
        variant: 'destructive'
      });
      return;
    }
    
    updateMutation.mutate({
      id: editingTemplate.id,
      data: {
        name: editingTemplate.name,
        templateType: editingTemplate.templateType,
        message: editingTemplate.message
      }
    });
  };

  const sendTestSmsMutation = useMutation({
    mutationFn: async (data: TestSmsForm) => {
      const res = await apiRequest('POST', '/api/sms/send-test', data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message || 'Test SMS sent successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sms/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test SMS',
        variant: 'destructive'
      });
    }
  });

  const handleSendTestSms = () => {
    if (!testSmsForm.phoneNumber || !testSmsForm.message) {
      toast({
        title: 'Error',
        description: 'Phone number and message are required',
        variant: 'destructive'
      });
      return;
    }
    sendTestSmsMutation.mutate(testSmsForm);
  };

  const handleUseTemplate = (template: SmsTemplate) => {
    setTestSmsForm({
      ...testSmsForm,
      message: template.message
    });
    toast({
      title: 'Template Applied',
      description: `Template "${template.name}" has been applied to the message field`
    });
  };

  const seedDefaultsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/sms/templates/seed-defaults', {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms/templates'] });
      toast({
        title: 'Success',
        description: 'Default SMS templates created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create default templates',
        variant: 'destructive'
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            SMS Management
          </h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage SMS templates and send messages to students
          </p>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className={isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <MessageSquare className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="send" data-testid="tab-send-sms">
            <Mail className="w-4 h-4 mr-2" />
            Send SMS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              SMS Templates
            </h3>
            <div className="flex gap-2">
              {templates.length === 0 && (
                <Button 
                  variant="outline"
                  onClick={() => seedDefaultsMutation.mutate()}
                  disabled={seedDefaultsMutation.isPending}
                  data-testid="button-seed-defaults"
                >
                  {seedDefaultsMutation.isPending ? 'Creating...' : 'Add Default Templates'}
                </Button>
              )}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-template">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className={isDarkMode ? 'bg-slate-800 text-white' : 'bg-white'}>
                <DialogHeader>
                  <DialogTitle>Create SMS Template</DialogTitle>
                  <DialogDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Create reusable SMS templates with placeholders like {'{studentName}'}, {'{marks}'}, {'{totalMarks}'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="e.g., Exam Result Notification"
                      data-testid="input-template-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Template Type</Label>
                    <Select
                      value={newTemplate.templateType}
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, templateType: value })}
                    >
                      <SelectTrigger id="type" data-testid="select-template-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exam_marks">Exam Marks</SelectItem>
                        <SelectItem value="monthly_result">Monthly Result</SelectItem>
                        <SelectItem value="attendance">Attendance</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="message">Message Template</Label>
                    <Textarea
                      id="message"
                      value={newTemplate.message}
                      onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                      placeholder="Dear {studentName}, your exam marks are {marks}/{totalMarks}."
                      rows={4}
                      data-testid="textarea-template-message"
                    />
                    {newTemplate.message && (() => {
                      const validation = validateSmsMessage(newTemplate.message);
                      const charClass = validation.remaining < 0 
                        ? 'text-red-500' 
                        : validation.remaining < 20 
                        ? 'text-yellow-500' 
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600';
                      
                      return (
                        <div className="mt-1 space-y-1">
                          <p className={`text-sm ${charClass}`}>
                            {validation.language === 'bangla' ? 'Bangla' : validation.language === 'english' ? 'English' : 'Mixed'}: {newTemplate.message.length}/{validation.limit} characters
                            {validation.remaining >= 0 ? ` (${validation.remaining} remaining)` : ` (${Math.abs(validation.remaining)} over limit)`}
                          </p>
                          {!validation.valid && (
                            <p className="text-sm text-red-500">{validation.error}</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <Button 
                    onClick={handleCreateTemplate} 
                    disabled={createMutation.isPending}
                    className="w-full"
                    data-testid="button-save-template"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Template'}
                  </Button>
                </div>
              </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
              <CardContent className="py-8 text-center">
                <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  No templates yet. Create your first SMS template.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={isDarkMode ? 'border-slate-700' : ''}>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Name</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Type</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Message Preview</TableHead>
                    <TableHead className={isDarkMode ? 'text-gray-300' : ''}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id} className={isDarkMode ? 'border-slate-700' : ''}>
                      <TableCell className={isDarkMode ? 'text-white' : ''}>{template.name}</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {template.templateType.replace('_', ' ').toUpperCase()}
                      </TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {template.message.substring(0, 60)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTemplate(template)}
                            data-testid={`button-edit-${template.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(template.id)}
                            data-testid={`button-delete-${template.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {editingTemplate && (
            <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
              <DialogContent className={isDarkMode ? 'bg-slate-800 text-white' : 'bg-white'}>
                <DialogHeader>
                  <DialogTitle>Edit SMS Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Template Name</Label>
                    <Input
                      id="edit-name"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                      data-testid="input-edit-template-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-type">Template Type</Label>
                    <Select
                      value={editingTemplate.templateType}
                      onValueChange={(value) => setEditingTemplate({ ...editingTemplate, templateType: value })}
                    >
                      <SelectTrigger id="edit-type" data-testid="select-edit-template-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exam_marks">Exam Marks</SelectItem>
                        <SelectItem value="monthly_result">Monthly Result</SelectItem>
                        <SelectItem value="attendance">Attendance</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-message">Message Template</Label>
                    <Textarea
                      id="edit-message"
                      value={editingTemplate.message}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, message: e.target.value })}
                      rows={4}
                      data-testid="textarea-edit-template-message"
                    />
                    {editingTemplate.message && (() => {
                      const validation = validateSmsMessage(editingTemplate.message);
                      const charClass = validation.remaining < 0 
                        ? 'text-red-500' 
                        : validation.remaining < 20 
                        ? 'text-yellow-500' 
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600';
                      
                      return (
                        <div className="mt-1 space-y-1">
                          <p className={`text-sm ${charClass}`}>
                            {validation.language === 'bangla' ? 'Bangla' : validation.language === 'english' ? 'English' : 'Mixed'}: {editingTemplate.message.length}/{validation.limit} characters
                            {validation.remaining >= 0 ? ` (${validation.remaining} remaining)` : ` (${Math.abs(validation.remaining)} over limit)`}
                          </p>
                          {!validation.valid && (
                            <p className="text-sm text-red-500">{validation.error}</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <Button 
                    onClick={handleUpdateTemplate} 
                    disabled={updateMutation.isPending}
                    className="w-full"
                    data-testid="button-update-template"
                  >
                    {updateMutation.isPending ? 'Updating...' : 'Update Template'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Send Test SMS</span>
                {settings && (
                  <span className={`text-sm font-normal ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    SMS Count: {settings.smsCount || 0} SMS
                  </span>
                )}
              </CardTitle>
              <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                Send a test SMS to verify your SMS configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-phone">Phone Number</Label>
                <Input
                  id="test-phone"
                  value={testSmsForm.phoneNumber}
                  onChange={(e) => setTestSmsForm({ ...testSmsForm, phoneNumber: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  data-testid="input-test-phone"
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  Enter the phone number in format: 01XXXXXXXXX
                </p>
              </div>
              <div>
                <Label htmlFor="test-message">Message</Label>
                <Textarea
                  id="test-message"
                  value={testSmsForm.message}
                  onChange={(e) => setTestSmsForm({ ...testSmsForm, message: e.target.value })}
                  placeholder="Type your test message here..."
                  rows={5}
                  data-testid="textarea-test-message"
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  {testSmsForm.message.length} characters
                </p>
              </div>

              {templates.length > 0 && (
                <div>
                  <Label>Quick Templates</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {templates.map((template) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        data-testid={`button-use-template-${template.id}`}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSendTestSms}
                disabled={sendTestSmsMutation.isPending}
                className="w-full"
                data-testid="button-send-test-sms"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendTestSmsMutation.isPending ? 'Sending...' : 'Send Test SMS'}
              </Button>

              {sendTestSmsMutation.isSuccess && (
                <div className={`p-4 rounded-md ${isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-800'}`}>
                  <p className="text-sm font-medium">SMS sent successfully!</p>
                  <p className="text-xs mt-1">Check the SMS Logs to view delivery status.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
