// Design-phase sample data for Crescent Bank (fictional).
// Phase 2 replaces this module with real database queries; screens keep the same shapes.
// Attendance rows here are demo data and are never presented as GPS-verified.

// Fixed "today" for the design preview so every screen agrees with the sample data.
export const TODAY = "2026-11-02";

export type Role = "employee" | "management" | "admin";

export type Department = { id: string; name: string; head: string; headcount: number; attendanceRate: number; openTickets: number };

export const departments: Department[] = [
  { id: "ops", name: "Operations", head: "Imran Siddiqui", headcount: 14, attendanceRate: 96, openTickets: 2 },
  { id: "hr", name: "Human Resources", head: "Sana Malik", headcount: 6, attendanceRate: 98, openTickets: 1 },
  { id: "it", name: "Information Technology", head: "Bilal Ahmed", headcount: 11, attendanceRate: 94, openTickets: 3 },
  { id: "fin", name: "Finance", head: "Nadia Qureshi", headcount: 9, attendanceRate: 97, openTickets: 0 },
  { id: "retail", name: "Retail Banking", head: "Usman Tariq", headcount: 13, attendanceRate: 92, openTickets: 1 },
  { id: "risk", name: "Risk & Compliance", head: "Hira Javed", headcount: 7, attendanceRate: 95, openTickets: 0 },
];

export type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  manager: string;
  office: string;
  status: "Active" | "On leave" | "Inactive";
  role: Role;
  type: "Permanent" | "Contract";
  todayStatus: "Present" | "Late" | "Absent" | "On leave";
  performance: number;
};

