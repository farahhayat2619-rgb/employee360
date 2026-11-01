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
