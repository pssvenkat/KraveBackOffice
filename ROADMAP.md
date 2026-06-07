# Krave Microgreens — Development Roadmap

> Phased build plan. Each phase produces a working, deployable increment.  
> Track progress by checking off items below.

---

## Phase 0 — Project Setup & Infrastructure
**Goal**: Working Next.js app deployed to Vercel, connected to Supabase.  
**Estimated effort**: 1–2 days

### Tasks
- [ ] Initialize Next.js 14 project with App Router + Tailwind CSS
- [ ] Set up GitHub repository
- [ ] Connect repository to Vercel (auto-deploy on push)
- [ ] Create Supabase project, copy connection keys
- [ ] Configure environment variables in Vercel dashboard
- [ ] Set up Supabase Auth (email/password)
- [ ] Create login page with Supabase Auth
- [ ] Protect all routes (redirect to login if unauthenticated)
- [ ] Deploy and verify login works on Vercel

### Deliverable
> Live URL on Vercel with working login screen. No features yet.

---

## Phase 1 — Customer Management
**Goal**: Manage a list of customers used across invoices.  
**Estimated effort**: 1–2 days

### Database
- [ ] Create `customers` table in Supabase
  - `id`, `name`, `phone`, `email`, `billing_address`, `gstin`, `created_at`

### UI
- [ ] Customers list page with search/filter
- [ ] Add customer form (drawer or modal)
- [ ] Edit customer inline or in modal
- [ ] Delete customer (soft delete)
- [ ] Customer detail view (future: invoice history)

### Deliverable
> Fully functional customer management. Data persists in Supabase.

---

## Phase 2 — Inventory Management
**Goal**: Track seeds, trays, and packing materials with low-stock alerts.  
**Estimated effort**: 2–3 days

### Database
- [ ] Create `inventory_categories` table: Seeds, Trays, Packing Materials
- [ ] Create `inventory_items` table
  - `id`, `category_id`, `name`, `unit`, `quantity`, `reorder_level`, `cost_per_unit`, `created_at`, `updated_at`
- [ ] Create `inventory_transactions` table (audit trail)
  - `id`, `item_id`, `type` (add/consume/adjust), `quantity_delta`, `note`, `created_at`

### UI
- [ ] Inventory dashboard with three category tabs
- [ ] Item list with current stock, reorder level indicator (🟢/🟡/🔴)
- [ ] Add item form
- [ ] Edit item (name, unit, reorder level, cost)
- [ ] Stock adjustment modal (add / consume / adjust with note)
- [ ] Transaction history per item
- [ ] Low-stock banner on Dashboard

### Deliverable
> Full inventory CRUD with stock adjustments and low-stock indicators.

---

## Phase 3 — Invoice Generation
**Goal**: Create, save, and export GST-compliant invoices as PDF.  
**Estimated effort**: 3–4 days

### Database
- [ ] Create `invoices` table
  - `id`, `invoice_number`, `customer_id`, `issue_date`, `due_date`, `status` (draft/sent/paid/partial), `subtotal`, `gst_rate`, `gst_amount`, `total`, `notes`, `created_at`
- [ ] Create `invoice_items` table
  - `id`, `invoice_id`, `description`, `unit`, `quantity`, `unit_price`, `line_total`

### Invoice Numbering
- [ ] Auto-generate sequential invoice numbers: `KM-2026-001`, `KM-2026-002`…

### UI
- [ ] Invoice list page (sortable, filterable by status)
- [ ] New invoice form:
  - Select customer from managed list
  - Add multiple line items (description, qty, unit price)
  - Toggle GST (5%) on/off per invoice
  - Auto-calculate subtotal, GST, total
  - Set due date
  - Add notes
- [ ] Invoice detail / preview page
- [ ] Edit invoice (only if status = Draft)
- [ ] Status workflow: Draft → Sent → Paid / Partial

### PDF Export
- [ ] Invoice PDF template with Krave Microgreens branding
  - Business name, address, GSTIN (if applicable)
  - Customer details
  - Line items table
  - GST breakdown
  - Total in INR
  - Payment terms / bank details footer
- [ ] Download PDF button
- [ ] Print button

### Deliverable
> End-to-end invoice creation with PDF download. GST applied optionally.

---

## Phase 4 — Receivables & Payments
**Goal**: Track outstanding money, record payments, identify overdue invoices.  
**Estimated effort**: 1–2 days

### Database
- [ ] Create `payments` table
  - `id`, `invoice_id`, `amount`, `payment_date`, `method` (cash/UPI/bank), `reference`, `note`, `created_at`

