import type { LucideIcon } from "lucide-react";
import {
  Users,
  CalendarClock,
  FileText,
  Settings,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const mainNav: NavItem[] = [
  { title: "Employees", href: "/employees", icon: Users },
  { title: "Attendance", href: "/attendance", icon: CalendarClock },
  { title: "Payslips", href: "/payslips", icon: FileText },
  { title: "Settings", href: "/settings", icon: Settings },
];