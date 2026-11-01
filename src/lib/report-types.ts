// Report names and shapes, shared by the server query and the client view.
export const REPORTS = [
  { id: "daily", name: "Daily Attendance" },
  { id: "monthly", name: "Monthly Attendance" },
  { id: "leave", name: "Employee Leave" },
  { id: "dept", name: "Department-wise Attendance" },
  { id: "hours", name: "Working Hours" },
  { id: "perf", name: "Employee Performance" },
  { id: "payroll", name: "Payroll Summary" },
  { id: "t-open", name: "Open Tickets" },
  { id: "t-pending", name: "Pending Tickets" },
  { id: "t-closed", name: "Closed Tickets" },
] as const;
export type ReportId = (typeof REPORTS)[number]["id"];

export type ReportRow = Record<string, string | number>;
export type ReportColumn = { key: string; header: string; kind?: "money" | "num" | "pct" | "status" };
export type ReportChart = { type: "bars" | "line" | "donut"; data: ReportRow[]; x: string; y: string; horizontal?: boolean; format?: "pkr" | "pct"; title: string };
export type ReportData = {
  id: ReportId;
  name: string;
  from: string;
  to: string;
  dept: string; // "All" or a department name
  departments: string[]; // choices for the filter; empty when the filter is locked
  lockedDept: string | null;
  today: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  chart: ReportChart | null;
  note: string | null;
};

