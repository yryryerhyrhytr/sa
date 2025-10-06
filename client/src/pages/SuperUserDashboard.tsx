import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Shield, Users, MessageSquare, Key } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  isActive: boolean;
}

interface Settings {
  smsCount?: number;
  smsApiKey?: string;
  smsSenderId?: string;
  smsApiUrl?: string;
}

export default function SuperUserDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [smsCount, setSmsCount] = useState('');
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsApiUrl, setSmsApiUrl] = useState('');
  const [smsSenderId, setSmsSenderId] = useState('');

  // Fetch teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/super/teachers'],
  });

  // Fetch settings
  const { data: settings, isLoading: settingsLoading } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  // Reset teacher password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ teacherId, password }: { teacherId: string; password: string }) => {
      return apiRequest(`/api/super/teacher/${teacherId}/password`, 'PUT', { newPassword: password });
    },
    onSuccess: () => {
      toast({
        title: 'Password Reset Successful',
        description: 'Teacher password has been updated successfully.',
      });
      setSelectedTeacherId('');
      setNewPassword('');
    },
    onError: (error: any) => {
      toast({
        title: 'Password Reset Failed',
        description: error.message || 'Failed to reset teacher password',
        variant: 'destructive',
      });
    },
  });

  // Update SMS count mutation
  const updateSmsCountMutation = useMutation({
    mutationFn: async (count: number) => {
      return apiRequest('/api/super/sms-count', 'PUT', { smsCount: count });
    },
    onSuccess: () => {
      toast({
        title: 'SMS Count Updated',
        description: 'SMS count has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      setSmsCount('');
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update SMS count',
        variant: 'destructive',
      });
    },
  });

  // Update SMS settings mutation
  const updateSmsSettingsMutation = useMutation({
    mutationFn: async (data: { smsApiKey?: string; smsApiUrl?: string; smsSenderId?: string }) => {
      return apiRequest('/api/settings', 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: 'SMS Settings Updated',
        description: 'SMS API settings have been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      setSmsApiKey('');
      setSmsApiUrl('');
      setSmsSenderId('');
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update SMS settings',
        variant: 'destructive',
      });
    },
  });

  const handleResetPassword = () => {
    if (!selectedTeacherId || !newPassword) {
      toast({
        title: 'Validation Error',
        description: 'Please select a teacher and enter a new password',
        variant: 'destructive',
      });
      return;
    }
    resetPasswordMutation.mutate({ teacherId: selectedTeacherId, password: newPassword });
  };

  const handleUpdateSmsCount = () => {
    const count = parseInt(smsCount);
    if (isNaN(count) || count < 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid SMS count',
        variant: 'destructive',
      });
      return;
    }
    updateSmsCountMutation.mutate(count);
  };

  const handleUpdateSmsSettings = () => {
    if (!smsApiKey && !smsApiUrl && !smsSenderId) {
      toast({
        title: 'Validation Error',
        description: 'Please enter at least one SMS setting to update',
        variant: 'destructive',
      });
      return;
    }

    const updates: any = {};
    if (smsApiKey) updates.smsApiKey = smsApiKey;
    if (smsApiUrl) updates.smsApiUrl = smsApiUrl;
    if (smsSenderId) updates.smsSenderId = smsSenderId;

    updateSmsSettingsMutation.mutate(updates);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation('/login');
  };

  if (teachersLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} border-b sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Super User Dashboard
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  System Administration
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.length}</div>
            </CardContent>
          </Card>

          <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SMS Count</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings?.smsCount || 0}</div>
              <p className="text-xs text-muted-foreground">Available SMS</p>
            </CardContent>
          </Card>

          <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
            </CardContent>
          </Card>
        </div>

        {/* SMS API Configuration */}
        <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white mb-8'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS API Configuration
            </CardTitle>
            <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
              Configure SMS API settings for the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="current-api-key">Current API Key</Label>
                <Input
                  id="current-api-key"
                  type="text"
                  value={settings?.smsApiKey ? '••••••••••••' + settings.smsApiKey.slice(-4) : 'Not configured'}
                  disabled
                  className={isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}
                />
              </div>
              <div>
                <Label htmlFor="current-sender-id">Current Sender ID</Label>
                <Input
                  id="current-sender-id"
                  type="text"
                  value={settings?.smsSenderId || '8809617628909'}
                  disabled
                  className={isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <Label htmlFor="new-api-key">New SMS API Key</Label>
                <Input
                  id="new-api-key"
                  type="text"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  placeholder="Enter SMS API key"
                  data-testid="input-sms-api-key"
                />
              </div>
              <div>
                <Label htmlFor="new-sender-id">New Sender ID</Label>
                <Input
                  id="new-sender-id"
                  type="text"
                  value={smsSenderId}
                  onChange={(e) => setSmsSenderId(e.target.value)}
                  placeholder="Enter sender ID (optional)"
                  data-testid="input-sms-sender-id"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="new-api-url">SMS API URL</Label>
              <Input
                id="new-api-url"
                type="text"
                value={smsApiUrl}
                onChange={(e) => setSmsApiUrl(e.target.value)}
                placeholder="http://bulksmsbd.net/api/smsapi (optional)"
                data-testid="input-sms-api-url"
              />
            </div>

            <Button
              onClick={handleUpdateSmsSettings}
              disabled={updateSmsSettingsMutation.isPending}
              className="w-full mt-4"
              data-testid="button-update-sms-settings"
            >
              {updateSmsSettingsMutation.isPending ? 'Updating...' : 'Update SMS API Settings'}
            </Button>
          </CardContent>
        </Card>

        {/* Teacher Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Reset Teacher Password */}
          <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Reset Teacher Password
              </CardTitle>
              <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                Reset password for any teacher account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="teacher-select">Select Teacher</Label>
                <select
                  id="teacher-select"
                  className={`w-full mt-1 px-3 py-2 rounded-md border ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  data-testid="select-teacher"
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map((teacher: any) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  data-testid="input-new-password"
                />
              </div>

              <Button
                onClick={handleResetPassword}
                disabled={resetPasswordMutation.isPending}
                className="w-full"
                data-testid="button-reset-password"
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </CardContent>
          </Card>

          {/* SMS Count Management */}
          <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                SMS Count Management
              </CardTitle>
              <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                Set SMS count for the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current-sms">Current SMS Count</Label>
                <Input
                  id="current-sms"
                  type="text"
                  value={settings?.smsCount || 0}
                  disabled
                  className={isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}
                />
              </div>

              <div>
                <Label htmlFor="new-sms-count">New SMS Count</Label>
                <Input
                  id="new-sms-count"
                  type="number"
                  value={smsCount}
                  onChange={(e) => setSmsCount(e.target.value)}
                  placeholder="Enter SMS count"
                  min="0"
                  data-testid="input-sms-count"
                />
              </div>

              <Button
                onClick={handleUpdateSmsCount}
                disabled={updateSmsCountMutation.isPending}
                className="w-full"
                data-testid="button-update-sms"
              >
                {updateSmsCountMutation.isPending ? 'Updating...' : 'Update SMS Count'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Teachers List */}
        <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teachers List
            </CardTitle>
            <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
              All registered teachers in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Phone</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher: any) => (
                    <tr
                      key={teacher.id}
                      className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}
                      data-testid={`teacher-row-${teacher.id}`}
                    >
                      <td className="py-3 px-4">
                        {teacher.firstName} {teacher.lastName}
                      </td>
                      <td className="py-3 px-4">{teacher.phoneNumber}</td>
                      <td className="py-3 px-4">{teacher.email || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            teacher.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {teacher.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
