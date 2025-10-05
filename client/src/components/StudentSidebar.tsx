import {
  BookOpen,
  Trophy,
  ClipboardCheck,
  Calendar,
  LayoutDashboard,
  FlaskConical,
  GraduationCap,
  Bot
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    id: "dashboard"
  },
  {
    title: "অনলাইন পরীক্ষা",
    icon: BookOpen,
    id: "online-exam"
  },
  {
    title: "Results",
    icon: Trophy,
    id: "results"
  },
  {
    title: "Monthly Exams",
    icon: GraduationCap,
    id: "monthlyExams"
  },
  {
    title: "Praggo AI",
    icon: Bot,
    id: "ai-solver"
  }
];

interface StudentSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function StudentSidebar({ activeSection, onSectionChange }: StudentSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Student Panel</h2>
            <p className="text-xs text-muted-foreground">My Learning Portal</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>My Activities</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    data-testid={`sidebar-${item.id}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          Student Nursing Center
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
