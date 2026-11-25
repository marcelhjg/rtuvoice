# RTU Voice

RTU Voice is a student concern and feedback management system for Rizal Technological
University – Pasig Campus. It provides portals for students, central administrators,
departments, and the superadmin.

## System overview

- **Students** can register with an RTU email, submit concerns with evidence, track a concern,
  view their history, and optionally share a depersonalized summary on the public dashboard.
- **Administrators** review new concerns, assign or reject them, manage queues, and view
  statistics.
- **Departments** work on their assigned concerns, update statuses, post messages for students,
  and view department-specific statistics.
- **Superadmin** manages staff and student accounts and departments and reviews the activity log.

The application uses Next.js App Router, React, TypeScript, CSS Modules, Supabase Auth and
PostgreSQL RPCs, Resend for email, and OpenRouter for optional AI-assisted complaint analysis.
Application data is not stored in browser `localStorage`.

## Requirements

- Node.js 20.9 or newer (Node.js 22 LTS recommended)
- npm
- A configured Supabase project with the schema, database functions, and access policies expected
  by this application
- A Resend account and verified sender address for OTP and notification email
- An OpenRouter API key if AI-assisted analysis is required

> **Backend setup is separate.** This repository does not include database migrations or seed
> scripts. The required Supabase schema, RPC functions, storage bucket, and policies must be
> provisioned in the Supabase project before the application can perform its data operations.

## Local setup

Run these commands from this project directory:

```bash
npm ci
```

Create a `.env.local` file in the project root:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-server-only-supabase-secret-key

AUTH_COOKIE_SECRET=replace-with-a-random-secret
RESEND_API_KEY=re_your_resend_api_key
MAIL_FROM="RTU Voice <no-reply@your-verified-domain>"
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: include the portal link in notification emails.
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: enables AI-assisted complaint analysis.
OPENROUTER_API_KEY=
# OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
# OPENROUTER_FALLBACK=google/gemma-4-31b-it:free

# Development only. This logs OTPs to the server console; keep false in production.
LOG_OTP=false
```

Generate a random value for `AUTH_COOKIE_SECRET`, for example:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
`AUTH_COOKIE_SECRET`, `RESEND_API_KEY`, `MAIL_FROM`, and `NEXT_PUBLIC_SITE_URL` are required by
the current application. Use the actual project URL and keys from Supabase, and a sender address
verified with Resend.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Do not commit `.env.local` or expose `SUPABASE_SECRET_KEY`, `AUTH_COOKIE_SECRET`, or
`RESEND_API_KEY`. The Supabase secret key is used only by server-side code and bypasses Row Level
Security (RLS). Never prefix it with `NEXT_PUBLIC_`.

## Portals and routes

| Portal | Main routes | Purpose |
| --- | --- | --- |
| Public and authentication | `/`, `/about`, `/privacy`, `/terms`, `/login`, `/register`, `/forgot-password` | Public information, registration, login, and password recovery |
| Student | `/dashboard`, `/report`, `/track`, `/history`, `/public-dashboard`, `/profile` | Submit and follow concerns, manage a profile, and browse shared summaries |
| Central admin | `/admin`, `/admin/complaints`, `/admin/assigned`, `/admin/in-progress`, `/admin/resolved`, `/admin/statistics`, `/admin/admins`, `/admin/profile` | Review and manage complaints, view statistics, and view administrator accounts |
| Department | `/department`, `/department/needs-attention`, `/department/complaints`, `/department/assigned`, `/department/in-progress`, `/department/resolved`, `/department/statistics`, `/department/profile` | Work on complaints assigned to the signed-in department |
| Superadmin | `/superadmin`, `/superadmin/students`, `/superadmin/departments`, `/superadmin/activity`, `/superadmin/profile` | Manage staff and student accounts, departments, and review activity |

Students can register using an `@rtu.edu.ph` email address and verify it with an emailed one-time
code. Staff accounts are provisioned by the superadmin; they do not register through the student
flow. After login, the account role determines the portal destination.

## Application structure

```text
src/
  actions/       Server actions for authentication and portal operations
  app/           App Router routes and layouts for each portal
  components/    Shared UI and portal-specific components
  features/      Feature types, validation, and business logic
  lib/           Supabase clients, email, AI, formatting, and shared utilities
  styles/        Global styles and design tokens
tests/           Vitest tests
```

Portal pages use server-side actions and Supabase RPCs for data operations. The signed-in
Supabase session is used for normal database access; privileged server-side operations use the
secret key. The app expects the database functions called from `src/actions/` to enforce their
own data and role constraints as well as the application checks.

Complaint evidence is uploaded to a private Supabase Storage bucket named `evidence`. Configure
the bucket and the database authorization used for signed download links in the backend project.
If `OPENROUTER_API_KEY` is not set, AI-assisted analysis is unavailable; the rest of the
application can still use the configured Supabase and email services.

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm run test:run` | Run the Vitest suite once |
| `npm test` | Run Vitest in its default mode |
| `npm run lint` | Run ESLint (an ESLint configuration is not currently included in this repository) |

## Security notes

- Authentication, role checks, and data access must be enforced server-side. Do not rely on
  client-side visibility or form validation for authorization.
- Keep the Supabase secret key on the server. It bypasses RLS; privileged operations must verify
  the current user and intended action before using it.
- Keep database RLS policies and RPC authorization aligned with the student, admin, department,
  and superadmin roles.
- `LOG_OTP` prints one-time codes to the server console. Use it only for local development and
  leave it disabled in production.
