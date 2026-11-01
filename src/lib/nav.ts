import {
  Bell,
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  Headset,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  Target,
  Ticket,
  UserCircle,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./sample-data";

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

export const roleLabels: Record<Role, string> = {
  employee: "Employee",
  management: "Management",
  admin: "Admin / HR",
};

export const navByRole: Record<Role, NavGroup[]> = {
  employee: [
    { label: "Overview", items: [{ href: "/employee", label: "Dashboard", icon: LayoutDashboard }] },
    {
      label: "My work",
      items: [
        { href: "/employee/attendance", label: "Attendance", icon: CalendarCheck },
        { href: "/employee/leave", label: "Leave", icon: CalendarDays },
        { href: "/employee/tasks", label: "Tasks", icon: ClipboardList },
        { href: "/employee/goals", label: "Goals & Performance", icon: Target },
      ],
    },
    {
      label: "My records",
      items: [
        { href: "/employee/profile", label: "My Profile", icon: UserCircle },
        { href: "/employee/payroll", label: "Payroll", icon: Wallet },
        { href: "/employee/policies", label: "Company Policies", icon: FileText },
      ],
    },
    {
      label: "Support",
      items: [
        { href: "/employee/notifications", label: "Notifications", icon: Bell },
        { href: "/employee/helpdesk", label: "HR Helpdesk", icon: Headset },
        { href: "/employee/tickets", label: "Complaint Tickets", icon: Ticket },
        { href: "/employee/department-inbox", label: "Department Inbox", icon: Inbox },
      ],
    },
  ],
  management: [
    { label: "Overview", items: [{ href: "/management", label: "Dashboard", icon: LayoutDashboard }] },
    {
      label: "People",
      items: [
        { href: "/management/employees", label: "Employee Overview", icon: Users },
        { href: "/management/departments", label: "Department Overview", icon: Building2 },
        { href: "/management/attendance", label: "Attendance Monitoring", icon: CalendarCheck },
        { href: "/management/leave", label: "Leave Requests", icon: CalendarDays },
        { href: "/management/performance", label: "Performance & Goals", icon: Target },
      ],
    },
    {
      label: "Communication",
      items: [
        { href: "/management/tickets", label: "Ticket Review", icon: Ticket },
        { href: "/management/announcements", label: "Announcements", icon: Megaphone },
        { href: "/management/reports", label: "Reports", icon: BarChart3 },
      ],
    },
    { label: "Me", items: [{ href: "/employee", label: "My Workspace", icon: UserCircle }] },
  ],
  admin: [
    { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
    {
      label: "People",
      items: [
        { href: "/admin/employees", label: "Employee Records", icon: Users },
        { href: "/admin/employees/new", label: "Register Employee", icon: UserPlus },
        { href: "/admin/departments", label: "Departments", icon: Building2 },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
        { href: "/admin/leave", label: "Leave Management", icon: CalendarDays },
        { href: "/admin/payroll", label: "Payroll", icon: Wallet },
        { href: "/admin/performance", label: "Goals & Performance", icon: Target },
        { href: "/admin/tasks", label: "Tasks", icon: ClipboardList },
      ],
    },
    {
      label: "Communication",
      items: [
        { href: "/admin/policies", label: "Policies", icon: FileText },
        { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
        { href: "/admin/helpdesk", label: "Helpdesk", icon: Headset },
        { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
      ],
    },
    {
      label: "System",
      items: [
        { href: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck },
        { href: "/admin/settings", label: "System Settings", icon: Settings },
      ],
    },
    { label: "Me", items: [{ href: "/employee", label: "My Workspace", icon: UserCircle }] },
  ],
};
