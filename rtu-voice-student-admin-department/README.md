# RTU Voice — Frontend (Student, Admin, Department and Superadmin portals)

Frontend for **RTU VOICE: An AI-Assisted Student Concern and Feedback Management System for
Rizal Technological University – Pasig Campus**, built from the Group 4Voices Figma high-fidelity
design (Page 1: student screens and Central Admin Console screens) and the SRS.

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

1. Get the code and open the app folder (the app lives in this subfolder, not the repo root):
   ```bash
   git clone https://github.com/marcelhjg/rtuvoice.git
   cd rtuvoice/rtu-voice-student-admin-department
   ```
2. Open that folder in VS Code (**File → Open Folder…**) and a terminal (**Terminal → New Terminal**).
3. Install dependencies (first time only, needs internet):
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open **http://localhost:3000** in your browser.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Serve the production build on port 3000 (run `npm run build` first) |
| `npm run typecheck` | TypeScript check only |

## 3. Demo accounts and test data

One login page serves all four portals (SRS "unified login"): the account's role decides where you
land (student `/dashboard`, admin `/admin`, department `/department`, superadmin `/superadmin`).

| What | Value |
| --- | --- |
| **Student** | Any `@rtu.edu.ph` email with the demo password **`rtuvoice123`**. `juan.cruz@rtu.edu.ph` is the Figma sample student "Juan Dela Cruz" and owns the sample complaints below. |
| **Admin** | `admin@rtu.edu.ph`, `ics.admin@rtu.edu.ph`, `osa.admin@rtu.edu.ph` — use demo password **`rtuvoice123`**. Admin accounts cannot register; the Super Admin creates them. |
| **Superadmin** | `superadmin@rtu.edu.ph` — demo password **`rtuvoice123`**. A separate, deliberately small portal at `/superadmin`: **Accounts** (create and deactivate admin and department accounts — one active, shared account per department, used by its head and staff), **Departments** (add, rename, deactivate) and the superadmin-only **Activity Log**. It has none of the admin console's complaint pages. |
| **Department** | One shared account per department: `facilities@rtu.edu.ph` (Facilities Office), `registrar@rtu.edu.ph`, `academic@rtu.edu.ph`, `osa@rtu.edu.ph` (Student Affairs), `cashier@rtu.edu.ph`, `ict@rtu.edu.ph` — use demo password **`rtuvoice123`**. Each account only sees its own department's complaints. Cannot register; the superadmin creates them. |
| One-time code (register, forgot password) | **`123456`** — no email is sent |
| Student's sample tracking IDs | `STU-A3F1B` (In Progress, has a department update), `STU-K92QD` (Resolved), `STU-77MZP` (Assigned, overdue), `STU-B04XR` (Rejected), `STU-M5T8C` (Resolved) |

All portals share one complaint list. Try this: log in as the student and submit a concern →
log out → log in as `admin@rtu.edu.ph` → assign it from the Pending Validation Queue → log back in
as the student and track it. The Assigned status, department and timeline show up immediately.
Then log in as that department's head (e.g. `facilities@rtu.edu.ph`), set the status to In progress or
Resolved and use **Add Update**; the student sees both on the Status Tracker (**View Update**) and the
admin sees them in **View Updates**; the superadmin sees the assignment and status changes in the Activity Log.

Sample dates are generated relative to the day you first open the site, so SLA timers
("Acknowledge in 1 day", "Overdue by 4 days") stay realistic. To reset all demo data, clear the
site's local storage (DevTools → Application → Local Storage → delete `rtu-voice-demo-v3`), or open
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
| `/report` | REPORT A CONCERN | Validation, 5 categories, evidence drag-and-drop (JPG/PNG/PDF/MP3/WAV/MP4, 5 MB total), **opt-in** "Share a summary on the public dashboard" checkbox (unticked by default) |
| `/report/submitted?id=` | Frame (receipt) | Copy-to-clipboard tracking ID |
| `/track?id=` | STATUS TRACKER + update pop-up | Format check, not-found state, timeline, View Update dialog; only your own complaints |
| `/history` | History | Table on desktop, cards on mobile; IDs link to the tracker |
| `/public-dashboard` | Public Dashboard | Approved complaints whose student chose to share them; status/category filters, pagination |
| `/profile` | MANAGE PROFILE | Edit name, locked email, change password with rules |