### UI
- [ ] Receivables list: all unpaid/partial invoices
- [ ] Aging indicators: Current / 1-30 days / 31-60 days / 60+ days (color-coded)
- [ ] Record payment modal (full or partial)
- [ ] Payment history per invoice
- [ ] Dashboard KPIs:
  - Total outstanding (₹)
  - Number of overdue invoices
  - This month's revenue

### Deliverable
> Full receivables tracking with payment recording and aging view.

---

## Phase 5 — Dashboard & Analytics
**Goal**: At-a-glance business health view.  
**Estimated effort**: 1–2 days

### UI
- [ ] KPI cards: Revenue (month), Outstanding, Overdue, Inventory value
- [ ] Low-stock alerts list (top 5)
- [ ] Recent invoices (last 5)
- [ ] Recent inventory transactions (last 5)
- [ ] Monthly revenue bar chart (using Chart.js or Recharts)

### Deliverable
> Dashboard gives full business snapshot on login.

---

## Phase 6 — Voice Control (Web Speech API)
**Goal**: Hands-free inventory updates in the browser.  
**Estimated effort**: 1–2 days

### Implementation
- [ ] Floating mic button in app header (always visible)
- [ ] Web Speech API integration (Chrome/Edge)
- [ ] NLP command parser (regex + keyword matching):
  - *"Add [qty] [unit] [item name]"* → increase stock
  - *"Use [qty] [unit] [item name]"* → decrease stock
  - *"Show low stock"* → navigate to inventory filtered view
  - *"Create invoice for [customer]"* → open new invoice form
- [ ] Live transcript overlay while listening
- [ ] Confirmation toast: *"Added 200g sunflower seeds ✓"*
- [ ] Voice command help panel (list of supported commands)

### Deliverable
> Say "Add 500 grams sunflower seeds" → inventory updates instantly.

---

## Phase 7 — Telegram Bot Integration
**Goal**: Inventory updates and status queries via Telegram message.  
**Estimated effort**: 2–3 days

### Implementation
- [ ] Create Telegram Bot via @BotFather
- [ ] Build Next.js API route as webhook endpoint (`/api/telegram`)
- [ ] Expose webhook via Vercel (already public)
- [ ] Register webhook URL with Telegram Bot API
- [ ] Command handlers:
  - `/stock` — list current inventory summary
  - `/add [qty] [unit] [item]` — add stock
  - `/use [qty] [unit] [item]` — consume stock
  - `/lowstock` — list items below reorder level
  - `/invoice [customer]` — get last invoice summary for customer
  - `/outstanding` — total outstanding receivables
- [ ] Voice message support: Telegram voice → transcribe → parse command
- [ ] Secure bot (accept messages only from authorized Telegram user ID)

### Deliverable
> Send "add 10 trays" on Telegram → inventory updates. Works from phone without opening browser.

---

## Phase 8 — Polish & Production Hardening
**Goal**: Production-ready quality, performance, and UX.  
**Estimated effort**: 2–3 days

- [ ] Responsive design audit (mobile, tablet, desktop)
- [ ] Error boundaries and user-friendly error messages
- [ ] Loading skeletons for all data fetches
- [ ] Optimistic UI updates
- [ ] Form validation (Zod schema)
- [ ] Row-level security (RLS) policies in Supabase
- [ ] Environment variable audit (no secrets in client)
- [ ] Vercel Analytics enabled
- [ ] Lighthouse performance audit (score > 85)
- [ ] Final favicon, meta tags, og:image for the app

### Deliverable
> App is stable, secure, and polished. Ready for daily use.

---

## Future Phases (Post-MVP)

| Phase | Feature |
|---|---|
| 9 | Production tracking (sowing → harvest → yield log) |
| 10 | Multi-user with role-based access |
| 11 | WhatsApp Business API integration |
| 12 | AI assistant (chat with your business data) |
| 13 | Automated purchase order suggestions |
| 14 | Customer portal (view their invoices online) |

---

## Progress Tracker

| Phase | Status | Deployed |
|---|---|---|
| 0 — Setup & Infrastructure | ✅ Complete | [kravebackoffice.vercel.app](https://kravebackoffice.vercel.app) |
| 1 — Customer Management | ✅ Complete | Auto-deployed via Vercel |
| 2 — Inventory Management | ✅ Complete | Auto-deployed via Vercel |
| 3 — Invoice Generation | ✅ Complete | Auto-deployed via Vercel |
| 4 — Receivables & Payments | ✅ Complete | Auto-deployed via Vercel |
| 5 — Dashboard & Analytics | 🔄 Up next | — |
| 6 — Voice Control (Web Speech) | ⬜ Not started | — |
| 7 — Telegram Bot | ⬜ Not started | — |
| 8 — Polish & Hardening | ⬜ Not started | — |

---

*Last updated: 2026-06-07 | Version: 1.0*
