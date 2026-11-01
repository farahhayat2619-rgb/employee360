# employee360
Smart Employee Management System - SaaS project

Employee360 is an employee management and HRMS web app for a corporate or banking organization (demo company: the fictional Crescent Bank). It has three portals behind one login: **Employee**, **Management** and **Admin / HR**.

## Status

**Phase 4 of 6: profiles, payroll, goals, policies and tasks.** Sign-in is real, every portal page is protected by role, and employees, departments, roles, attendance, leave, profiles, payroll, goals, reviews, policies and tasks are saved to PostgreSQL. Tickets, the HR helpdesk, announcements, notifications and reports still show sample data until Phases 5 and 6; a banner on every page says so.

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | UI/UX design of every screen | Done |
| 2 | Database, secure login, roles, protected pages, sample data | Done |
| 3 | GPS Punch In / Out with office geofencing, leave | Done |
| 4 | Profiles, payroll and PDF salary slips, goals, policies, tasks | Done |
| 5 | Announcements, notifications, HR helpdesk, complaint tickets | Next |
| 6 | Reports, polish, deploy | Planned |

## Screens

- **Employee portal (12):** Dashboard, Attendance, Leave, My Profile, Payroll, Goals & Performance, Company Policies, Tasks, Notifications, HR Helpdesk, Complaint Tickets, Department Inbox
- **Management portal (9):** Dashboard, Employee Overview, Department Overview, Attendance Monitoring, Leave Requests, Performance & Goals, Ticket Review, Announcements, Reports
- **Admin / HR portal (16):** Dashboard, Employee Records, Register / Edit Employee, Departments, Attendance, Leave Management, Payroll, Goals & Performance, Tasks, Policies, Announcements, Helpdesk, Reports & Analytics (10 reports), Roles & Permissions, System Settings (office geofences)

## GPS attendance

- Punch In and Punch Out read the device's GPS (`enableHighAccuracy`) and send the raw reading to the server.
- The **server** measures the distance to the employee's assigned office and refuses the punch if it is outside the office radius (100 m by default) with: "You're outside the authorized office location. Attendance cannot be marked." Readings less accurate than 100 m are refused too.
- The punch time comes from the server clock, in Pakistan time, so changing the phone's clock does nothing. Late (after start time + grace) and early departure (before end time) are worked out on the server.
- Each record stores date, punch in and out times, coordinates, distance and GPS accuracy.
- Labels keep sources honest: **GPS verified** for real punches, **Demo data** for the seeded October records, **Corrected by HR** for manual corrections (which need a written reason and go to the audit log).
- Limits: a browser cannot prove a phone isn't faking its location (for example with a mock-location app). The server check stops anyone from simply skipping the check or editing the page, but it can't detect a spoofed GPS chip. If you need stronger proof later, options include office Wi-Fi checks or a native app.

## Leave

- Employees apply for Casual, Sick or Annual leave. Weekends and public holidays aren't counted. Balance, overlaps and dates are checked on the server. Sick leave can be logged up to 7 days back.
- Requests go to the employee's reporting manager (or department head). Managers see their department and direct reports; Admin / HR sees everyone. Nobody can approve their own leave.
- Approving deducts the balance and marks the days as leave on the attendance calendar. Employees can withdraw a pending request or ask to cancel approved leave that hasn't started; allowing the cancellation gives the days back.
- The employee gets a notification for each decision. HR sets yearly allowances and the holiday calendar.

## Payroll, profiles, goals, policies and tasks

- **Payroll:** HR previews the month from each person's salary structure, runs it (draft slips), checks the figures and publishes. Employees are notified and see only their own published slips. Slips download as a branded **PDF** generated on the server. Tax and provident fund use the demo's simplified flat rule, which is not tax advice.
- **My Profile:** employees edit their own phone, address and emergency contact, and upload a photo (JPG, PNG or WebP up to 500 KB, checked by its contents). Employment details stay HR-only.
- **Goals and reviews:** managers (for their department and direct reports) and HR assign monthly or annual goals and write reviews rated 1 to 5. Employees update their goal progress.
- **Policies:** HR uploads PDFs (up to 5 MB, checked to be real PDFs) or new versions, and all staff are notified. Files are stored in the database, so no separate file storage is needed. Seeded policies are short sample documents.
- **Tasks:** HR assigns tasks with a deadline and priority. Employees update progress with a note or mark them complete, and HR is notified.

## Security

- Passwords are hashed with bcrypt (cost 12). Nobody, including HR, can read them.
- Sessions live in the database. The browser only holds a random token in an httpOnly cookie; the database stores its SHA-256 hash. Sessions end after 30 minutes idle or 12 hours in total, and on sign-out.
- Sign-in is rate limited: 5 failed tries per email or 25 per network address in 15 minutes.
- Every page and every server action checks the user's role on the server. Employee opens the Employee portal; Management opens Management and Employee; Admin / HR opens all three.
- Deactivating an employee signs them out everywhere and blocks sign-in. Admins cannot change their own role or deactivate themselves.
- New employees get a one-time password shown once to the HR admin who registered them.
- Every change to employees, roles and departments is written to an audit log.

## Tech stack

Next.js 16 (App Router) + TypeScript, Tailwind CSS, Recharts, lucide-react icons, PostgreSQL with Prisma 7, zod validation, bcrypt.

## Run it locally

You need Node.js 20+ and a PostgreSQL database (local, or a free one from Supabase or Neon).

```bash
npm install
cp .env.example .env        # then put your database address in DATABASE_URL
npm run db:migrate          # creates the tables
npm run db:seed             # loads the Crescent Bank sample data (wipes existing data)
npm run dev
```

Open http://localhost:3000, choose a portal and sign in.

### Demo accounts

Every seeded account uses the password `Employee360!`. Change this before any real use.

| Portal | Email |
| --- | --- |
| Employee | ayesha.khan@crescentbank.example |
| Management | imran.siddiqui@crescentbank.example |
| Admin / HR | sana.malik@crescentbank.example |

## Deploy (Vercel)

1. Create a PostgreSQL database (for example on Supabase) and copy its connection string.
2. Import the GitHub repo in Vercel and add `DATABASE_URL` under Settings → Environment Variables.
3. Run `npm run db:migrate` and `npm run db:seed` once against that database from your computer (with the same `DATABASE_URL` in `.env`).
4. Deploy. The build runs `prisma generate` automatically.

Sample data for modules not yet on the database lives in `src/lib/sample-data.ts`; the demo "today" is 2 November 2026.