Priority levels are never shown anywhere in the student portal (SRS §1).

### Central Admin Console

| Route | Figma frame | Notes |
| --- | --- | --- |
| `/admin` | Admin HOME — Pending Validation Queue | Clickable stat boxes; search and Newest/Oldest sort; **Assign** dropdown per row (assigning = approval, then the simulated AI sets priority + public summary); **Reject** with a required reason |
| `/admin?tab=master` | Admin HOME — Master Tracking Queue | Search, status and department filters, priority, SLA ("Acknowledge in…", "Resolve in…", "Overdue by…"), **View Updates**, **Reassign** |
| *(pop-ups)* | Complaint details · Reject complaint · Reassign complaint · Update from the department · Log out | **Tracking ID** opens Complaint details (description, evidence, SLA box). The row's **View Updates** opens the department's update messages directly. Reassign needs a new department and a reason |
| `/admin/complaints` | Total complaints | Department filter (incl. "Not assigned"), sort, pagination (8 per page) |
| `/admin/assigned` | Assigned | Priority, Acknowledge by, Resolve by (red when overdue) |
| `/admin/in-progress` | In progress | Priority, Acknowledged, Resolve by |
| `/admin/resolved` | Resolved | Priority, Resolved in N days (late ones flagged) |
| `/admin/statistics` | *(no Figma screen — see §6)* | Resolve rate, overdue count, average time to resolve; bar charts by category, department, priority; monthly trend; department filter; every chart has a table view |
| `/admin/admins` | *(no Figma screen — see §6)* | View Admin: administrator accounts (read-only; the superadmin creates and deactivates them) |
| `/admin/profile` | MANAGE PROFILE | Same form as the student profile |
| *(side menu)* | Admin SIDEBAR variants | White menu with yellow active item, Logout at the bottom |

### Department Portal

| Route | Figma frame | Notes |
| --- | --- | --- |
| `/department` | Department Portal — Dashboard | Four clickable stat boxes (total, assigned, in progress, resolved), search by Tracking ID, status filter, table: Date, Tracking ID, Title, Assigned, Priority, Status, SLA, then **View updates**, **Update status** and **Add Update** on every row (a 🔒 Locked chip once Resolved) |
| `/department/needs-attention` | Sidebar item (no Figma screen — see §6) | Overdue and unacknowledged complaints, most overdue first, priority-level filter, search |
| `/department/complaints`, `/assigned`, `/in-progress`, `/resolved` | Sidebar items (no Figma screens) | Filtered lists of the department's own complaints; same row actions as the dashboard |
| `/department/statistics` | Sidebar item (no Figma screen) | Priority-level counts, monthly trend (received vs resolved), resolved rate, overdue count, average time to resolve — this department only |
| `/department/profile` | MANAGE PROFILE | Same form as the other portals |
| *(side menu)* | Department Portal SIDEBAR | Dashboard, Needs Attention, Total Complaints, Assigned, In Progress, Resolved, Statistics, Logout |
| *(pop-ups)* | *(no Figma frame)* | Complaint details (click a Tracking ID) reuse the admin pop-up; status-change confirmation; **Add update** pop-up (then a "Post this update?" confirmation) writes the message the student reads through View Update |

Rules enforced in the demo (SRS §2–§4): a department only sees complaints assigned to it (a
complaint reassigned by an admin leaves its dashboard immediately); status moves strictly
**Assigned → In progress → Resolved** — the dropdown offers only the next step, each change asks for
confirmation, nothing can be skipped or moved backward, and Resolved is locked (no status change, no
updates); there is no Reject or Reassign anywhere; student identity is never shown; every status
change is written to the Activity Log under the department's name; status changes and update
messages appear right away on the student's tracker, the Public Dashboard status and the admin's
Master Tracking Queue. Emails are simulated (a toast says who would be notified).

### Superadmin Portal

