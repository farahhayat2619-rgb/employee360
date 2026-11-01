# employee360
Smart Employee Management System - SaaS project

Employee360 is an employee management and HRMS web app for a corporate or banking organization (demo company: the fictional Crescent Bank). It has three portals behind one login: **Employee**, **Management** and **Admin / HR**.

## Status

**Phase 2 of 6: database, secure login and roles.** Sign-in is real, every portal page is protected by role, and employee records, departments and role changes are saved to PostgreSQL. Attendance, leave, payroll, tickets and the other modules still show sample data until their phase is built; a banner on every page says so.

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | UI/UX design of every screen | Done |
| 2 | Database, secure login, roles, protected pages, sample data | Done |
| 3 | GPS Punch In / Out with office geofencing, leave | Next |
| 4 | Profiles, payroll and PDF salary slips, goals, policies, tasks | Planned |
| 5 | Announcements, notifications, HR helpdesk, complaint tickets | Planned |
| 6 | Reports, polish, deploy | Planned |

## Screens

- **Employee portal (12):** Dashboard, Attendance, Leave, My Profile, Payroll, Goals & Performance, Company Policies, Tasks, Notifications, HR Helpdesk, Complaint Tickets, Department Inbox
- **Management portal (9):** Dashboard, Employee Overview, Department Overview, Attendance Monitoring, Leave Requests, Performance & Goals, Ticket Review, Announcements, Reports
- **Admin / HR portal (16):** Dashboard, Employee Records, Register / Edit Employee, Departments, Attendance, Leave Management, Payroll, Goals & Performance, Tasks, Policies, Announcements, Helpdesk, Reports & Analytics (10 reports), Roles & Permissions, System Settings (office geofences)

## GPS attendance

Punch In already reads the device's real GPS location and checks it against each office's radius. Outside the radius it shows: "You're outside the authorized office location. Attendance cannot be marked." The punch is not saved yet; Phase 3 moves the check to the server and stores date, time, coordinates, distance and accuracy. Sample attendance rows are labelled "Demo" and are never shown as GPS-verified.

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
