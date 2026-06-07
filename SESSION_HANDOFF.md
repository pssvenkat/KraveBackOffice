# Krave Microgreens — Session Handoff

> Updated at the end of every work session. Read this first before starting a new session.

---

## Last Completed

- Phase 2: Inventory Management — fully built, clean build, pushed to GitHub, deploying to Vercel
  - `app/actions/inventory.ts` — Server Actions: `createInventoryItem`, `updateInventoryItem`, `deleteInventoryItem`, `adjustStock`
  - `components/inventory/InventoryItemModal.tsx` — Add/Edit with category radio cards, unit selector, stock/reorder/cost fields
  - `components/inventory/AdjustStockModal.tsx` — Add/Consume/Adjust transaction type selector with note
  - `components/inventory/DeleteInventoryButton.tsx` — Soft-delete with confirm dialog
  - `components/inventory/InventoryClient.tsx` — 3-tab UI (Seeds/Trays/Packing), search, low-stock alert strip, status badges
  - `app/(dashboard)/inventory/page.tsx` — Parallel server fetch, graceful SQL-missing error
  - **Bug fixed**: Zod v4 `z.enum()` requires `as const` tuple + `error` key (not `errorMap`)

- Phase 1: Customer Management — ✅ complete and live

---

## ⚠️ ACTION REQUIRED — Run Inventory SQL in Supabase

Go to **[Supabase SQL Editor](https://supabase.com/dashboard/project/eostzwmrakhfbbehytaw/sql/new)** and run this:

```sql
-- Categories (seeded list)
create table inventory_categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  icon  text
);

insert into inventory_categories (name, icon) values
  ('Seeds', '🌱'),
  ('Trays', '🗂️'),
  ('Packing Materials', '📦');

alter table inventory_categories enable row level security;
create policy "Authenticated read/write" on inventory_categories
  for all using (auth.role() = 'authenticated');

-- Inventory items
create table inventory_items (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid not null references inventory_categories(id),
  name            text not null,
  unit            text not null,
  quantity        numeric(12,3) not null default 0,
  reorder_level   numeric(12,3) not null default 0,
  cost_per_unit   numeric(10,2),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger inventory_items_updated_at
  before update on inventory_items
  for each row execute function update_updated_at();

alter table inventory_items enable row level security;
create policy "Authenticated read/write" on inventory_items
  for all using (auth.role() = 'authenticated');

-- Transaction log
create table inventory_transactions (
  id                uuid primary key default gen_random_uuid(),
  item_id           uuid not null references inventory_items(id),
  transaction_type  text not null check (transaction_type in ('add','consume','adjust')),
  quantity_delta    numeric(12,3) not null,
  quantity_after    numeric(12,3) not null,
  note              text,
  source            text default 'manual' check (source in ('manual','voice','telegram')),
  created_at        timestamptz not null default now()
);

alter table inventory_transactions enable row level security;
create policy "Authenticated read/write" on inventory_transactions
  for all using (auth.role() = 'authenticated');
```

> **Note:** `update_updated_at()` function was created in Phase 1 SQL. If you skipped Phase 1, add it first.

---

## Current Task

**Phase 3 — Invoice Generation** (not yet started)

- Create `invoices`, `invoice_items` tables + invoice number sequence
- Invoice list page with status filters (Draft / Sent / Paid / Partial)
- New invoice form with line item builder
- Optional 5% GST toggle per invoice
- PDF export via `jsPDF`
- Status workflow: Draft → Sent → Paid / Partial

---

## Next Tasks Queue

1. ✅ Phase 0 — Infrastructure
2. ✅ Phase 1 — Customer Management
3. ✅ Phase 2 — Inventory Management
4. 🔄 **Phase 3 — Invoice Generation** ← next
5. Phase 4 — Receivables & Payments
6. Phase 5 — Dashboard & Analytics (live KPIs)
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

- [ ] **Run inventory SQL in Supabase** (see above — required for Phase 2 to work)
- [ ] Supabase Auth user invite still pending if not done
- [ ] `update_updated_at()` function must exist before running inventory SQL (created in Phase 1 SQL)

---

## Key Technical Decisions (Do Not Change Without Review)

| Decision | Rationale |
|---|---|
| `proxy.ts` (not `middleware.ts`) | Next.js 16 — file AND function must be named `proxy` |
| `@supabase/ssr` | SSR-safe Supabase client for App Router |
| Server Actions + `useActionState` | Next.js 16 form pattern — no API routes needed for CRUD |
| `revalidatePath()` | Cache invalidation after every mutation |
| Soft delete (`is_active = false`) | Preserves history |
| Zod v4: `z.enum([...] as const, { error: '...' })` | Breaking change from Zod v3 (`errorMap` → `error`) |
| Tailwind CSS v4 | Uses `@import "tailwindcss"` syntax |
| INR (₹) currency | Business in India |
| GST 5% optional per invoice | Not all customers GST-registered |
| Invoice format | `KM-YYYY-NNN` (e.g. KM-2026-001) |

---

## File Structure (Key Files)

```
KraveBackOffice/
├── proxy.ts
├── app/
│   ├── actions/
│   │   ├── customers.ts                    # ✅ Phase 1
│   │   └── inventory.ts                    # ✅ Phase 2
│   └── (dashboard)/
│       ├── customers/page.tsx              # ✅ Phase 1
│       ├── inventory/page.tsx              # ✅ Phase 2
│       ├── invoices/page.tsx               # ← Phase 3
│       ├── receivables/page.tsx            # ← Phase 4
│       ├── voice/page.tsx                  # ← Phase 6
│       └── settings/page.tsx              # ← Phase 8
├── components/
│   ├── Sidebar.tsx
│   ├── customers/
│   │   ├── CustomerModal.tsx               # ✅ Phase 1
│   │   ├── CustomersClient.tsx             # ✅ Phase 1
│   │   └── DeleteCustomerButton.tsx        # ✅ Phase 1
│   └── inventory/
│       ├── InventoryItemModal.tsx          # ✅ Phase 2
│       ├── AdjustStockModal.tsx            # ✅ Phase 2
│       ├── InventoryClient.tsx             # ✅ Phase 2
│       └── DeleteInventoryButton.tsx       # ✅ Phase 2
└── lib/supabase/
    ├── client.ts
    └── server.ts
```

---

*Last updated: 2026-06-07 | Session: Phase 2 — Inventory Management complete*
