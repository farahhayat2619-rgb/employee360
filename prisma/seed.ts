// Seeds the database with Crescent Bank sample data (fictional).
// Run: npx prisma db seed   (wipes existing rows first)
// Every seeded attendance row has gpsVerified = false so demo data is never shown as GPS-verified.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Role } from "../src/generated/prisma/client";
import { textDocumentPdf } from "../src/lib/pdf";
import * as S from "../src/lib/sample-data";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

export const DEMO_PASSWORD = "Employee360!";
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const at = (iso: string, hhmm: string) => new Date(`${iso}T${hhmm}:00+05:00`); // Asia/Karachi

const firstNames = ["Adeel", "Amna", "Arslan", "Asma", "Bushra", "Faisal", "Farhan", "Ghazala", "Haris", "Huma", "Junaid", "Kashif", "Laiba", "Mahnoor", "Moiz", "Naveed", "Noor", "Qasim", "Saad", "Sadia", "Salman", "Samina", "Shahzaib", "Shazia", "Tahir", "Taimur", "Uzma", "Waqar", "Yasir", "Zara", "Zeeshan", "Aliya", "Fahad", "Hina", "Irfan", "Javeria", "Kamal", "Mehwish", "Nabeel", "Rida", "Saima", "Talha", "Umair", "Wajiha"];
const lastNames = ["Ahmed", "Ali", "Aslam", "Baig", "Butt", "Chaudhry", "Hussain", "Iqbal", "Jamil", "Khan", "Malik", "Mirza", "Nawaz", "Qureshi", "Rehman", "Saeed", "Shah", "Sheikh", "Siddiqui", "Zafar"];
const designations: Record<string, string[]> = {
  Operations: ["Operations Officer", "Operations Associate", "Branch Coordinator"],
  "Human Resources": ["HR Officer", "Recruitment Associate"],
  "Information Technology": ["Software Engineer", "Support Analyst", "Network Engineer"],
  Finance: ["Accountant", "Financial Analyst"],
  "Retail Banking": ["Relationship Manager", "Customer Service Officer", "Teller"],
  "Risk & Compliance": ["Compliance Analyst", "Risk Analyst"],
};

const roleMap: Record<S.Role, Role> = { employee: "EMPLOYEE", management: "MANAGEMENT", admin: "ADMIN" };

async function wipe() {
  // Order matters because of foreign keys
  await db.$transaction([
    db.ticketUpdate.deleteMany(),
    db.ticket.deleteMany(),
    db.notification.deleteMany(),
    db.helpdeskRequest.deleteMany(),
    db.task.deleteMany(),
    db.review.deleteMany(),
    db.goal.deleteMany(),
    db.payslip.deleteMany(),
    db.salaryStructure.deleteMany(),
    db.leaveRequest.deleteMany(),
    db.leaveBalance.deleteMany(),
    db.leaveType.deleteMany(),
    db.attendance.deleteMany(),
    db.holiday.deleteMany(),
    db.announcement.deleteMany(),
    db.policy.deleteMany(),
    db.auditLog.deleteMany(),
    db.loginAttempt.deleteMany(),
    db.session.deleteMany(),
    db.department.updateMany({ data: { headId: null } }),
  ]);
  await db.employee.updateMany({ data: { managerId: null } });
  await db.employee.deleteMany();
  await db.user.deleteMany();
  await db.department.deleteMany();
  await db.office.deleteMany();
}

