# RTU Voice — Student Portal + Central Admin Console (Frontend)

Frontend for **RTU VOICE: An AI-Assisted Student Concern and Feedback Management System for
Rizal Technological University – Pasig Campus**, built from the Group 4Voices Figma high-fidelity
design (Page 1: student screens and Central Admin Console screens).

Stack: **Next.js 16 (App Router) · React 19 · TypeScript · CSS Modules**. No UI framework, no
Tailwind, no chart library, no backend.

> **Frontend only — simulated behaviour.** There is no server, database, Supabase, email, OTP
> delivery, file storage or AI. Accounts, complaints, admin actions and profile changes are kept
> in your browser's `localStorage` so the flows can be tested. Every simulated step is marked in
> the code with `SIMULATED` and on screen with a dashed yellow "Demo" note.

---

## 1. Requirements

- **Node.js 20.9 or newer** (Node 22 LTS recommended) — check with `node -v`
- npm (comes with Node)
- Visual Studio Code (any recent version)

## 2. Run it

1. Extract the ZIP. You get a folder named `rtu-voice-student-portal`.
2. In VS Code: **File → Open Folder…** and choose that folder.
3. Open the terminal: **Terminal → New Terminal**.
4. Install dependencies (first time only, needs internet):
   ```bash
   npm install
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open **http://localhost:3000** in your browser.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Serve the production build on port 3000 (run `npm run build` first) |
| `npm run typecheck` | TypeScript check only |

## 3. Demo accounts and test data

One login page serves all three portals (SRS v3 "unified login"): the account's role decides where you
land.

| What | Value |
| --- | --- |
| **Student** | Any `@rtu.edu.ph` email with the demo password **`rtuvoice123`**. `juan.cruz@rtu.edu.ph` is the Figma sample student "Juan Dela Cruz" and owns the sample complaints below. |
| **Admin** | `admin@rtu.edu.ph` (Super-Admin), `ics.admin@rtu.edu.ph`, `osa.admin@rtu.edu.ph` — use demo password **`rtuvoice123`**. Admin accounts cannot register. |
| **Department head** | `facilities@rtu.edu.ph` (Facilities Office), `registrar@rtu.edu.ph`, `academic@rtu.edu.ph`, `osa@rtu.edu.ph` (Student Affairs), `cashier@rtu.edu.ph`, `ict@rtu.edu.ph` — use demo password **`rtuvoice123`**. Each account only sees its own department's complaints. Cannot register. |
| One-time code (register, forgot password) | **`123456`** — no email is sent |
| Student's sample tracking IDs | `STU-A3F1B` (In Progress, has a department update), `STU-K92QD` (Resolved), `STU-77MZP` (Assigned, overdue), `STU-B04XR` (Rejected), `STU-M5T8C` (Resolved) |

All portals share one complaint list. Try this: log in as the student and submit a concern →
log out → log in as `admin@rtu.edu.ph` → assign it from the Pending Validation Queue → log back in
as the student and track it. The Assigned status, department and timeline show up immediately.
Then log in as that department's head (e.g. `facilities@rtu.edu.ph`), set the status to In progress or
Resolved and use **Add Update**; the student sees both on the Status Tracker (**View Update**) and the
admin sees them in **View Updates** and the Activity Log.

Sample dates are generated relative to the day you first open the site, so SLA timers
("Acknowledge in 1 day", "Overdue by 4 days") stay realistic. To reset all demo data, clear the
site's local storage (DevTools → Application → Local Storage → delete `rtu-voice-demo-v2`), or open
the site in a private window.

## 4. Pages

### Student Portal

| Route | Figma frame | Notes |
| --- | --- | --- |
| `/` | LANDING PAGE | FAQ accordion, links to report/register/login |
| `/about` | ABOUT | |
| `/privacy` | PRIVACY NOTICE | |
| `/terms` | TERMS OF USE | |
| `/register` | REGISTER | RTU-email rule, password rules, confirm match; staff emails are refused |
| `/register/verify` | VERIFY ACCOUNT | 6-box OTP, paste support, 3 wrong tries, 60 s resend timer, 5-resend limit |
| `/login` | LOGIN | Role-based redirect; returns you to the page you came from (`?next=`) |
| `/forgot-password` → `/verify` → `/reset` | FORGOT PASSWORD, VERIFY ACCOUNT, SET NEW PASSWORD | Steps are guarded; you cannot skip the code step |
| `/dashboard` | HOME | Student dashboard, recent resolved complaints |
| *(side menu)* | SIDEBAR + 4 variants | Opens from the ☰ button; Esc or clicking outside closes it |
| *(profile menu)* | HOME with dropdown | Manage Profile, Logout (with confirmation) |
| `/report` | REPORT A CONCERN | Validation, 5 categories, evidence drag-and-drop (JPG/PNG/PDF/MP3/WAV/MP4, 5 MB total), opt-out checkbox |
| `/report/submitted?id=` | Frame (receipt) | Copy-to-clipboard tracking ID |
| `/track?id=` | STATUS TRACKER + update pop-up | Format check, not-found state, timeline, View Update dialog; only your own complaints |
| `/history` | History | Table on desktop, cards on mobile; IDs link to the tracker |
| `/public-dashboard` | Public Dashboard | Built from released complaints (not opted out); status/category filters, pagination |
| `/profile` | MANAGE PROFILE | Edit name, locked email, change password with rules |

Priority levels are never shown anywhere in the student portal (SRS v3).

### Central Admin Console

| Route | Figma frame | Notes |
| --- | --- | --- |
| `/admin` | Admin HOME — Pending Validation Queue | Clickable stat boxes; search and Newest/Oldest sort; **Assign** dropdown per row (assigning = approval, then the simulated AI sets priority + public summary); **Reject** with a required reason |
| `/admin?tab=master` | Admin HOME — Master Tracking Queue | Search, status and department filters, priority, SLA ("Acknowledge in…", "Resolve in…", "Overdue by…"), **View Updates**, **Reassign** |
| *(pop-ups)* | Complaint details · Reject complaint · Reassign complaint · Complaint updates · Log out | Details include description, evidence and the SLA box; Reassign warns when the complaint is already In Progress and requires a reason |
| `/admin/complaints` | Total complaints | Department filter (incl. "Not assigned"), sort, pagination (8 per page) |
| `/admin/assigned` | Assigned | Priority, Acknowledge by, Resolve by (red when overdue) |
| `/admin/in-progress` | In progress | Priority, Acknowledged, Resolve by |
| `/admin/resolved` | Resolved | Priority, Resolved in N days (late ones flagged) |
| `/admin/statistics` | *(no Figma screen — see §6)* | Resolve rate, overdue count, average time to resolve; bar charts by category, department, priority; monthly trend; department filter; every chart has a table view |
| `/admin/activity` | *(no Figma screen — see §6)* | Every assignment, reassignment, rejection, status change and department update; filters by action and actor |
| `/admin/admins` | *(no Figma screen — see §6)* | Administrator accounts (read-only; accounts are created manually) |
| `/admin/profile` | MANAGE PROFILE | Same form as the student profile |
| *(side menu)* | Admin SIDEBAR variants | White menu with yellow active item, Logout at the bottom |

### Department Portal

| Route | Figma frame | Notes |
| --- | --- | --- |
| `/department` | Department Portal — Dashboard | Four clickable stat boxes (total, assigned, in progress, resolved), search by Tracking ID, status filter, table: Date, Tracking ID, Title, Assigned, Priority, Status, SLA, **Update status** + **Add Update** on every row |
| `/department/needs-attention` | Sidebar item (no Figma screen — see §6) | Overdue and unacknowledged complaints, most overdue first, priority-level filter, search |
| `/department/complaints`, `/assigned`, `/in-progress`, `/resolved` | Sidebar items (no Figma screens) | Filtered lists of the department's own complaints; same row actions as the dashboard |
| `/department/statistics` | Sidebar item (no Figma screen) | Priority-level counts, monthly trend (received vs resolved), resolved rate, overdue count, average time to resolve — this department only |
| `/department/profile` | MANAGE PROFILE | Same form as the other portals |
| *(side menu)* | Department Portal SIDEBAR | Dashboard, Needs Attention, Total Complaints, Assigned, In Progress, Resolved, Statistics, Logout |
| *(pop-ups)* | *(no Figma frame)* | Complaint details (click a Tracking ID) reuse the admin pop-up; **Add update** pop-up writes the message the student reads through View Update |

Rules enforced in the demo (SRS v3 §3–§4): a department only sees complaints assigned to it (a
complaint reassigned by an admin leaves its dashboard immediately); the status dropdown offers only
**In progress** and **Resolved** (never Assigned); there is no Reject or Reassign anywhere; student
identity is never shown; every status change and update message is written to the Activity Log under
the department's name and appears right away on the student's tracker, the Public Dashboard status
and the admin's Master Tracking Queue. Emails are simulated (a toast says who would be notified).

## 5. Project structure

```
src/
  app/
    layout.tsx               root layout: fonts/CSS, demo store, toasts
    (site)/                  public pages with header + footer (landing, about, privacy, terms)
    (auth)/                  login, register, OTP, password recovery (shared photo layout)
    (portal)/                student pages inside PortalShell (header, side menu, guard)
    admin/                   Central Admin Console pages inside AdminShell
    department/              Department Portal pages inside DepartmentShell
    not-found.tsx
  components/                Logo, headers, Footer, Modal, Toast, Icon, StatusBadge, ProfileForm,
                             forms/ (fields, OTP), legal/, portal/ (student shell),
                             admin/ (console shell, stat cards, tables, pop-ups, charts),
                             department/ (shell, queue tables, Add Update pop-up)
  lib/
    types.ts                 Complaint, categories, statuses, departments, priorities, SLA table
    demo-data.ts             DEMONSTRATION DATA (seed generator, admin accounts)
    demo-store.tsx           SIMULATED BACKEND (localStorage; shared by all portals)
    sla.ts                   SLA rules + simulated AI priority
    validation.ts            RTU email, password, evidence, tracking-ID rules
    format.ts                dates (Philippine time), file sizes, badge classes
  styles/globals.css         design tokens from Figma, fonts, shared UI classes