export const employees: Employee[] = [
  { id: "EMP-1024", name: "Ayesha Khan", email: "ayesha.khan@crescentbank.example", phone: "+92 300 555 0124", department: "Operations", designation: "Senior Operations Officer", joiningDate: "2021-03-15", manager: "Imran Siddiqui", office: "Head Office, Karachi", status: "Active", role: "employee", type: "Permanent", todayStatus: "Present", performance: 86 },
  { id: "EMP-1002", name: "Imran Siddiqui", email: "imran.siddiqui@crescentbank.example", phone: "+92 300 555 0102", department: "Operations", designation: "Head of Operations", joiningDate: "2016-08-01", manager: "Kamran Hussain", office: "Head Office, Karachi", status: "Active", role: "management", type: "Permanent", todayStatus: "Present", performance: 91 },
  { id: "EMP-1003", name: "Sana Malik", email: "sana.malik@crescentbank.example", phone: "+92 300 555 0103", department: "Human Resources", designation: "HR Manager", joiningDate: "2018-01-10", manager: "Kamran Hussain", office: "Head Office, Karachi", status: "Active", role: "admin", type: "Permanent", todayStatus: "Present", performance: 89 },
  { id: "EMP-1031", name: "Hamza Raza", email: "hamza.raza@crescentbank.example", phone: "+92 300 555 0131", department: "Operations", designation: "Operations Officer", joiningDate: "2022-06-20", manager: "Imran Siddiqui", office: "Head Office, Karachi", status: "Active", role: "employee", type: "Permanent", todayStatus: "Late", performance: 78 },
  { id: "EMP-1038", name: "Mariam Shah", email: "mariam.shah@crescentbank.example", phone: "+92 300 555 0138", department: "Operations", designation: "Branch Coordinator", joiningDate: "2023-02-01", manager: "Imran Siddiqui", office: "Gulberg Branch, Lahore", status: "On leave", role: "employee", type: "Permanent", todayStatus: "On leave", performance: 82 },
  { id: "EMP-1044", name: "Zain Abbas", email: "zain.abbas@crescentbank.example", phone: "+92 300 555 0144", department: "Information Technology", designation: "Systems Engineer", joiningDate: "2020-11-09", manager: "Bilal Ahmed", office: "Head Office, Karachi", status: "Active", role: "employee", type: "Permanent", todayStatus: "Present", performance: 88 },
  { id: "EMP-1005", name: "Bilal Ahmed", email: "bilal.ahmed@crescentbank.example", phone: "+92 300 555 0105", department: "Information Technology", designation: "Head of IT", joiningDate: "2017-04-17", manager: "Kamran Hussain", office: "Head Office, Karachi", status: "Active", role: "management", type: "Permanent", todayStatus: "Present", performance: 90 },
  { id: "EMP-1052", name: "Fatima Noor", email: "fatima.noor@crescentbank.example", phone: "+92 300 555 0152", department: "Finance", designation: "Financial Analyst", joiningDate: "2022-01-03", manager: "Nadia Qureshi", office: "Head Office, Karachi", status: "Active", role: "employee", type: "Permanent", todayStatus: "Present", performance: 84 },
  { id: "EMP-1006", name: "Nadia Qureshi", email: "nadia.qureshi@crescentbank.example", phone: "+92 300 555 0106", department: "Finance", designation: "Finance Controller", joiningDate: "2017-09-25", manager: "Kamran Hussain", office: "Head Office, Karachi", status: "Active", role: "management", type: "Permanent", todayStatus: "Present", performance: 92 },
  { id: "EMP-1061", name: "Ali Hassan", email: "ali.hassan@crescentbank.example", phone: "+92 300 555 0161", department: "Retail Banking", designation: "Relationship Manager", joiningDate: "2021-07-12", manager: "Usman Tariq", office: "Gulberg Branch, Lahore", status: "Active", role: "employee", type: "Permanent", todayStatus: "Absent", performance: 74 },
  { id: "EMP-1007", name: "Usman Tariq", email: "usman.tariq@crescentbank.example", phone: "+92 300 555 0107", department: "Retail Banking", designation: "Head of Retail", joiningDate: "2016-12-05", manager: "Kamran Hussain", office: "Gulberg Branch, Lahore", status: "Active", role: "management", type: "Permanent", todayStatus: "Present", performance: 87 },
  { id: "EMP-1067", name: "Rabia Iqbal", email: "rabia.iqbal@crescentbank.example", phone: "+92 300 555 0167", department: "Retail Banking", designation: "Customer Service Officer", joiningDate: "2024-03-18", manager: "Usman Tariq", office: "Gulberg Branch, Lahore", status: "Active", role: "employee", type: "Contract", todayStatus: "Present", performance: 80 },
  { id: "EMP-1073", name: "Omar Farooq", email: "omar.farooq@crescentbank.example", phone: "+92 300 555 0173", department: "Risk & Compliance", designation: "Compliance Analyst", joiningDate: "2022-10-24", manager: "Hira Javed", office: "Head Office, Karachi", status: "Active", role: "employee", type: "Permanent", todayStatus: "Late", performance: 81 },
  { id: "EMP-1008", name: "Hira Javed", email: "hira.javed@crescentbank.example", phone: "+92 300 555 0108", department: "Risk & Compliance", designation: "Chief Compliance Officer", joiningDate: "2018-05-14", manager: "Kamran Hussain", office: "Head Office, Karachi", status: "Active", role: "management", type: "Permanent", todayStatus: "Present", performance: 93 },
  { id: "EMP-1079", name: "Danish Akhtar", email: "danish.akhtar@crescentbank.example", phone: "+92 300 555 0179", department: "Information Technology", designation: "Support Analyst", joiningDate: "2025-01-06", manager: "Bilal Ahmed", office: "Head Office, Karachi", status: "Active", role: "employee", type: "Contract", todayStatus: "Present", performance: 76 },
  { id: "EMP-1084", name: "Kiran Yousuf", email: "kiran.yousuf@crescentbank.example", phone: "+92 300 555 0184", department: "Human Resources", designation: "HR Officer", joiningDate: "2023-08-21", manager: "Sana Malik", office: "Head Office, Karachi", status: "Active", role: "admin", type: "Permanent", todayStatus: "Present", performance: 85 },
];

export const currentUsers: Record<Role, string> = {
  employee: "EMP-1024",
  management: "EMP-1002",
  admin: "EMP-1003",
};

export function employeeById(id: string) {
  return employees.find((e) => e.id === id)!;
}

export const companyStats = {
  totalEmployees: 60,
  activeEmployees: 57,
  presentToday: 49,
  lateToday: 4,
  absentToday: 3,
  onLeaveToday: 4,
  pendingLeave: 6,
  payrollMonth: "October 2026",
  payrollStatus: "Published",
  payrollNet: 9_842_500,
};

