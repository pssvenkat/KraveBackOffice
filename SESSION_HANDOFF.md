# Krave Microgreens — Session Handoff

> Updated at the end of every work session. Read this first before starting a new session.

---

## Last Completed

- **Phase 4: Receivables & Payments** — fully built, clean build, pushed to GitHub, deploying to Vercel
  - `app/actions/payments.ts` — `recordPayment` with overpayment guard, auto invoice status update
  - `components/receivables/RecordPaymentModal.tsx` — UPI/Cash/Bank/Cheque/Other, reference field
  - `components/receivables/ReceivablesClient.tsx` — Aging KPI cards, filter tabs, overdue detection
  - `app/(dashboard)/receivables/page.tsx` — Server page, sent/partial invoices ordered by due date

- Phase 3: Invoice Generation ✅ — `KM-YYYY-NNN`, PDF, status workflow
- Phase 2: Inventory Management ✅ — 3 tabs, stock adjust, low-stock alerts
- Phase 1: Customer Management ✅
- Phase 0: Infrastructure ✅

---

## ⚠️ ACTION REQUIRED — Run Payments SQL in Supabase

Go to **[Supabase SQL Editor](https://supabase.com/dashboard/project/eostzwmrakhfbbehytaw/sql/new)** and run:

```sql
create table payments (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references invoices(id) on delete cascade,
  amount          numeric(12,2) not null,
  payment_method  text not null check (payment_method in ('cash','upi','bank_transfer','cheque','other')),
  reference       text,
  payment_date    date not null,
  notes           text,
  created_at      timestamptz not null default now()
);

alter table payments enable row level security;
create policy "Authenticated read/write" on payments
  for all using (auth.role() = 'authenticated');
```

---

## Next Task

**Phase 5 — Dashboard & Analytics**

Wire up all KPI cards with live Supabase data + Recharts charts:
- Total revenue (this month)
- Outstanding receivables
- Active customers count
- Low-stock items count
- Monthly revenue bar chart (last 6 months)
- Recent invoices list (last 5)
- Low stock alert list

---

## Next Tasks Queue

1. ✅ Phase 0 — Infrastructure
2. ✅ Phase 1 — Customer Management
3. ✅ Phase 2 — Inventory Management
4. ✅ Phase 3 — Invoice Generation
5. ✅ Phase 4 — Receivables & Payments
6. 🔄 **Phase 5 — Dashboard & Analytics** ← next
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

## Key Technical Decisions (Do Not Change Without Review)

| Decision | Rationale |
|---|---|
| `proxy.ts` (not `middleware.ts`) | Next.js 16 convention |
| `params` is `Promise<{id}>` | Always `await params` in server pages + `generateMetadata` |
| Line items via JSON hidden input | Dynamic arrays can't cleanly use FormData |
| Client-side jsPDF | No server-side PDF complexity |
| `line_total` as generated column | `quantity * unit_price` computed in Postgres |
| Invoice delete = draft only | Sent/paid = financial records |
| Payments update invoice directly | Simpler than triggers; avoids RLS trigger edge cases |
| Soft delete customers/inventory | Preserves history |
| Zod v4: `z.enum([...] as const, { error })` | Breaking change from Zod v3 |
| Tailwind CSS v4 | `@import "tailwindcss"` syntax |
| INR (₹), GST 5% optional | India market |
| Invoice format `KM-YYYY-NNN` | Sequential per year |

---

## File Structure (Key Files)

```
KraveBackOffice/
├── app/
│   ├── actions/
│   │   ├── customers.ts     # ✅ Phase 1
│   │   ├── inventory.ts     # ✅ Phase 2
│   │   ├── invoices.ts      # ✅ Phase 3
│   │   └── payments.ts      # ✅ Phase 4
│   └── (dashboard)/
│       ├── dashboard/page.tsx           # ← Phase 5 (live KPIs)
│       ├── customers/page.tsx           # ✅ Phase 1
│       ├── inventory/page.tsx           # ✅ Phase 2
│       ├── invoices/page.tsx            # ✅ Phase 3
│       ├── invoices/new/page.tsx        # ✅ Phase 3
│       ├── invoices/[id]/page.tsx       # ✅ Phase 3
│       ├── receivables/page.tsx         # ✅ Phase 4
│       ├── voice/page.tsx               # ← Phase 6
│       └── settings/page.tsx           # ← Phase 8
├── components/
│   ├── customers/ (3 files)            # ✅ Phase 1
│   ├── inventory/ (4 files)            # ✅ Phase 2
│   ├── invoices/ (3 files)             # ✅ Phase 3
│   └── receivables/ (2 files)          # ✅ Phase 4
└── lib/supabase/
    ├── client.ts
    └── server.ts
```

---

*Last updated: 2026-06-07 | Session: Phase 4 — Receivables & Payments complete*
