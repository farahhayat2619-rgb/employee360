// Shapes passed from the server to client components. Keep these free of secrets (no password hashes, no tokens).
import type { Role } from "./sample-data";

export type StatusLabel = "Active" | "On leave" | "Inactive";

export type DirectoryEmployee = {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  office: string;
  joiningDate: string; // YYYY-MM-DD
  status: StatusLabel;
  role: Role;
  manager: string | null;
};

export type DepartmentSummary = {
  id: string;
  name: string;
  head: string | null;
  headcount: number;
  attendanceRate: number | null; // % of working days present or late, last full month
  openTickets: number;
};

export type EditableEmployee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string;
  managerId: string | null;
  joiningDate: string;
  officeId: string;
  type: "PERMANENT" | "CONTRACT";
  role: Role;
  salary: { basic: number; house: number; transport: number; medical: number } | null;
};

export type Option = { id: string; name: string };

export type ActionResult = { ok: boolean; message: string; tempPassword?: string } | undefined;

// ---- Attendance (Phase 3) ----
export type DayStatus = "Present" | "Late" | "Absent" | "On leave" | "Holiday" | "Weekend" | "Not punched in";

export type OfficeInfo = { name: string; workStart: string; workEnd: string; graceMin: number; radiusM: number };

/** Today's punch for the signed-in employee. Times are office-local "HH:MM". */
export type TodayPunch = {
  date: string;
  in: string | null;
  out: string | null;
  office: string | null;
  inDist: number | null;
  inAcc: number | null;
  outDist: number | null;
  minutes: number;
  late: boolean;
  early: boolean;
  onLeave: boolean;
  gpsVerified: boolean;
};

export type AttendanceDay = {
  date: string;
  in: string | null;
  out: string | null;
  hours: number;
  status: DayStatus;
  early: boolean;
  location: string | null;
  distance: number | null;
  gpsVerified: boolean;
  corrected: boolean;
  note: string | null;
};

export type MonthSummary = { month: string; workdays: number; present: number; late: number; early: number; leave: number; absent: number; hours: number };

export type BoardRow = {
  id: string;
  name: string;
  department: string;
  office: string;
  in: string | null;
  out: string | null;
  distance: number | null;
  accuracy: number | null;
  status: DayStatus;
  early: boolean;
  gpsVerified: boolean;
  corrected: boolean;
  note: string | null;
};

export type PunchResult =
  | { ok: true; message: string }
  | { ok: false; reason: "outside" | "accuracy" | "state" | "invalid"; message: string; distance?: number; office?: string };

// ---- Leave (Phase 3) ----
export type LeaveStatusLabel = "Pending" | "Approved" | "Rejected" | "Cancel requested" | "Cancelled";
export type LeaveRow = {
  id: string;
  employeeId: string;
  employee: string;
  department: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatusLabel;
  comment: string | null;
  approver: string | null;
  applied: string;
};
export type LeaveBalanceRow = { typeId: string; type: string; allowed: number; used: number; pending: number };

// ---- Payroll (Phase 4) ----
export type SlipView = {
  id: string;
  month: string; // YYYY-MM
  employeeId: string;
  employee: string;
  department: string;
  basic: number;
  house: number;
  transport: number;
  medical: number;
  tax: number;
  providentFund: number;
  other: number;
  gross: number;
  deductions: number;
  net: number;
  published: boolean;
};

// ---- Goals & performance (Phase 4) ----
export type GoalView = { id: string; employeeId: string; period: "Monthly" | "Annual"; title: string; kpi: string; target: string; progress: number; due: string };
export type ReviewView = { id: string; period: string; rating: number; feedback: string; reviewer: string; date: string };
export type TeamMemberPerf = { id: string; name: string; designation: string; department: string; goals: number; avgProgress: number | null; rating: number | null; ratingPeriod: string | null };

// ---- Policies & tasks (Phase 4) ----
export type PolicyView = { id: string; title: string; category: string; version: string; summary: string | null; pages: number | null; fileSize: number | null; hasFile: boolean; updated: string };
export type TaskView = {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assignee: string;
  assignedBy: string;
  deadline: string;
  status: "To do" | "In progress" | "Completed";
  progress: number;
  priority: "High" | "Medium" | "Low";
  note: string | null;
};

/* ---------- Phase 5: tickets, helpdesk, announcements, notifications ---------- */
export type TicketStatusLabel = "Open" | "Pending" | "Closed";
export type TicketHistoryItem = { at: string; by: string; action: string; note: string }; // at = "YYYY-MM-DD HH:MM" Karachi time
export type TicketView = {
  id: string;
  subject: string;
  description: string;
  submittedBy: string;
  employeeId: string;
  department: string;
  submitted: string; // YYYY-MM-DD
  forwardedTo: string | null;
  status: TicketStatusLabel;
  latestUpdate: string;
  resolution: string | null;
  history: TicketHistoryItem[];
};
export type TicketCounts = { open: number; pending: number; closed: number };

export type HelpdeskStatusLabel = "Open" | "In progress" | "Resolved";
export type HelpdeskView = {
  id: string;
  employeeId: string;
  from: string;
  department: string;
  subject: string;
  message: string;
  status: HelpdeskStatusLabel;
  reply: string | null;
  repliedBy: string | null;
  created: string; // YYYY-MM-DD
};

export type AnnouncementTypeLabel = "HR" | "Company news" | "Holiday" | "Reminder" | "Important";
export type AnnouncementView = { id: string; title: string; body: string; type: AnnouncementTypeLabel; audience: string; author: string; date: string; canRemove: boolean };

export type NotificationView = { id: string; type: string; message: string; link: string | null; read: boolean; at: string };