export type Office = { id: string; name: string; address: string; lat: number; lng: number; radius: number; start: string; end: string; grace: number };

export const offices: Office[] = [
  { id: "hq", name: "Head Office, Karachi", address: "I. I. Chundrigar Road, Karachi", lat: 24.8497, lng: 67.0099, radius: 100, start: "09:00", end: "17:00", grace: 15 },
  { id: "lhr", name: "Gulberg Branch, Lahore", address: "Main Boulevard, Gulberg III, Lahore", lat: 31.5104, lng: 74.3429, radius: 100, start: "09:00", end: "17:00", grace: 15 },
];

export type AttendanceRow = { date: string; in: string | null; out: string | null; hours: number; status: "Present" | "Late" | "Absent" | "On leave" | "Holiday" | "Weekend"; early: boolean; location: string };

// October 2026 for Ayesha Khan (demo data, not GPS-verified)
export const myAttendance: AttendanceRow[] = (() => {
  const rows: AttendanceRow[] = [];
  const lates = new Set([6, 14, 23]);
  const leave = new Set([19, 20]);
  const early = new Set([9, 28]);
  for (let d = 31; d >= 1; d--) {
    const date = `2026-10-${String(d).padStart(2, "0")}`;
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (dow === 0 || dow === 6) {
      rows.push({ date, in: null, out: null, hours: 0, status: "Weekend", early: false, location: "" });
      continue;
    }
    if (leave.has(d)) {
      rows.push({ date, in: null, out: null, hours: 0, status: "On leave", early: false, location: "" });
      continue;
    }
    const isLate = lates.has(d);
    const isEarly = early.has(d);
    const inT = isLate ? `09:${20 + (d % 9)}` : `08:${45 + (d % 12)}`;
    const outT = isEarly ? "16:10" : `17:${10 + (d % 20)}`;
    const [ih, im] = inT.split(":").map(Number);
    const [oh, om] = outT.split(":").map(Number);
    const hours = Math.round(((oh * 60 + om - (ih * 60 + im)) / 60) * 10) / 10;
    rows.push({ date, in: inT, out: outT, hours, status: isLate ? "Late" : "Present", early: isEarly, location: "Head Office, Karachi · 38 m" });
  }
  return rows;
})();

export const holidays = [
  { date: "2026-11-09", name: "Iqbal Day" },
  { date: "2026-12-25", name: "Quaid-e-Azam Day" },
  { date: "2027-02-05", name: "Kashmir Solidarity Day" },
  { date: "2027-03-23", name: "Pakistan Day" },
];

export const leaveTypes = [
  { type: "Casual", allowed: 10, used: 3 },
  { type: "Sick", allowed: 8, used: 2 },
  { type: "Annual", allowed: 14, used: 6 },
];

export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancel requested" | "Cancelled";
export type LeaveRequest = { id: string; employeeId: string; type: string; from: string; to: string; days: number; reason: string; status: LeaveStatus; applied: string; approver: string; comment?: string };

