# Krave Microgreens — Session Handoff

> Updated at the end of every work session. Read this first before starting a new session.

---

## Last Completed

- **Phase 3: Invoice Generation** — fully built, clean build (14 routes), pushed to GitHub, deploying to Vercel
  - `app/actions/invoices.ts` — `createInvoice` (KM-YYYY-NNN auto-numbering), `updateInvoiceStatus`, `deleteInvoice`
  - `components/invoices/InvoiceForm.tsx` — Dynamic line items, live GST/total calc, JSON-hidden-input pattern
  - `components/invoices/InvoiceDetail.tsx` — Full invoice view, Mark Sent/Paid, client-side jsPDF, delete
  - `components/invoices/InvoicesClient.tsx` — Status tabs, KPI strip, overdue detection
  - `app/(dashboard)/invoices/page.tsx` — Invoice list (server)
  - `app/(dashboard)/invoices/new/page.tsx` — New invoice form (server loads customers)
  - `app/(dashboard)/invoices/[id]/page.tsx` — Invoice detail (dynamic, awaits `Promise<params>`)

- Phase 2: Inventory Management ✅
- Phase 1: Customer Management ✅
- Phase 0: Infrastructure ✅

---

## ⚠️ ACTION REQUIRED — Run Invoice SQL in Supabase

Go to **[Supabase SQL Editor](https://supabase.com/dashboard/project/eostzwmrakhfbbehytaw/sql/new)** and run:

```sql
create table invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  customer_id    uuid not null references customers(id),
  issue_date     date not null,
  due_date       date,
  status         text not null default 'draft'
                   check (status in ('draft','sent','paid','partial')),
  subtotal       numeric(12,2) not null default 0,
  apply_gst      boolean not null default false,
  gst_rate       numeric(5,2) not null default 5,
  gst_amount     numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  amount_paid    numeric(12,2) not null default 0,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger invoices_updated_at
  before update on invoices
  for each row execute function update_updated_at();

alter table invoices enable row level security;
create policy "Authenticated read/write" on invoices
  for all using (auth.role() = 'authenticated');

create table invoice_items (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoices(id) on delete cascade,
  description  text not null,
  unit         text,
  quantity     numeric(12,3) not null default 1,
  unit_price   numeric(12,2) not null default 0,
  line_total   numeric(12,2) generated always as (quantity * unit_price) stored
);

alter table invoice_items enable row level security;
create policy "Authenticated read/write" on invoice_items
  for all using (auth.role() = 'authenticated');
```

---

## Next Task

**Phase 4 — Receivables & Payments**

- Create `payments` table
- Trigger to auto-update `invoices.amount_paid`
- Receivables page: outstanding invoices with aging buckets (Current / 1–30 / 31–60 / 60+)
- Record Payment modal (full/partial, payment method, reference)
- Payment history per invoice
- Dashboard KPI sync

---

## Next Tasks Queue

1. ✅ Phase 0 — Infrastructure
2. ✅ Phase 1 — Customer Management
3. ✅ Phase 2 — Inventory Management
4. ✅ Phase 3 — Invoice Generation
5. 🔄 **Phase 4 — Receivables & Payments** ← next
6. Phase 5 — Dashboard & Analytics (live KPIs, charts)
7. Phase 6 — Voice Control (Web Speech API)
8. Phase 7 — Telegram Bot
9. Phase 8 — Polish & Hardening

---

## Environment

| Key | Value |
|---|---|
| Live URL | https://kravebackoffice.vercel.app |
| GitHub | https://github.com/pssvenkat/KraveBackOffice |
| Supabase Project | https://eostzwmrakhfbbehytaw.supabase.co |
| Local dev | `npm run dev` → http://localhost:3000 |
| Node version | v24.16.0 |
| Next.js version | 16.2.7 |
| Branch | master |

---

## Known Issues / Pending Actions

- [ ] **Run invoices + invoice_items SQL in Supabase** (see above)
- [ ] Run inventory SQL if not done yet (Phase 2)
- [ ] Supabase Auth user invite if not done

---

## Key Technical Decisions (Do Not Change Without Review)

| Decision | Rationale |
|---|---|
| `proxy.ts` (not `middleware.ts`) | Next.js 16 — file AND function must be named `proxy` |
| `params` is `Promise<{id}>` | Next.js 16 — always `await params` in server pages and `generateMetadata` |
| Line items via JSON hidden input | Dynamic arrays can't be serialised cleanly via FormData; JSON in `<input type="hidden">` is the pattern |
| Client-side jsPDF | Avoids server-side PDF complexity; jsPDF runs in browser on "Download PDF" click |
| `line_total` as generated column | `quantity * unit_price` computed in Postgres, avoids drift |
| Invoice delete = draft only | Sent/paid invoices are financial records — cannot be deleted |
| Soft delete customers/inventory | Preserves history |
| Zod v4: `z.enum([...] as const, { error: '...' })` | Breaking change from Zod v3 |
| Tailwind CSS v4 | Uses `@import "tailwindcss"` syntax |
| INR (₹) | Business in India |
| GST 5% optional | Not all customers GST-registered |
| Invoice format | `KM-YYYY-NNN` (e.g. KM-2026-001) |

---

## File Structure (Key Files)

```
KraveBackOffice/
├── app/
│   ├── actions/
│   │   ├── customers.ts                    # ✅ Phase 1
│   │   ├── inventory.ts                    # ✅ Phase 2
│   │   └── invoices.ts                     # ✅ Phase 3
│   └── (dashboard)/
│       ├── customers/page.tsx              # ✅ Phase 1
│       ├── inventory/page.tsx              # ✅ Phase 2
│       ├── invoices/
│       │   ├── page.tsx                    # ✅ Phase 3 — list
│       │   ├── new/page.tsx                # ✅ Phase 3 — create
│       │   └── [id]/page.tsx              # ✅ Phase 3 — detail
│       ├── receivables/page.tsx            # ← Phase 4
│       ├── voice/page.tsx                  # ← Phase 6
│       └── settings/page.tsx              # ← Phase 8
├── components/
│   ├── customers/ (3 files)               # ✅ Phase 1
│   ├── inventory/ (4 files)               # ✅ Phase 2
│   └── invoices/
│       ├── InvoiceForm.tsx                 # ✅ Phase 3
│       ├── InvoiceDetail.tsx               # ✅ Phase 3
│       └── InvoicesClient.tsx              # ✅ Phase 3
└── lib/supabase/
    ├── client.ts
    └── server.ts
```

---

*Last updated: 2026-06-07 | Session: Phase 3 — Invoice Generation complete*