public/
  images/                    RTU Voice logo, campus photos (exported from the Figma file)
  fonts/                     self-hosted Inter, Instrument Sans, Bricolage Grotesque,
                             Playfair, Hedvig Letters Sans, Inria Serif (SIL OFL)
```

To connect a real backend later, replace the functions in `src/lib/demo-store.tsx`
(`login`, `submitComplaint`, `assignComplaint`, `rejectComplaint`, `reassignComplaint`, …) with
Supabase/RPC calls; the pages only talk to that hook.

## 6. Where this build differs from the Figma file — and why

### Student portal

Fixed (clear errors; nothing else about the layout changed):

- "RIZAL **TEHNOLOGICAL** UNIVERSITY" → "TECHNOLOGICAL" (header and footer of every screen).
- Landing "How it works": all four steps were labelled "STEP 1" → STEP 1–4.
- Spelling: "RTIJ", "dashbaord", "INFRASTRACTURE", "Every concerns counts", "tracking D",
  "ADMININISTRATORS", "Al" (for AI), "DO not release", "View Of".
- Forgot Password button said "Login" → **Send Code**. Set New Password button said "Login" →
  **Reset Password**, and its New Password field had an email placeholder.
- Login card footer said "Already have an account? Login" → "Don't have an account? Register".
- Added a **Forgot password?** link on the login card (the SRS requires it; the Figma login screen
  has no way to reach the Forgot Password page).
- The verify screen in the password-recovery flow says "Enter it to reset your password" instead
  of "activate your account".
- Privacy Notice table: Figma marks "Priority level" as visible to **You**, which contradicts the
  note under the same table and the SRS. Shown as not visible.
- "Institute of Computer **Science**" (About chip, footer) → "Computer **Studies**", matching the
  roadmap document and the rest of the site.

Filled in because the Figma had no content:

- Four FAQ answers on the landing page (only "Is it anonymous?" is written in Figma). Drafted
  from the SRS v3 — **review the wording**.
- "[Summary title placeholder]" rows on the landing page now show sample public entries.

### Admin console

Designed here because Figma only has the menu item, not the screen (built in the same style as
the admin list pages, following the roadmap's description):

- **Statistics**, **Activity Log** and **View Admin** pages.
- **Assign department confirmation.** Page 1 has no assign pop-up. Picking a department in the
  row dropdown now opens a confirmation (styled like the admin pop-ups, content from the App screens
  "Assign Department" frame), because assigning approves the complaint and triggers the AI step.

Behaviour decisions where the Figma and the SRS disagree or are silent:

- The Figma "Complaint updates" timeline shows a separate "Approved by Central Admin" entry before
  "Assigned". The SRS says assigning **is** the approval, so the timeline shows one entry.
- "Acknowledged" is taken to mean the department moved the complaint to In Progress.
- **Reassign** is disabled for Resolved complaints. Reassigning returns the complaint to Assigned
  and restarts the SLA clock for the new department.
- The master queue has a department filter (SRS) but, like the Figma table, no department column;
  the department is shown in the details, updates and reassign pop-ups.
- Stat box numbers are calculated from the demo data, so they differ from the Figma sample numbers
  (128 / 34 / 29 / 65). In Figma those three sub-totals add up to exactly 128, which leaves no room
  for the 5 pending complaints shown on the same screen.
- The Figma "Welcome back, Central Admin" frame is empty, so it was not built.

### Department portal

Only two frames exist in the Figma file (the Dashboard and the open sidebar), so the rest follows the
roadmap (Sprint 5) and SRS v3 in the style of the admin pages:

- **Needs Attention** — roadmap says "unacknowledged and overdue", SRS says "overdue". Built as both:
  a complaint is listed when it is overdue (resolve-within window exceeded) **or** still Assigned
  (not yet acknowledged). Overdue first (most days overdue on top), then unacknowledged ones by how
  close/late their acknowledge-within deadline is. Filter by priority level and search by Tracking ID.
- **SLA column** — for Assigned complaints it shows the acknowledge-within clock ("Acknowledge in 1
  day", red "Acknowledgement late by N days" once missed); afterwards the resolve clock ("Resolve in
  5 days", "Overdue by 4 days"), as in the Figma rows.
- **Update status** — acts immediately and shows a toast (no confirm step). Resolved can be set back to
  In progress to correct a mistake (this removes the Resolved step from the timeline). The current
  status is greyed out in the list. Going straight from Assigned to Resolved also fills in the
  In progress step so the student's timeline stays complete.
- **Add Update** — 10–500 characters, lists the department's earlier updates, reminds that it is only
  visible to the student and admins. Not public.
- **Total / Assigned / In progress / Resolved** pages keep the row actions so staff can work from any list.
- **Statistics** — "Resolved rate" is resolved ÷ all complaints assigned to the department.
- Department-head logins are **demo-only** (six fixed accounts, one per office). The department list is
  still pending interviews with the offices, so adding an office means adding it to `DEPARTMENTS`
  (`src/lib/types.ts`) and an account to `DEPARTMENT_ACCOUNTS` (`src/lib/demo-data.ts`).
- The header shows "Department Portal" over the office name, as in Figma; on phones the office name
  moves into the profile menu.

### Both portals

- Mobile and tablet layouts: Page 1 has desktop frames only, so smaller screens were designed from
  the desktop frames. Wide tables turn into stacked cards below 960 px. Checked at 1440, 1280,
  1200, 1100, 1024, 961, 820, 768, 390 and 360 px wide.

Kept as designed, but the team should decide:

- Footer/About/Privacy still show **[PROJECT EMAIL]** and **[PROJECT LEAD EMAIL]** placeholders.
- The auth screens say the platform is "for reporting **harassment**", while the report form and
  Terms say harassment is **not** handled here.
- The landing hero says "three simple steps"; the next section shows four.
- The landing notice "Anonymous submissions may be reviewed slower" conflicts with SRS v3 (login
  is mandatory; there are no anonymous submissions).
- The "RTU" part of the wordmark is dark blue on navy and nearly invisible (footer, student side
  menu, admin header); the "COUNTS." word in the landing hero has the same problem on the photo.
- The public-dashboard opt-out is unchecked by default, so concerns are shared unless the student
  opts out.

Technical limitations:

- Icons are hand-drawn SVGs in the same outline style; the original Figma vector exports could
  not be downloaded from the build environment. The logo and campus photos **are** the original
  Figma images.
- The 5 MB rule, file types, OTP limits, password rules and admin-only access are enforced in the
  browser only. A real build must enforce them on the server (row-level security).
- The AI priority is a keyword rule (`src/lib/sla.ts`), and the public summary is the first
  sentence of the description. Both stand in for the OpenRouter call.