export const leaveRequests: LeaveRequest[] = [
  { id: "LV-2026-0311", employeeId: "EMP-1024", type: "Annual", from: "2026-11-23", to: "2026-11-27", days: 5, reason: "Family wedding in Lahore", status: "Pending", applied: "2026-10-29", approver: "Imran Siddiqui" },
  { id: "LV-2026-0287", employeeId: "EMP-1024", type: "Sick", from: "2026-10-19", to: "2026-10-20", days: 2, reason: "Fever, doctor's note attached", status: "Approved", applied: "2026-10-19", approver: "Imran Siddiqui", comment: "Get well soon." },
  { id: "LV-2026-0214", employeeId: "EMP-1024", type: "Casual", from: "2026-08-14", to: "2026-08-14", days: 1, reason: "Personal errand", status: "Approved", applied: "2026-08-10", approver: "Imran Siddiqui" },
  { id: "LV-2026-0102", employeeId: "EMP-1024", type: "Annual", from: "2026-04-06", to: "2026-04-08", days: 3, reason: "Eid travel", status: "Cancelled", applied: "2026-03-20", approver: "Imran Siddiqui" },
  { id: "LV-2026-0306", employeeId: "EMP-1031", type: "Casual", from: "2026-11-04", to: "2026-11-04", days: 1, reason: "Bank visit for home loan", status: "Pending", applied: "2026-10-28", approver: "Imran Siddiqui" },
  { id: "LV-2026-0309", employeeId: "EMP-1038", type: "Annual", from: "2026-10-30", to: "2026-11-06", days: 6, reason: "Hajj preparation", status: "Approved", applied: "2026-10-12", approver: "Imran Siddiqui" },
  { id: "LV-2026-0313", employeeId: "EMP-1044", type: "Sick", from: "2026-11-02", to: "2026-11-03", days: 2, reason: "Dental surgery", status: "Pending", applied: "2026-10-31", approver: "Bilal Ahmed" },
  { id: "LV-2026-0299", employeeId: "EMP-1061", type: "Casual", from: "2026-11-02", to: "2026-11-02", days: 1, reason: "Child's school event", status: "Cancel requested", applied: "2026-10-25", approver: "Usman Tariq" },
  { id: "LV-2026-0315", employeeId: "EMP-1067", type: "Annual", from: "2026-12-21", to: "2026-12-31", days: 8, reason: "Year-end vacation", status: "Pending", applied: "2026-11-01", approver: "Usman Tariq" },
  { id: "LV-2026-0290", employeeId: "EMP-1073", type: "Sick", from: "2026-10-22", to: "2026-10-22", days: 1, reason: "Migraine", status: "Rejected", applied: "2026-10-23", approver: "Hira Javed", comment: "Please submit within policy window." },
];

export type Payslip = { month: string; basic: number; house: number; transport: number; medical: number; tax: number; providentFund: number; other: number };

export const payslips: Payslip[] = [
  { month: "October 2026", basic: 185_000, house: 74_000, transport: 15_000, medical: 18_500, tax: 24_650, providentFund: 15_400, other: 2_000 },
  { month: "September 2026", basic: 185_000, house: 74_000, transport: 15_000, medical: 18_500, tax: 24_650, providentFund: 15_400, other: 0 },
  { month: "August 2026", basic: 185_000, house: 74_000, transport: 15_000, medical: 18_500, tax: 24_650, providentFund: 15_400, other: 3_500 },
  { month: "July 2026", basic: 185_000, house: 74_000, transport: 15_000, medical: 18_500, tax: 24_650, providentFund: 15_400, other: 0 },
  { month: "June 2026", basic: 170_000, house: 68_000, transport: 15_000, medical: 17_000, tax: 21_400, providentFund: 14_150, other: 0 },
  { month: "May 2026", basic: 170_000, house: 68_000, transport: 15_000, medical: 17_000, tax: 21_400, providentFund: 14_150, other: 0 },
];

export function payslipTotals(p: Payslip) {
  const gross = p.basic + p.house + p.transport + p.medical;
  const deductions = p.tax + p.providentFund + p.other;
  return { gross, deductions, net: gross - deductions };
}

export type Goal = { id: string; employeeId: string; period: "Monthly" | "Annual"; title: string; kpi: string; target: string; progress: number; due: string };

export const goals: Goal[] = [
  { id: "G-501", employeeId: "EMP-1024", period: "Monthly", title: "Clear account-opening backlog", kpi: "Pending applications", target: "Under 20 by month end", progress: 72, due: "2026-11-30" },
  { id: "G-502", employeeId: "EMP-1024", period: "Monthly", title: "Reconcile branch cash reports", kpi: "Reports reconciled", target: "All 12 branches", progress: 58, due: "2026-11-30" },
  { id: "G-503", employeeId: "EMP-1024", period: "Monthly", title: "Complete AML refresher course", kpi: "Course modules", target: "6 of 6 modules", progress: 100, due: "2026-11-15" },
  { id: "G-410", employeeId: "EMP-1024", period: "Annual", title: "Cut account-opening time", kpi: "Average turnaround", target: "3 days to 1 day", progress: 64, due: "2026-12-31" },
  { id: "G-411", employeeId: "EMP-1024", period: "Annual", title: "Zero audit findings in operations", kpi: "Open audit findings", target: "0 at year end", progress: 80, due: "2026-12-31" },
  { id: "G-412", employeeId: "EMP-1024", period: "Annual", title: "Train two junior officers", kpi: "Officers signed off", target: "2", progress: 50, due: "2026-12-31" },
];

