import {
  Users,
  GraduationCap,
  FileText,
  ClipboardCheck,
  DollarSign,
  MessageSquare,
  LayoutDashboard,
  Sparkles,
  Bot,
  Monitor
} from "lucide-react";

export const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    id: "dashboard" as const
  },
  {
    title: "Students",
    icon: Users,
    id: "students" as const
  },
  {
    title: "Batches",
    icon: GraduationCap,
    id: "batches" as const
  },
  {
    title: "Monthly Exams",
    icon: FileText,
    id: "monthly-exams" as const
  },
  {
    title: "Online Exam",
    icon: Monitor,
    id: "online-exam" as const
  },
  {
    title: "Attendance",
    icon: ClipboardCheck,
    id: "attendance" as const
  },
  {
    title: "Fees",
    icon: DollarSign,
    id: "fees" as const
  },
  {
    title: "SMS",
    icon: MessageSquare,
    id: "sms" as const
  },
  {
    title: "AI Question Builder",
    icon: Sparkles,
    id: "ai-question-builder" as const
  }
];

export const studentMenuItems = [
  {
    title: "AI Solver",
    icon: Bot,
    id: "ai-solver" as const
  }
];

export type SectionId = typeof menuItems[number]['id'] | typeof studentMenuItems[number]['id'];

export function getSectionDisplay(sectionId: string) {
  const item = menuItems.find(item => item.id === sectionId) || studentMenuItems.find(item => item.id === sectionId);
  if (item) {
    return { icon: item.icon, label: item.title };
  }
  return { icon: LayoutDashboard, label: 'Menu' };
}