A single superadmin account with a deliberately limited scope (SRS §3; **reactivate** was added at the
group's request, the SRS lists only deactivate), kept small because of the
project timeline. The superadmin has none of the admin console's complaint pages.

| Route | Notes |
| --- | --- |
| `/superadmin` | **Accounts page + Account Management**: lists every admin and department account; **create** (an admin, or the one active shared account of a department that has none), **deactivate** and **reactivate** (each asks for confirmation). A department whose account was deactivated can get a new one; an old department account can be reactivated only if its department is active and has no other active account. The last active admin can't be deactivated. The status filter starts on Active |
| `/superadmin/departments` | **Department Management**: **add**, **rename** (moves the department's complaints and account to the new name), **deactivate** (blocked while it has Assigned or In Progress complaints; a deactivated department disappears from Assign/Reassign and its account can't log in) and **reactivate** (it can receive complaints again and its active account can log in again). About 5 departments are expected; the final list is not yet set |
| `/superadmin/activity` | **Activity Log** (superadmin-only): assignments, reassignments and status changes (including rejections) made by admins and departments; filters by action and actor. Department update messages are not logged |
| `/superadmin/profile` | Manage Profile (from the profile menu) |

Out of scope (future work, per the SRS): account activity log, category and SLA editing, AI settings,
retention controls, system-wide statistics and emergency override.

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
    superadmin/              Superadmin Portal pages inside SuperadminShell
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
  fonts/                     self-hosted Inter, Bricolage Grotesque, Playfair (SIL OFL)
```

To connect a real backend later, replace the functions in `src/lib/demo-store.tsx`
(`login`, `submitComplaint`, `assignComplaint`, `rejectComplaint`, `reassignComplaint`, …) with
Supabase/RPC calls; the pages only talk to that hook. The comments on each function give the SRS rule
it implements. Every rule must also be enforced on the server: the checks in the browser are not
security.

### Evidence files (for the backend developer)

The demo keeps only each file's name, size and type. The **Open** and **Download** buttons in
Complaint details (every portal) already call `getEvidenceUrl()` in `src/lib/evidence.ts`; today
they show a "this demo doesn't store the files" message because no file has a `path`. To make
them work:

1. **Upload through a server route, not straight from the browser.** The route checks the type
   (by content, not just the extension) and the 5 MB total, removes metadata, then saves each file
   to the private bucket `evidence` as `<complaint id>/<random>.<ext>`. Never use the student's file name in
   the path. Save that path as `EvidenceFile.path`.
2. **Remove metadata before saving.** Photos can carry GPS location and device details (EXIF), and
   PDFs and media files can carry the author's name. For example, `sharp` drops image metadata unless
   you ask it to keep it, and `ffmpeg -map_metadata -1` drops it from audio and video. Nothing
   can anonymize a voice. The report form already warns students about this.
3. **Fill in `getEvidenceUrl()`** with `supabase.storage.from("evidence").createSignedUrl(path, 60, …)`
   (the exact call is in the comment there). Keep the expiry short: anyone with the link can use it
   until it expires.
4. **Let storage RLS decide who can read a file**: the student who owns the complaint, active
   admins, and the active account of the department it is assigned to. Not the superadmin (out of scope).
5. **Delete the files when the complaint is purged** (rejected complaints after 1 month). Deleting the
   database row does **not** delete storage objects.

Staff already see files as "Evidence 1", "Evidence 2"… (and downloads are named
`STU-XXXXX-evidence-1.jpg`), because a file name can identify the student. Decide as a group whether
staff should be allowed to **Download** at all: a downloaded copy stays on their device after the
1-month purge. Remove the button in `ComplaintStatusDetails.tsx` if not.

Sketch of the bucket and read policy. **The table and column names are assumptions** (`complaints`,
`profiles`); change them to match the real schema.

```sql
-- Private bucket. 5 MB cap per object; the upload route checks the 5 MB total per complaint.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 5242880,
        array['image/jpeg', 'image/png', 'application/pdf', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'video/mp4']);