export const reviews = [
  { period: "H1 2026", rating: 4.3, reviewer: "Imran Siddiqui", feedback: "Ayesha consistently delivers accurate work and has become the go-to person for account-opening escalations. Next step: take more ownership of the branch reconciliation process." },
  { period: "H2 2025", rating: 4.0, reviewer: "Imran Siddiqui", feedback: "Strong improvement in turnaround times. Would like to see more proactive communication with branch coordinators." },
  { period: "H1 2025", rating: 3.8, reviewer: "Imran Siddiqui", feedback: "Reliable and detail-oriented. Focus on time management during month-end." },
];

export const policies = [
  { id: "POL-01", title: "HR Policy Manual", category: "HR Policies", version: "v4.2", updated: "2026-07-01", pages: 38 },
  { id: "POL-02", title: "Attendance & Punctuality Policy", category: "Attendance Policies", version: "v3.0", updated: "2026-09-15", pages: 9 },
  { id: "POL-03", title: "Leave Policy 2026", category: "Leave Policies", version: "v2026.1", updated: "2026-01-02", pages: 12 },
  { id: "POL-04", title: "Code of Conduct", category: "Code of Conduct", version: "v5.1", updated: "2026-03-10", pages: 22 },
  { id: "POL-05", title: "Employee Handbook", category: "Employee Handbook", version: "v2026", updated: "2026-01-15", pages: 64 },
  { id: "POL-06", title: "Anti-Harassment Policy", category: "HR Policies", version: "v2.3", updated: "2025-11-20", pages: 8 },
  { id: "POL-07", title: "Remote Work Guidelines", category: "Attendance Policies", version: "v1.4", updated: "2026-05-05", pages: 6 },
  { id: "POL-08", title: "Information Security Policy", category: "Policy Documents", version: "v6.0", updated: "2026-08-18", pages: 27 },
];

export type TaskStatus = "To do" | "In progress" | "Completed";
export type Task = { id: string; title: string; description: string; assignee: string; assignedBy: string; deadline: string; status: TaskStatus; progress: number; priority: "High" | "Medium" | "Low" };

export const tasks: Task[] = [
  { id: "T-2201", title: "Prepare Q3 operations report", description: "Compile account-opening volumes, turnaround times and exceptions for Q3 and share with the operations head.", assignee: "EMP-1024", assignedBy: "Imran Siddiqui", deadline: "2026-11-05", status: "In progress", progress: 60, priority: "High" },
  { id: "T-2207", title: "Review KYC exceptions list", description: "Go through the 34 flagged KYC files and mark each as cleared or escalated.", assignee: "EMP-1024", assignedBy: "Imran Siddiqui", deadline: "2026-11-08", status: "To do", progress: 0, priority: "High" },
  { id: "T-2210", title: "Update branch contact sheet", description: "Confirm the latest phone numbers and coordinators for all 12 branches.", assignee: "EMP-1024", assignedBy: "Imran Siddiqui", deadline: "2026-11-12", status: "To do", progress: 0, priority: "Low" },
  { id: "T-2189", title: "Onboard new teller software", description: "Attend vendor training and write a one-page quick guide for the team.", assignee: "EMP-1024", assignedBy: "Imran Siddiqui", deadline: "2026-10-30", status: "In progress", progress: 85, priority: "Medium" },
  { id: "T-2170", title: "Archive 2025 account forms", description: "Scan and archive closed account-opening forms from 2025.", assignee: "EMP-1024", assignedBy: "Imran Siddiqui", deadline: "2026-10-20", status: "Completed", progress: 100, priority: "Low" },
  { id: "T-2158", title: "Month-end cash reconciliation", description: "Reconcile September branch cash with core banking.", assignee: "EMP-1024", assignedBy: "Imran Siddiqui", deadline: "2026-10-05", status: "Completed", progress: 100, priority: "High" },
  { id: "T-2215", title: "Patch core banking test servers", description: "Apply October security patches to the three UAT servers.", assignee: "EMP-1044", assignedBy: "Bilal Ahmed", deadline: "2026-11-06", status: "In progress", progress: 40, priority: "High" },
  { id: "T-2219", title: "Q4 budget variance analysis", description: "Explain variances over 5% against the Q4 budget.", assignee: "EMP-1052", assignedBy: "Nadia Qureshi", deadline: "2026-11-15", status: "To do", progress: 0, priority: "Medium" },
];

