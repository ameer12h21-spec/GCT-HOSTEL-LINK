# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the GCT Hostel Link application plus the base API server infrastructure.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (api-server), Supabase (gct-hostel-link)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/           # Express API server
│   ├── gct-hostel-link/      # GCT Hostel Link React/Vite app
│   └── mockup-sandbox/       # Component preview server
├── lib/                      # Shared libraries
│   ├── api-spec/             # OpenAPI spec + Orval codegen config
│   ├── api-client-react/     # Generated React Query hooks
│   ├── api-zod/              # Generated Zod schemas from OpenAPI
│   └── db/                   # Drizzle ORM schema + DB connection
├── scripts/                  # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

---

## GCT Hostel Link — artifacts/gct-hostel-link

### Project Details
- **Name**: GCT Hostel Link
- **Developer**: Ameer Hamza Arshad
- **Institution**: GCT TEVTA Hostel, Taxila
- **Stack**: React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Supabase
- **Currency**: PKR (formatted via `Intl.NumberFormat`)
- **Theme**: Dark/Light mode toggle (persisted in localStorage)
- **Layout**: Mobile-first responsive

### Supabase Configuration
- **URL**: `VITE_SUPABASE_URL` env var
- **Anon Key**: `VITE_SUPABASE_ANON_KEY` env var
- **SQL Schema**: `artifacts/gct-hostel-link/supabase_schema.sql`
- **Storage bucket**: `profile-photos` (max 3MB, any image format)

### Database Tables
1. `profiles` — All users (admin, teacher, mess_owner, student)
2. `deleted_profiles` — Soft-deleted profiles (admin trash)
3. `attendance` — Daily attendance records (locked after 3 days)
4. `mess_fees` — Monthly mess fees per student (default 7780 PKR)
5. `electricity_bills` — Monthly electricity bills per student
6. `complaints` — Student complaints (anonymous to other students)
7. `deleted_complaints` — Soft-deleted/resolved complaints
8. `audit_logs` — Admin audit trail
9. `admission_settings` — Toggle admissions open/closed

### Roles & Access
- **Admin**: Full access — manages students, staff, attendance, fees, complaints, trash
- **Teacher**: Marks attendance (locks after 3 days), sets electricity bills, views/responds to complaints
- **Mess Owner**: Sets/marks mess fees (global + per-student), views payment history
- **Student**: Views own data, submits complaints (anonymously), uploads profile photo

### Key Business Rules
- Student signup → `status="pending"`, admin approves → `status="active"`
- Staff (admin/teacher/mess_owner) created by admin only with secret key (ADMIN-001, TEACH-001, MESS-001)
- Roll number regex: `/^\d{3}[RS]\d{2,3}$/` (R=morning, S=evening)
- Attendance locks after 3 days; only admin can edit locked records
- Electricity bills are final once set
- Complaints are anonymous to other students; author visible to teacher/admin
- Resolved/cancelled complaints move to `deleted_complaints`
- Footer: "© 2026 Ameer Hamza Arshad — All Rights Reserved | GCT Hostel Link – TEVTA Taxila"

### Pages Implemented

**Public (10 pages)**
- `/` — Landing page (hero, features, stats)
- `/login` — Email + Password login
- `/signup` — Student registration form
- `/admissions` — Admissions status (reads admission_settings)
- `/about` — About the hostel
- `/facilities` — Hostel facilities
- `/how-it-works` — System guide for all roles
- `/support` — Contact & support
- `/privacy` — Privacy policy
- `/terms` — Terms of service

**Admin (8 pages)** — `/admin/*`
- Layout with sidebar
- Home (dashboard stats)
- Students (create/approve/disable/delete)
- Attendance (unlock override)
- Complaints (view/respond)
- Mess Fees (view all)
- Staff (create with secret key)
- Admissions (toggle open/close)
- Trash + Audit (restore/purge deleted records)

**Student (6 pages)** — `/student/*`
- Layout with sidebar
- Home
- Profile (photo upload)
- Attendance
- Mess Fees
- Electricity
- Complaints (anonymous submit + view)

**Teacher (6 pages)** — `/teacher/*`
- Layout with sidebar
- Home
- Students (view list)
- Attendance (mark, 3-day lock)
- Electricity (set bills)
- Complaints (view/respond)
- Mess Fees (view-only)

**Mess Owner (5 pages)** — `/mess/*`
- Layout with sidebar
- Home
- Students (view)
- Fees Management (global + individual fee)
- Payment History
- Profile

### Key Source Files
- `src/App.tsx` — All routes
- `src/lib/supabase.ts` — Supabase client
- `src/lib/auth.ts` — signIn, signUp, signOut, getProfile, updateProfile helpers
- `src/lib/utils.ts` — formatPKR, cn
- `src/hooks/useAuth.tsx` — AuthProvider + useAuth hook
- `src/hooks/useTheme.tsx` — ThemeProvider + useTheme hook
- `src/components/DashboardSidebar.tsx` — Sidebar for all dashboard roles
- `src/components/Navbar.tsx` — Public navigation
- `src/components/Footer.tsx` — Public footer

---

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files during typecheck
- **Project references** — cross-package imports resolve via references

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build`
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes in `src/routes/`, validation via `@workspace/api-zod`, persistence via `@workspace/db`.

### `lib/db` (`@workspace/db`)

Drizzle ORM + PostgreSQL. Production migrations handled by Replit when publishing. Development: `pnpm --filter @workspace/db run push`.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval codegen. Run: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` / `lib/api-client-react`

Generated from OpenAPI spec via Orval.

### `scripts` (`@workspace/scripts`)

Utility scripts. Run: `pnpm --filter @workspace/scripts run <script>`