-- Signing a link needs SELECT on the object. No INSERT/UPDATE/DELETE policies: only the
-- server route (service role) writes or deletes files.
create policy "evidence read: owner, admins, assigned department"
on storage.objects for select to authenticated
using (
  bucket_id = 'evidence'
  and exists (
    select 1
    from public.complaints c
    join public.profiles p on p.id = auth.uid()
    where c.id::text = (storage.foldername(name))[1]
      and p.active
      and (
        c.student_id = auth.uid()
        or p.role = 'admin'
        or (p.role = 'department' and c.department = p.department)
      )
  )
);
```

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

- **Statistics** and **View Admin** pages (and the **Activity Log**, now in the Superadmin Portal).
- **Assign department confirmation.** Page 1 has no assign pop-up. Picking a department in the
  row dropdown now opens a confirmation (styled like the admin pop-ups, content from the App screens
  "Assign Department" frame), because assigning approves the complaint and triggers the AI step.

Behaviour decisions where the Figma and the SRS disagree or are silent:

- The Figma "Complaint updates" timeline shows a separate "Approved by Central Admin" entry before
  "Assigned". The SRS says assigning **is** the approval, so the timeline shows one entry.
- "Acknowledged" is taken to mean the department moved the complaint to In Progress.
- **Reassign** is only possible while the complaint is Assigned (SRS §4) — and, stricter than the
  SRS, only until the department posts its first update message. Reassigning keeps it Assigned and
  restarts the SLA clock for the new department.
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
- **Update status** — only the next step is offered (Assigned → In progress → Resolved), with a
  confirmation before the change; Cancel leaves the status as it was. No skipping, no going back,
  Resolved is final (SRS §2 step 5).
- **Add Update** — 10–500 characters, lists the department's earlier updates, then a "Post this
  update?" confirmation; it is only visible to the student and admins, never public, and posts once
  even on a double click. Not available once Resolved.
- **Total / Assigned / In progress / Resolved** pages keep the row actions so staff can work from any list.
- **Statistics** — "Resolved rate" is resolved ÷ all complaints assigned to the department.
- Departments and their accounts are managed in the **Superadmin Portal** (one shared account per
  department, used by its head and staff). The six offices in `DEPARTMENTS` (`src/lib/types.ts`) and
  `DEPARTMENT_ACCOUNTS` (`src/lib/demo-data.ts`) are only the demo's starting data; the final list is
  pending interviews with the offices.
- The header shows "Department Portal" over the office name, as in Figma; on phones the office name
  moves into the profile menu.

### Both portals

- Mobile and tablet layouts: Page 1 has desktop frames only, so smaller screens were designed from
  the desktop frames. Wide tables turn into stacked cards below 960 px. The minimum supported width
  is **320 px** (WCAG 2.1 Reflow); every page and dialog was checked at 320, 360, 375, 390, 414, 480,
  600, 768, 820, 1024, 1280, 1440 and 1920 px with nothing cut off or scrolling sideways.

Still for the team to decide:

- **Public dashboard sharing is opt-in** (unticked by default). The SRS describes an *opt-out*
  checkbox. Opt-in matches the "identity-shielded" promise better; if the group follows the SRS,
  revert the "Make public dashboard sharing opt-in" commit or update the SRS.
- **"Voice" in the logo is `#EFB41F`**, as requested. On the white header that is 1.87:1 contrast,
  below WCAG's 3:1 for large text — the only remaining accessibility finding.
- **SRS conflict on acknowledgement:** §2 says assignment *counts as* the department's
  acknowledgement, but §3 and §5 show an "acknowledge within" indicator that can turn overdue. The
  demo treats moving to In Progress as the acknowledgement. The group must pick one before the
  backend computes SLAs.
- **View Updates (admin):** SRS §3 says it shows the dates of status changes *and* the update
  messages; it currently shows the update messages only, as requested.

Technical limitations:

- Icons are hand-drawn SVGs in the same outline style; the original Figma vector exports could
  not be downloaded from the build environment. The logo and campus photos **are** the original
  Figma images.
- The 5 MB rule, file types, OTP limits, password rules, role access, one account per department
  and the status order are enforced in the browser only. A real build must enforce them on the
  server (row-level security). The password also requires 8+ characters, which the SRS doesn't ask for.
- Not simulated at all: the 30-day purge of rejected complaints and the 1-year anonymization (SRS §6).
- The AI priority is a keyword rule (`src/lib/sla.ts`), and the public summary is the first
  sentence of the description — so in the demo the "public" summary is **not** depersonalized. Both
  stand in for the OpenRouter call, which must depersonalize the title and summary.