export type Announcement = { id: string; title: string; body: string; type: "HR" | "Company news" | "Holiday" | "Reminder" | "Important"; date: string; author: string; audience: string };

export const announcements: Announcement[] = [
  { id: "AN-88", title: "Open enrolment for 2027 medical cover", body: "Add or update dependants for next year's medical cover by 20 November. Changes after that date take effect in April.", type: "HR", date: "2026-10-30", author: "Sana Malik", audience: "All staff" },
  { id: "AN-87", title: "Iqbal Day holiday on 9 November", body: "All offices and branches will be closed on Monday 9 November for Iqbal Day.", type: "Holiday", date: "2026-10-28", author: "HR Department", audience: "All staff" },
  { id: "AN-86", title: "Crescent Bank wins Digital Banking Award", body: "Our mobile app was named Best Digital Experience at the Pakistan Banking Awards 2026. Thank you to everyone involved.", type: "Company news", date: "2026-10-24", author: "Corporate Communications", audience: "All staff" },
  { id: "AN-85", title: "New attendance system goes live", body: "From 1 November, attendance is marked with Employee360 Punch In / Punch Out from inside the office. Allow location access on your phone.", type: "Important", date: "2026-10-20", author: "Sana Malik", audience: "All staff" },
  { id: "AN-84", title: "Quarterly town hall", body: "Join the CEO's quarterly town hall on 12 November at 4 pm in the Head Office auditorium or online.", type: "Company news", date: "2026-10-18", author: "Corporate Communications", audience: "All staff" },
];

export type Notification = { id: string; type: "Leave" | "Attendance" | "Announcement" | "Holiday" | "Ticket" | "Task" | "Payroll"; message: string; time: string; read: boolean };

export const notifications: Notification[] = [
  { id: "N-1", type: "Attendance", message: "Reminder: you have not punched in yet today.", time: "Today, 9:05 am", read: false },
  { id: "N-2", type: "Ticket", message: "TKT-2026-00042 was forwarded to Information Technology.", time: "Yesterday, 4:12 pm", read: false },
  { id: "N-3", type: "Payroll", message: "Your October 2026 salary slip is ready.", time: "31 Oct, 6:00 pm", read: false },
  { id: "N-4", type: "Announcement", message: "New HR announcement: Open enrolment for 2027 medical cover.", time: "30 Oct, 11:20 am", read: true },
  { id: "N-5", type: "Holiday", message: "Iqbal Day holiday on Monday 9 November.", time: "28 Oct, 10:00 am", read: true },
  { id: "N-6", type: "Leave", message: "Your Sick leave for 19–20 Oct was approved by Imran Siddiqui.", time: "19 Oct, 12:40 pm", read: true },
  { id: "N-7", type: "Task", message: "New task assigned: Review KYC exceptions list.", time: "18 Oct, 9:30 am", read: true },
];

export type HelpdeskRequest = { id: string; subject: string; message: string; status: "Open" | "In progress" | "Resolved"; created: string; reply?: string };

export const helpdesk: HelpdeskRequest[] = [
  { id: "HR-0457", subject: "Salary certificate for visa", message: "I need a salary certificate addressed to the UK embassy.", status: "In progress", created: "2026-10-29", reply: "Being prepared, ready by 3 November." },
  { id: "HR-0431", subject: "Update emergency contact", message: "Please update my emergency contact to my brother, Faisal Khan.", status: "Resolved", created: "2026-10-11", reply: "Updated in your profile." },
  { id: "HR-0398", subject: "Provident fund statement", message: "Can I get my provident fund statement for FY 2025-26?", status: "Resolved", created: "2026-09-02", reply: "Statement emailed to you." },
];

