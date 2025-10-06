import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import StaticLanding from "@/pages/StaticLanding";
import LoginPage from "@/pages/LoginPage";
import TeacherDashboard from "@/pages/TeacherDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import SuperUserDashboard from "@/pages/SuperUserDashboard";

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <Switch>
      {/* Public routes - always accessible */}
      <Route path="/login" component={LoginPage} />

      {/* Protected routes */}
      <Route path="/">
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        ) : isAuthenticated ? (
          (user as any)?.role === 'teacher' ? (
            <TeacherDashboard />
          ) : (user as any)?.role === 'super_user' ? (
            <SuperUserDashboard />
          ) : (
            <StudentDashboard />
          )
        ) : (
          <StaticLanding />
        )}
      </Route>

      {isAuthenticated && (user as any)?.role === 'teacher' && (
        <>
          <Route path="/teacher" component={TeacherDashboard} />
          <Route path="/teacher-dashboard" component={TeacherDashboard} />
        </>
      )}

      {isAuthenticated && (user as any)?.role === 'super_user' && (
        <>
          <Route path="/super" component={SuperUserDashboard} />
          <Route path="/super-dashboard" component={SuperUserDashboard} />
        </>
      )}

      {/* Fallback route */}
      <Route>
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        ) : isAuthenticated ? (
          (user as any)?.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />
        ) : (
          <StaticLanding />
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
