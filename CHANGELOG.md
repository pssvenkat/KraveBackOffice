# Krave Microgreens — Changelog

All notable changes to this project are documented here.  
Format: `[Version] — YYYY-MM-DD`  
Types: `feat` · `fix` · `docs` · `style` · `refactor` · `chore`

---

## [0.2.0] — 2026-06-07 · Phase 1: Customer Management

### feat
- `app/actions/customers.ts` — Server Actions: `createCustomer`, `updateCustomer`, `deleteCustomer`
  - Zod schema validation with field-level errors
  - Auth check on every action
  - `revalidatePath('/customers')` for cache invalidation
  - Soft-delete (sets `is_active = false`, never hard-deletes)
- `components/customers/CustomerModal.tsx` — Add/Edit modal
  - Uses `useActionState` + `useFormStatus` (Next.js 16 pattern)
  - Bound `updateCustomer` for edits via `.bind(null, id)`
  - Auto-closes on `state.success`, resets form
  - Click-outside-to-close
  - Inline field-level error display
- `components/customers/CustomersClient.tsx` — Full customer table
  - Client-side search filtering (name, phone, email, city)
  - Avatar initials per customer
  - Contact/Location/GSTIN columns
  - Hover-reveal edit/delete actions
  - Empty state with call-to-action
- `components/customers/DeleteCustomerButton.tsx` — Inline confirm dialog
  - `useTransition` for non-blocking delete
  - Error display if delete fails
- `app/(dashboard)/customers/page.tsx` — Server component
  - Fetches all active customers server-side
  - Graceful error with SQL hint if table doesn't exist yet

### docs
- Updated `DATABASE_SCHEMA.md` — customers table status
- Updated `CHANGELOG.md`, `SESSION_HANDOFF.md`, `ROADMAP.md`

---

## [0.1.0] — 2026-06-07 · Phase 0: Project Setup & Infrastructure

### feat
- Scaffolded Next.js 16.2.7 project with TypeScript, Tailwind CSS v4, App Router
- Added Supabase SSR auth integration (`@supabase/ssr`)
- Created `proxy.ts` for auth route protection (Next.js 16 replaces `middleware.ts`)
- Built premium dark login page with email/password auth, password toggle, error display
- Built app shell: collapsible sidebar with active nav states + sticky header with user avatar
- Created Dashboard page with 4 KPI cards and empty-state panels (low stock, recent invoices)
- Added getting-started guide on dashboard for first-time use
- Created auth callback route handler at `/auth/callback` for Supabase PKCE flow
- Created placeholder pages for all modules: Customers, Inventory, Invoices, Receivables, Voice, Settings

### chore
- Installed dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `jspdf`, `html2canvas`, `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`, `lucide-react`, `clsx`, `tailwind-merge`, `date-fns`
- Configured `.env.local` with Supabase project credentials
- Set up `.env.local.example` template for reference
- Initialized git repository with initial commit
- Connected to GitHub: `https://github.com/pssvenkat/KraveBackOffice`
- Deployed to Vercel: `https://kravebackoffice.vercel.app`

### docs
- Created `PROJECT_OVERVIEW.md` — business context, decisions, success criteria
- Created `ROADMAP.md` — 8-phase build plan with task checklists and progress tracker
- Created `SYSTEM_ARCHITECTURE.md` — full stack, DB schema, routes, voice flows, security
- Created `SESSION_HANDOFF.md` — session-to-session context continuity document
- Created `DATABASE_SCHEMA.md` — full Supabase SQL schema for all phases
- Created `API_SPEC.md` — all API routes, Supabase calls, Telegram webhook spec
- Created `UI_SPEC.md` — design tokens, component patterns, page specs
- Created `CHANGELOG.md` — this file

---

## [Unreleased] — Phase 2: Inventory Management

### Planned
- Create `inventory_categories`, `inventory_items`, `inventory_transactions` tables
- Seed 3 categories: Seeds, Trays, Packing Materials
- Inventory list with 3 tabs (one per category)
- Add / Edit / Delete inventory items
- Stock adjustment modal (add / consume / adjust with note and source)
- Low-stock alerts on dashboard
- Transaction history per item

---

## [Unreleased] — Phase 3: Invoice Generation

### Planned
- Create `invoices`, `invoice_items` tables + auto-numbering (`KM-YYYY-NNN`)
- Invoice list page with status filters
- Invoice creation form with line items builder
- Optional 5% GST per invoice
- Invoice detail / preview page
- PDF export using `jsPDF` + `html2canvas`
- Invoice status workflow: Draft → Sent → Paid / Partial

---

## [Unreleased] — Phase 4: Receivables & Payments

### Planned
- Create `payments` table with trigger to sync `invoices.amount_paid`
- Receivables list with aging buckets (Current / 1–30 / 31–60 / 60+)
- Record payment modal (full/partial, method, reference)
- Payment history per invoice
- Dashboard KPI: total outstanding, overdue count, this month's revenue

---

## [Unreleased] — Phase 5: Dashboard & Analytics

### Planned
- Wire up all KPI cards with live Supabase data
- Monthly revenue bar chart (Recharts)
- Low-stock alerts list (live from inventory)
- Recent invoices list (live)
- Recent transactions list (live)

---

## [Unreleased] — Phase 6: Voice Control (Web Speech API)

### Planned
- Floating mic button in app header
- Web Speech API integration (Chrome/Edge)
- NLP command parser (regex + keyword matching)
- Confirmation toast after successful command
- Voice command help panel

---

## [Unreleased] — Phase 7: Telegram Bot

### Planned
- Create Telegram Bot via @BotFather
- Build `/api/telegram` webhook route
- Text command handlers (`/stock`, `/add`, `/use`, `/lowstock`, `/outstanding`, `/invoice`, `/help`)
- Voice message → Whisper transcription → command parser
- Secure bot with `TELEGRAM_ALLOWED_USER_ID` check

---

## [Unreleased] — Phase 8: Polish & Production Hardening

### Planned
- Responsive design audit (mobile, tablet, desktop)
- Error boundaries and user-friendly error messages
- Loading skeletons for all data fetches
- Form validation (Zod schema everywhere)
- Supabase RLS policy audit
- Vercel Analytics enabled
- Settings page (business info, bank details, invoice defaults)
- Lighthouse score > 85

---

*Last updated: 2026-06-07 | v0.1.0 released*