export type TicketStatus = "Open" | "Pending" | "Closed";
export type TicketEvent = { at: string; by: string; action: string; note: string };
export type Ticket = {
  id: string;
  subject: string;
  description: string;
  submittedBy: string;
  employeeId: string;
  department: string;
  submitted: string;
  forwardedTo: string | null;
  status: TicketStatus;
  latestUpdate: string;
  resolution: string | null;
  history: TicketEvent[];
};

export const tickets: Ticket[] = [
  {
    id: "TKT-2026-00047", subject: "Air conditioning not working on 3rd floor", description: "The AC on the 3rd floor operations hall has been off since Thursday. It is very hot by noon and staff are struggling.", submittedBy: "Ayesha Khan", employeeId: "EMP-1024", department: "Operations", submitted: "2026-10-31", forwardedTo: null, status: "Open", latestUpdate: "Waiting for management review", resolution: null,
    history: [{ at: "2026-10-31 10:14", by: "Ayesha Khan", action: "Submitted", note: "Ticket created" }],
  },
  {
    id: "TKT-2026-00046", subject: "Parking passes not issued to new joiners", description: "Three new joiners in Retail have not received parking passes after two weeks.", submittedBy: "Rabia Iqbal", employeeId: "EMP-1067", department: "Retail Banking", submitted: "2026-10-30", forwardedTo: null, status: "Open", latestUpdate: "Waiting for management review", resolution: null,
    history: [{ at: "2026-10-30 15:02", by: "Rabia Iqbal", action: "Submitted", note: "Ticket created" }],
  },
  {
    id: "TKT-2026-00042", subject: "Printer on 2nd floor keeps jamming", description: "The shared printer near the operations desk jams on every second job. We print account forms all day.", submittedBy: "Ayesha Khan", employeeId: "EMP-1024", department: "Operations", submitted: "2026-10-27", forwardedTo: "Information Technology", status: "Pending", latestUpdate: "Replacement rollers ordered, arriving 3 Nov", resolution: null,
    history: [
      { at: "2026-10-27 09:40", by: "Ayesha Khan", action: "Submitted", note: "Ticket created" },
      { at: "2026-10-27 13:15", by: "Imran Siddiqui", action: "Forwarded", note: "Forwarded to Information Technology" },
      { at: "2026-10-28 11:02", by: "Zain Abbas", action: "Updated", note: "Inspected printer; feed rollers worn out" },
      { at: "2026-10-31 16:12", by: "Zain Abbas", action: "Updated", note: "Replacement rollers ordered, arriving 3 Nov" },
    ],
  },
  {
    id: "TKT-2026-00039", subject: "Payslip shows wrong transport allowance", description: "My September payslip shows transport allowance of 12,000 instead of 15,000.", submittedBy: "Fatima Noor", employeeId: "EMP-1052", department: "Finance", submitted: "2026-10-21", forwardedTo: "Human Resources", status: "Pending", latestUpdate: "Payroll team checking September run", resolution: null,
    history: [
      { at: "2026-10-21 10:30", by: "Fatima Noor", action: "Submitted", note: "Ticket created" },
      { at: "2026-10-21 14:00", by: "Imran Siddiqui", action: "Forwarded", note: "Forwarded to Human Resources" },
      { at: "2026-10-22 09:45", by: "Kiran Yousuf", action: "Updated", note: "Payroll team checking September run" },
    ],
  },
  {
    id: "TKT-2026-00035", subject: "Branch internet down every afternoon", description: "Gulberg branch loses internet between 2 and 3 pm most days, which stops customer transactions.", submittedBy: "Ali Hassan", employeeId: "EMP-1061", department: "Retail Banking", submitted: "2026-10-15", forwardedTo: "Information Technology", status: "Pending", latestUpdate: "ISP engineer visit scheduled 2 Nov", resolution: null,
    history: [
      { at: "2026-10-15 15:10", by: "Ali Hassan", action: "Submitted", note: "Ticket created" },
      { at: "2026-10-16 10:00", by: "Imran Siddiqui", action: "Forwarded", note: "Forwarded to Information Technology" },
      { at: "2026-10-29 12:20", by: "Danish Akhtar", action: "Updated", note: "ISP engineer visit scheduled 2 Nov" },
    ],
  },
  {
    id: "TKT-2026-00031", subject: "Washroom tap leaking on ground floor", description: "The tap in the ground floor washroom has been leaking for a week.", submittedBy: "Hamza Raza", employeeId: "EMP-1031", department: "Operations", submitted: "2026-10-08", forwardedTo: "Operations", status: "Closed", latestUpdate: "Plumber replaced the tap", resolution: "Facilities team replaced the tap cartridge on 10 Oct. Checked again on 13 Oct, no leak.",
    history: [
      { at: "2026-10-08 09:12", by: "Hamza Raza", action: "Submitted", note: "Ticket created" },
      { at: "2026-10-08 11:30", by: "Imran Siddiqui", action: "Forwarded", note: "Forwarded to Operations (Facilities)" },
      { at: "2026-10-10 16:45", by: "Imran Siddiqui", action: "Updated", note: "Plumber replaced the tap" },
      { at: "2026-10-13 10:05", by: "Imran Siddiqui", action: "Closed", note: "Resolved and verified" },
    ],
  },
  {
    id: "TKT-2026-00027", subject: "Cannot access shared drive after password change", description: "Since changing my password I cannot open the Operations shared drive.", submittedBy: "Ayesha Khan", employeeId: "EMP-1024", department: "Operations", submitted: "2026-09-29", forwardedTo: "Information Technology", status: "Closed", latestUpdate: "Access restored", resolution: "Cached credentials cleared and drive re-mapped. Access confirmed by employee.",
    history: [
      { at: "2026-09-29 08:55", by: "Ayesha Khan", action: "Submitted", note: "Ticket created" },
      { at: "2026-09-29 09:30", by: "Imran Siddiqui", action: "Forwarded", note: "Forwarded to Information Technology" },
      { at: "2026-09-29 12:10", by: "Zain Abbas", action: "Closed", note: "Access restored" },
    ],
  },
];

