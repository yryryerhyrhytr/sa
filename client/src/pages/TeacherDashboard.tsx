import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogOut, Moon, Sun, GraduationCap, DollarSign, MessageSquare, Users, ClipboardCheck, FileText, LayoutDashboard, CheckCircle } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { getSectionDisplay, menuItems } from '@/constants/sections';
import StudentManagement from '@/components/StudentManagement';
import BatchManagement from '@/components/BatchManagement';
import MonthlyExamManagement from '@/components/MonthlyExamManagement';
import SmsManagement from '@/components/SmsManagement';
import AttendanceManagement from '@/components/AttendanceManagement';
import FeeManagement from '@/components/FeeManagement';
import QuestionBuilder from '@/components/QuestionBuilder';
import OnlineExamManager from '@/components/OnlineExamManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardStats {
  totalStudents: number;
  activeBatches: number;
  pendingFees: number;
  smsCount: number;
}

export default function TeacherDashboard() {
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [activeSection, setActiveSection] = useState('dashboard');

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold mb-6 md:mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Dashboard Overview
            </h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} data-testid="text-total-students">
                    {stats?.totalStudents || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Active learners</p>
                </CardContent>
              </Card>

              <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
                  <GraduationCap className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} data-testid="text-active-batches">
                    {stats?.activeBatches || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Running classes</p>
                </CardContent>
              </Card>

              <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} data-testid="text-pending-fees">
                    ৳{stats?.pendingFees?.toFixed(0) || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">To be collected</p>
                </CardContent>
              </Card>

              <Card className={isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">SMS Count</CardTitle>
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} data-testid="text-sms-count">
                    {stats?.smsCount || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Messages available</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      case 'students':
        return <StudentManagement />;
      
      case 'batches':
        return <BatchManagement />;
      
      case 'monthly-exams':
        return <MonthlyExamManagement />;
      
      case 'attendance':
        return <AttendanceManagement />;
      
      case 'fees':
        return <FeeManagement />;
      
      case 'sms':
        return <SmsManagement />;
      
      case 'ai-question-builder':
        return <QuestionBuilder />;
      
      case 'online-exam':
        return <OnlineExamManager />;
      
      default:
        return null;
    }
  };

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <TeacherSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <div className={`flex flex-col flex-1 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
          <header className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10`}>
            <div className="flex items-center justify-between p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="hidden sm:block">
                  <h2 className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Welcome, {user?.firstName}!
                  </h2>
                  <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Student Nursing Center
                  </p>
                </div>
              </div>

              {/* Quick Access Buttons - Desktop */}
              <div className="hidden lg:flex items-center gap-1 flex-wrap">
                {menuItems
                  .filter(item => ['dashboard', 'students', 'batches', 'attendance', 'monthly-exams', 'sms'].includes(item.id))
                  .map((item) => (
                    <Button
                      key={item.id}
                      variant={activeSection === item.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveSection(item.id)}
                      data-testid={`quick-nav-${item.id}`}
                      className="text-xs"
                    >
                      <item.icon className="w-3 h-3 mr-1" />
                      {item.id === 'attendance' ? 'Attend.' : item.id === 'monthly-exams' ? 'Exams' : item.title}
                    </Button>
                  ))
                }
              </div>

              {/* Quick Access Dropdown - Mobile/Tablet */}
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid={`button-quick-nav-${activeSection}`} className="text-xs">
                      {(() => {
                        const { icon: Icon, label } = getSectionDisplay(activeSection);
                        return <><Icon className="w-3 h-3 mr-1" />{label}</>;
                      })()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={isDarkMode ? 'bg-slate-800 border-slate-700' : ''}>
                    {menuItems.map((item) => (
                      <DropdownMenuItem 
                        key={item.id}
                        onClick={() => setActiveSection(item.id)} 
                        data-testid={`quick-nav-mobile-${item.id}`}
                        className={activeSection === item.id ? (isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100') : ''}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.title}
                        {activeSection === item.id && <CheckCircle className="w-3 h-3 ml-auto" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className={isDarkMode ? 'text-yellow-400 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'}
                  data-testid="button-toggle-theme"
                >
                  {isDarkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className={`${isDarkMode ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-red-50'} hidden md:flex`}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className={`${isDarkMode ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-red-50'} md:hidden`}
                  data-testid="button-logout-mobile"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-8">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
