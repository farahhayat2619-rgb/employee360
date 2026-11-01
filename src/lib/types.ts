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