async function main() {
  await wipe();
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const offices = await Promise.all(
    S.offices.map((o) => db.office.create({ data: { name: o.name, address: o.address, latitude: o.lat, longitude: o.lng, radiusM: o.radius, workStart: o.start, workEnd: o.end, graceMin: o.grace } })),
  );
  const officeId = (name: string) => offices.find((o) => o.name === name)!.id;

  const depts = await Promise.all(S.departments.map((d) => db.department.create({ data: { name: d.name } })));
  const deptId = (name: string) => depts.find((d) => d.name === name)!.id;

  // Named employees from the design phase, plus generated staff to reach 60
  type Seed = Omit<S.Employee, "todayStatus" | "performance" | "manager"> & { managerName: string };
  const people: Seed[] = S.employees.map((e) => ({ ...e, managerName: e.manager }));
  let n = 1100;
  let i = 0;
  const deptCycle = S.departments.flatMap((d) => Array(Math.max(0, d.headcount - S.employees.filter((e) => e.department === d.name).length)).fill(d));
  for (const d of deptCycle) {
    const first = firstNames[i % firstNames.length];
    const last = lastNames[(i * 7) % lastNames.length];
    const titles = designations[d.name];
    people.push({
      id: `EMP-${n}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${n}`.toLowerCase() + "@crescentbank.example",
      phone: `+92 300 555 ${String(n).slice(-4)}`,
      department: d.name,
      designation: titles[i % titles.length],
      joiningDate: `${2018 + (i % 8)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
      managerName: d.head,
      office: d.name === "Retail Banking" ? "Gulberg Branch, Lahore" : "Head Office, Karachi",
      status: i % 19 === 7 ? "Inactive" : "Active",
      role: "employee",
      type: i % 5 === 0 ? "Contract" : "Permanent",
    });
    n++;
    i++;
  }

  for (const p of people) {
    await db.user.create({
      data: {
        email: p.email,
        passwordHash: hash,
        role: roleMap[p.role],
        active: p.status !== "Inactive",
        employee: {
          create: {
            id: p.id,
            name: p.name,
            phone: p.phone,
            designation: p.designation,
            joiningDate: day(p.joiningDate),
            type: p.type === "Contract" ? "CONTRACT" : "PERMANENT",
            status: p.status === "Inactive" ? "INACTIVE" : p.status === "On leave" ? "ON_LEAVE" : "ACTIVE",
            departmentId: deptId(p.department),
            officeId: officeId(p.office),
            address: p.id === "EMP-1024" ? "House 14, Block 5, Clifton, Karachi" : sampleAddress(p.id, p.office),
            emergencyContact: p.id === "EMP-1024" ? "Faisal Khan (brother) · +92 321 555 0199" : sampleEmergency(p.id, p.name),
          },
        },
      },
    });
  }
  // Managers and department heads, now that every employee exists
  const byName = new Map(people.map((p) => [p.name, p.id]));
  for (const p of people) {
    const managerId = byName.get(p.managerName);
    if (managerId && managerId !== p.id) await db.employee.update({ where: { id: p.id }, data: { managerId } });
  }
  for (const d of S.departments) await db.department.update({ where: { name: d.name }, data: { headId: byName.get(d.head) } });

  // Leave
  const types = await Promise.all(S.leaveTypes.map((t) => db.leaveType.create({ data: { name: t.type, daysPerYear: t.allowed } })));
  const typeId = (name: string) => types.find((t) => t.name === name)!.id;
  for (const [idx, p] of people.entries()) {
    for (const t of S.leaveTypes) {
      const used = p.id === "EMP-1024" ? t.used : (idx + t.allowed) % (t.allowed - 1);
      await db.leaveBalance.create({ data: { employeeId: p.id, leaveTypeId: typeId(t.type), year: 2026, allowed: t.allowed, used } });
    }
  }
  for (const r of S.leaveRequests) {
    const statusMap = { Pending: "PENDING", Approved: "APPROVED", Rejected: "REJECTED", "Cancel requested": "CANCEL_REQUESTED", Cancelled: "CANCELLED" } as const;
    await db.leaveRequest.create({
      data: { id: r.id, employeeId: r.employeeId, leaveTypeId: typeId(r.type), fromDate: day(r.from), toDate: day(r.to), days: r.days, reason: r.reason, status: statusMap[r.status], approverId: byName.get(r.approver), comment: r.comment, createdAt: day(r.applied) },
    });
  }
  for (const h of S.holidays) await db.holiday.create({ data: { date: day(h.date), name: h.name } });

  // October 2026 attendance (demo, never GPS-verified)
  const rows = [];
  for (const [idx, p] of people.entries()) {
    if (p.status === "Inactive") continue;
    const office = S.offices.find((o) => o.name === p.office)!;
    for (let d = 1; d <= 31; d++) {
      const iso = `2026-10-${String(d).padStart(2, "0")}`;
      const dow = new Date(`${iso}T12:00:00Z`).getUTCDay();
      if (dow === 0 || dow === 6) continue;
      if (p.id === "EMP-1024") {
        const mine = S.myAttendance.find((a) => a.date === iso)!;
        if (mine.status === "On leave") {
          rows.push({ employeeId: p.id, date: day(iso), status: "ON_LEAVE" as const });
          continue;
        }
        const mins = Math.round(mine.hours * 60);
        rows.push({ employeeId: p.id, date: day(iso), punchInAt: at(iso, mine.in!), punchOutAt: at(iso, mine.out!), punchInDistM: 38, punchOutDistM: 41, officeName: office.name, minutesWorked: mins, status: mine.status === "Late" ? ("LATE" as const) : ("PRESENT" as const), late: mine.status === "Late", earlyLeave: mine.early });
        continue;
      }
      const seed = (idx * 31 + d * 7) % 100;
      if (seed < 3) {
        rows.push({ employeeId: p.id, date: day(iso), status: "ABSENT" as const });
        continue;
      }
      if (seed < 7) {
        rows.push({ employeeId: p.id, date: day(iso), status: "ON_LEAVE" as const });
        continue;
      }
      const late = seed < 15;
      const early = seed > 95;
      const inT = late ? `09:${String(16 + (seed % 30)).padStart(2, "0")}` : `08:${String(40 + (seed % 19)).padStart(2, "0")}`;
      const outT = early ? "16:20" : `17:${String(5 + (seed % 40)).padStart(2, "0")}`;
      const mins = (Number(outT.slice(0, 2)) * 60 + Number(outT.slice(3))) - (Number(inT.slice(0, 2)) * 60 + Number(inT.slice(3)));
      rows.push({ employeeId: p.id, date: day(iso), punchInAt: at(iso, inT), punchOutAt: at(iso, outT), punchInDistM: 20 + (seed % 70), punchOutDistM: 15 + (seed % 75), officeName: office.name, minutesWorked: mins, status: late ? ("LATE" as const) : ("PRESENT" as const), late, earlyLeave: early });
    }
  }
  await db.attendance.createMany({ data: rows.map((r) => ({ ...r, gpsVerified: false })) });

  // Pay: structures for everyone, six months of published slips
  const months = ["2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01", "2026-09-01", "2026-10-01"];
  for (const [idx, p] of people.entries()) {
    const basic = p.id === "EMP-1024" ? 185_000 : p.role === "management" ? 320_000 : p.role === "admin" ? 210_000 : 120_000 + (idx % 6) * 12_500;
    const s = { basic, house: Math.round(basic * 0.4), transport: 15_000, medical: Math.round(basic * 0.1) };
    await db.salaryStructure.create({ data: { employeeId: p.id, ...s } });
    if (p.status === "Inactive") continue;
    for (const m of months) {
      const named = p.id === "EMP-1024" ? S.payslips.find((x) => new Date(`${m}T00:00:00Z`).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) === x.month) : undefined;
      const slip = named
        ? { basic: named.basic, house: named.house, transport: named.transport, medical: named.medical, tax: named.tax, providentFund: named.providentFund, other: named.other }
        : { ...s, tax: Math.round((s.basic + s.house + s.transport + s.medical) * 0.085), providentFund: Math.round(s.basic * 0.0833), other: 0 };
      const net = slip.basic + slip.house + slip.transport + slip.medical - slip.tax - slip.providentFund - slip.other;
      await db.payslip.create({ data: { employeeId: p.id, month: day(m), ...slip, net, published: true } });
    }
  }

  // Goals, reviews, policies, tasks
  for (const g of S.goals) await db.goal.create({ data: { employeeId: g.employeeId, period: g.period === "Monthly" ? "MONTHLY" : "ANNUAL", title: g.title, kpi: g.kpi, target: g.target, progress: g.progress, due: day(g.due) } });
  for (const r of S.reviews) await db.review.create({ data: { employeeId: "EMP-1024", reviewerId: "EMP-1002", period: r.period, rating: r.rating, feedback: r.feedback } });
  // Goals and an H1 review for everyone else, so the performance boards have real rows
  const headOf = new Map(S.departments.map((d) => [d.name, byName.get(d.head)]));
  for (const [idx, p] of people.entries()) {
    if (p.id === "EMP-1024" || p.status === "Inactive") continue;
    const [g1, g2] = goalIdeas[idx % goalIdeas.length];
    await db.goal.create({ data: { employeeId: p.id, period: "MONTHLY", ...g1, progress: (idx * 17) % 101, due: day("2026-11-30") } });
    await db.goal.create({ data: { employeeId: p.id, period: "ANNUAL", ...g2, progress: 40 + ((idx * 13) % 61), due: day("2026-12-31") } });
    const reviewer = byName.get(p.managerName) ?? headOf.get(p.department);
    if (reviewer && reviewer !== p.id) {
      const rating = [3.5, 4, 4.5, 4, 3, 5, 4][idx % 7];
      await db.review.create({ data: { employeeId: p.id, reviewerId: reviewer, period: "H1 2026", rating, feedback: feedbackFor(rating), createdAt: new Date("2026-07-10T09:00:00Z") } });
    }
  }
  // Policies with real (sample) PDF documents
  for (const p of S.policies) {
    const text = policyText[p.title] ?? { summary: `${p.title} for Crescent Bank staff.`, sections: [] };
    const { bytes, pages } = await textDocumentPdf(p.title, `Crescent Bank · ${p.category} · ${p.version} · Sample document for the Employee360 demo`, [
      { heading: "Summary", body: text.summary },
      ...text.sections,
      { heading: "About this document", body: "This is a short sample document created for the Employee360 demo. HR replaces it by uploading the bank's approved policy as a new version." },
    ]);
    const fileName = `${p.title.replace(/[^\w]+/g, "-").replace(/-+$/, "")}-${p.version}.pdf`;
    await db.policy.create({ data: { title: p.title, category: p.category, version: p.version, summary: text.summary, pages, fileName, fileSize: bytes.length, fileData: Buffer.from(bytes), updatedBy: "sana.malik@crescentbank.example", updatedAt: day(p.updated) } });
  }
  const taskStatus = { "To do": "TODO", "In progress": "IN_PROGRESS", Completed: "COMPLETED" } as const;
  for (const t of S.tasks) await db.task.create({ data: { id: t.id, title: t.title, description: t.description, assigneeId: t.assignee, assignedById: byName.get(t.assignedBy)!, deadline: day(t.deadline), status: taskStatus[t.status], progress: t.progress, priority: t.priority.toUpperCase() as "HIGH" | "MEDIUM" | "LOW" } });

  // Communication
  const annType = { HR: "HR", "Company news": "COMPANY_NEWS", Holiday: "HOLIDAY", Reminder: "REMINDER", Important: "IMPORTANT" } as const;
  for (const a of S.announcements) await db.announcement.create({ data: { title: a.title, body: a.body, type: annType[a.type], audience: a.audience, authorName: a.author, authorId: byName.get(a.author) ?? null, publishedAt: day(a.date) } });
  for (const [k, nt] of S.notifications.entries()) await db.notification.create({ data: { employeeId: "EMP-1024", type: nt.type, message: nt.message, read: nt.read, createdAt: new Date(Date.UTC(2026, 10, 1, 9 - k)) } });
  const hdStatus = { Open: "OPEN", "In progress": "IN_PROGRESS", Resolved: "RESOLVED" } as const;
  for (const h of S.helpdesk) await db.helpdeskRequest.create({ data: { id: h.id, employeeId: "EMP-1024", subject: h.subject, message: h.message, status: hdStatus[h.status], reply: h.reply, repliedBy: h.reply ? "Sana Malik" : null, createdAt: day(h.created) } });
  // A few requests from other staff so the HR inbox has work waiting
  for (const { created, ...h } of EXTRA_HELPDESK) await db.helpdeskRequest.create({ data: { ...h, createdAt: day(created) } });

  // Tickets with full history
  for (const t of S.tickets) {
    await db.ticket.create({
      data: {
        id: t.id,
        subject: t.subject,
        description: t.description,
        submittedById: t.employeeId,
        department: t.department,
        forwardedTo: t.forwardedTo,
        status: t.status.toUpperCase() as "OPEN" | "PENDING" | "CLOSED",
        latestUpdate: t.latestUpdate,
        resolution: t.resolution,
        createdAt: day(t.submitted),
        updates: { create: t.history.map((h) => ({ byId: byName.get(h.by)!, action: h.action, note: h.note, at: new Date(`${h.at.replace(" ", "T")}:00+05:00`) })) },
      },
    });
  }

  const count = await db.employee.count();
  console.log(`Seeded ${count} employees across ${depts.length} departments. Demo password for every account: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

// ---- Sample content helpers (fictional) ----
const areas: Record<string, string[]> = {
  "Head Office, Karachi": ["Clifton, Karachi", "DHA Phase 6, Karachi", "Gulshan-e-Iqbal, Karachi", "PECHS, Karachi", "North Nazimabad, Karachi"],
  "Gulberg Branch, Lahore": ["Gulberg III, Lahore", "Model Town, Lahore", "Johar Town, Lahore", "DHA Phase 5, Lahore"],
};
function sampleAddress(id: string, office: string) {
  const n = Number(id.replace(/\D/g, ""));
  const list = areas[office] ?? areas["Head Office, Karachi"];
  return `House ${(n % 90) + 3}, Street ${(n % 17) + 1}, ${list[n % list.length]}`;
}
function sampleEmergency(id: string, name: string) {
  const n = Number(id.replace(/\D/g, ""));
  const rel = ["spouse", "father", "mother", "brother", "sister"][n % 5];
  return `${name.split(" ").slice(-1)[0]} family (${rel}) · +92 3${(n % 5) + 10} 555 0${String(100 + (n % 900)).padStart(3, "0")}`;
}
const goalIdeas: [{ title: string; kpi: string; target: string }, { title: string; kpi: string; target: string }][] = [
  [{ title: "Clear the month-end reconciliation backlog", kpi: "Open items", target: "Zero by 30 Nov" }, { title: "Complete AML refresher certification", kpi: "Modules passed", target: "6 of 6" }],
  [{ title: "Improve customer satisfaction on branch visits", kpi: "CSAT score", target: "4.5 / 5" }, { title: "Grow new current accounts", kpi: "Accounts opened", target: "180 in 2026" }],
  [{ title: "Reduce complaint resolution time", kpi: "Average days to close", target: "Under 3 days" }, { title: "Document team procedures", kpi: "SOPs published", target: "8" }],
  [{ title: "Ship the internal reporting dashboard", kpi: "Reports migrated", target: "10" }, { title: "Lower system incident count", kpi: "P1 incidents", target: "Under 4 a year" }],
  [{ title: "Finish quarterly variance analysis", kpi: "Reports on time", target: "100%" }, { title: "Cut manual journal entries", kpi: "Manual entries", target: "-30%" }],
  [{ title: "Close open recruitment requests", kpi: "Roles filled", target: "5" }, { title: "Run the annual engagement survey", kpi: "Response rate", target: "80%" }],
];
function feedbackFor(r: number) {
  if (r >= 4.5) return "Outstanding half year. Consistently goes beyond the role and helps the rest of the team. Ready for more responsibility.";
  if (r >= 4) return "Strong, reliable work and good ownership of deadlines. Next focus: share knowledge with newer colleagues.";
  if (r >= 3.5) return "Solid performance with steady improvement. Keep building confidence in handling escalations independently.";
  return "Meets expectations. Let's agree a clear plan for the second half to lift turnaround times and accuracy.";
}
const policyText: Record<string, { summary: string; sections: { heading: string; body: string }[] }> = {
  "HR Policy Manual": {
    summary: "How Crescent Bank hires, develops, rewards and supports its people, and the standards every employee and manager follows.",
    sections: [
      { heading: "1. Employment", body: "All roles are filled through fair, documented selection. New staff complete a three-month probation with a review at the end of each month." },
      { heading: "2. Performance", body: "Goals are agreed with your manager. Formal reviews happen twice a year, in July and January, with ratings from 1 to 5." },
      { heading: "3. Pay and benefits", body: "Salaries are paid on the last working day of each month. Salary slips are published in Employee360." },
    ],
  },
  "Attendance & Punctuality Policy": {
    summary: "Office hours are 09:00 to 17:00, Monday to Friday. Attendance is marked with GPS Punch In and Punch Out inside the office radius.",
    sections: [
      { heading: "1. Marking attendance", body: "Punch In when you arrive and Punch Out when you leave, from inside your assigned office. Punches from outside the office radius are not accepted." },
      { heading: "2. Late arrival", body: "A 15-minute grace period applies. Arrivals after 09:15 are marked late. Three late marks in a month are discussed with your manager." },
      { heading: "3. Corrections", body: "If you could not punch for a valid reason, ask HR for a correction. Corrections need a written reason and are recorded in the audit log." },
    ],
  },
  "Leave Policy 2026": {
    summary: "Yearly allowances: 10 casual, 8 sick and 14 annual days. Weekends and public holidays are not counted as leave.",
    sections: [
      { heading: "1. Applying", body: "Apply in Employee360 before the leave starts. Sick leave can be logged up to 7 days after the fact." },
      { heading: "2. Approval", body: "Your reporting manager or department head approves leave. You are notified as soon as a decision is made." },
      { heading: "3. Cancellation", body: "You can withdraw a pending request, or ask to cancel approved leave that has not started. Cancelled days return to your balance." },
    ],
  },
  "Code of Conduct": {
    summary: "The behaviour Crescent Bank expects from everyone: integrity, confidentiality, respect and fair dealing with customers.",
    sections: [
      { heading: "1. Integrity", body: "Act honestly, avoid conflicts of interest and declare gifts above the set limit." },
      { heading: "2. Confidentiality", body: "Customer and bank information is shared only with people who need it for their work." },
    ],
  },
  "Employee Handbook": {
    summary: "A practical guide for new and current staff: your first week, tools, benefits, and who to contact for what.",
    sections: [
      { heading: "Your first week", body: "Collect your ID card, sign in to Employee360, read the policies here and meet your manager to agree first goals." },
      { heading: "Getting help", body: "Use the HR Helpdesk in Employee360 for HR questions and Complaint Tickets for issues that need a department to act." },
    ],
  },
  "Anti-Harassment Policy": {
    summary: "Crescent Bank does not tolerate harassment of any kind. This policy explains how to report concerns safely and how they are handled.",
    sections: [{ heading: "Reporting", body: "Report concerns to HR or through a complaint ticket. Reports are handled confidentially and without retaliation." }],
  },
  "Remote Work Guidelines": {
    summary: "When remote work is allowed, how to request it, and how attendance is recorded on approved remote days.",
    sections: [{ heading: "Approval", body: "Remote days need your manager's approval in advance. HR records approved remote days as attendance corrections with the reason." }],
  },
  "Information Security Policy": {
    summary: "Rules for passwords, devices, email and customer data that keep the bank and its customers safe.",
    sections: [
      { heading: "Passwords", body: "Use a unique password of at least 12 characters. Never share it, including with IT or HR." },
      { heading: "Phishing", body: "Report suspicious emails to IT Security. Do not open attachments or links you did not expect." },
    ],
  },
};

const EXTRA_HELPDESK = [
  { id: "HR-0461", employeeId: "EMP-1067", subject: "Maternity leave policy", message: "How many weeks of maternity leave am I entitled to, and how do I apply?", status: "OPEN" as const, created: "2026-11-01" },
  { id: "HR-0459", employeeId: "EMP-1073", subject: "Change bank account for salary", message: "I have moved my salary account to a new bank. Which form do I need to fill in?", status: "OPEN" as const, created: "2026-10-31" },
];