export function nextTicketId(list: Ticket[]) {
  const max = Math.max(0, ...list.map((t) => Number(t.id.split("-")[2])));
  return `TKT-${new Date().getFullYear()}-${String(max + 1).padStart(5, "0")}`;
}

export const ticketCounts = (list: Ticket[]) => ({
  open: list.filter((t) => t.status === "Open").length,
  pending: list.filter((t) => t.status === "Pending").length,
  closed: list.filter((t) => t.status === "Closed").length,
});

// Report series for charts (demo data)
export const attendanceTrend = [
  { day: "Oct 1", rate: 95 }, { day: "Oct 2", rate: 93 }, { day: "Oct 5", rate: 96 }, { day: "Oct 6", rate: 94 },
  { day: "Oct 7", rate: 97 }, { day: "Oct 8", rate: 95 }, { day: "Oct 9", rate: 92 }, { day: "Oct 12", rate: 96 },
  { day: "Oct 13", rate: 97 }, { day: "Oct 14", rate: 95 }, { day: "Oct 15", rate: 94 }, { day: "Oct 16", rate: 91 },
  { day: "Oct 19", rate: 95 }, { day: "Oct 20", rate: 96 }, { day: "Oct 21", rate: 97 }, { day: "Oct 22", rate: 96 },
  { day: "Oct 23", rate: 93 }, { day: "Oct 26", rate: 95 }, { day: "Oct 27", rate: 96 }, { day: "Oct 28", rate: 97 },
  { day: "Oct 29", rate: 95 }, { day: "Oct 30", rate: 92 },
];

export const payrollByDept = [
  { dept: "Operations", net: 2_310_000 },
  { dept: "Retail Banking", net: 2_045_000 },
  { dept: "Information Technology", net: 2_180_000 },
  { dept: "Finance", net: 1_420_000 },
  { dept: "Risk & Compliance", net: 1_115_000 },
  { dept: "Human Resources", net: 772_500 },
];

export const leaveByType = [
  { type: "Casual", days: 58 },
  { type: "Sick", days: 41 },
  { type: "Annual", days: 126 },
];

export function formatPKR(n: number) {
  return "PKR " + n.toLocaleString("en-PK");
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
}
