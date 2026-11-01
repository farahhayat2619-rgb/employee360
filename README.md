# employee360
Smart Employee Management System - SaaS project

Employee360 is an employee management and HRMS web app for a corporate or banking organization (demo company: the fictional Crescent Bank). It has three portals behind one login: **Employee**, **Management** and **Admin / HR**.

## Status

**Phase 1 of 6: design system and all screens.** Every screen is built and clickable with realistic sample data. Forms, approvals, ticket forwarding and filters work in the browser, but nothing is saved yet. A banner on every page says so.

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | UI/UX design of every screen | Done |
| 2 | Database, secure login, roles, protected pages, sample data | Next |
| 3 | GPS Punch In / Out with office geofencing, leave | Planned |
| 4 | Profiles, payroll and PDF salary slips, goals, policies, tasks | Planned |
| 5 | Announcements, notifications, HR helpdesk, complaint tickets | Planned |
| 6 | Reports, polish, deploy | Planned |

## Screens

- **Employee portal (12):** Dashboard, Attendance, Leave, My Profile, Payroll, Goals & Performance, Company Policies, Tasks, Notifications, HR Helpdesk, Complaint Tickets, Department Inbox
- **Management portal (9):** Dashboard, Employee Overview, Department Overview, Attendance Monitoring, Leave Requests, Performance & Goals, Ticket Review, Announcements, Reports
- **Admin / HR portal (16):** Dashboard, Employee Records, Register / Edit Employee, Departments, Attendance, Leave Management, Payroll, Goals & Performance, Tasks, Policies, Announcements, Helpdesk, Reports & Analytics (10 reports), Roles & Permissions, System Settings (office geofences)

## GPS attendance

Punch In already reads the device's real GPS location and checks it against each office's radius. Outside the radius it shows: "You're outside the authorized office location. Attendance cannot be marked." In Phase 1 the punch is not saved; Phase 3 moves the check to the server and stores date, time, coordinates, distance and accuracy. Sample attendance rows are labelled "Demo" and are never shown as GPS-verified.

## Tech stack

Next.js (App Router) + TypeScript, Tailwind CSS, Recharts, lucide-react icons. Phase 2 adds PostgreSQL (Supabase), Prisma and Supabase Auth.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000, pick a portal on the sign-in page (any password works in the preview), and use the menu under your name to switch portals.

Sample data lives in `src/lib/sample-data.ts`; the demo "today" is 2 November 2026.
