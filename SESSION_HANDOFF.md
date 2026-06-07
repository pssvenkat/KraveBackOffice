# Krave Microgreens — Session Handoff

> Updated at the end of every work session. Read this first before starting a new session.

---

## Last Completed

- Phase 1: Customer Management — fully built, tested (clean build), pushed to GitHub, deploying to Vercel
  - `app/actions/customers.ts` — Server Actions: `createCustomer`, `updateCustomer`, `deleteCustomer`
  - `components/customers/CustomerModal.tsx` — Add/Edit modal with `useActionState`, Zod validation, auto-close
  - `components/customers/CustomersClient.tsx` — Search/filter table, hover actions (edit/delete)
  - `components/customers/DeleteCustomerButton.tsx` — Inline confirm dialog, soft-delete
  - `app/(dashboard)/customers/page.tsx` — Server-rendered page fetching from Supabase

---

## Current Task

**⚠️ ACTION REQUIRED — Run Supabase SQL before testing Customers page**

Copy the SQL from `DATABASE_SCHEMA.md → Phase 1` and run it in:  
[Supabase SQL Editor](https://supabase.com/dashboard/project/eostzwmrakhfbbehytaw/sql/new)

```sql
create extension if not exists "pgcrypto";

create table customers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text,
  phone         text,
  address       text,
  city          text,
  gstin         text,
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger customers_updated_at
  before update on customers
  for each row execute function update_updated_at();

alter table customers enable row level security;

create policy "Authenticated users can do everything"
  on customers for all
  using (auth.role() = 'authenticated');
```

---

## Next Task

**Phase 2 — Inventory Management**

- Create `inventory_categories`, `inventory_items`, `inventory_transactions` tables
- Seed 3 categories: Seeds, Trays, Packing Materials
- Inventory list with 3 tabs
- Add / Edit / Delete items
- Stock adjustment modal (add / consume / adjust)
- Low-stock indicator (🟢/🟡/🔴)
- Transaction history per item

---

## Next Tasks Queue

1. ✅ Phase 0 — Infrastructure
2. ✅ Phase 1 — Customer Management
3. 🔄 **Phase 2 — Inventory Management** ← next
4. Phase 3 — Invoice Generation (GST 5%, PDF, KM-2026-001)
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

- [ ] **Run customers table SQL in Supabase** (see above — required for Phase 1 to work)
- [ ] Supabase Auth user invite — go to Dashboard → Auth → Users → Invite User
- [ ] Set Supabase Site URL → `https://kravebackoffice.vercel.app` (Auth → URL Configuration)

---

## Key Technical Decisions (Do Not Change Without Review)

| Decision | Rationale |
|---|---|
| `proxy.ts` (not `middleware.ts`) | Next.js 16 — file AND function must be named `proxy` |
| `@supabase/ssr` | Modern SSR-safe Supabase client for App Router |
| Server Actions with `'use server'` | Forms use `useActionState` + `useFormStatus` (Next.js 16 pattern) |
| `revalidatePath('/customers')` | Cache-busts the page after every mutation |
| Soft delete (`is_active = false`) | Preserves history — records never truly deleted |
| Tailwind CSS v4 | Uses `@import "tailwindcss"` syntax |
| INR (₹) currency | Business operates in India |
| GST 5% optional per invoice | Not all customers are GST-registered |
| Invoice format | `KM-YYYY-NNN` (e.g. KM-2026-001) |

---

## File Structure (Key Files)

```
KraveBackOffice/
├── proxy.ts
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                            # → /dashboard redirect
│   ├── login/page.tsx
│   ├── auth/callback/route.ts
│   ├── actions/
│   │   └── customers.ts                    # ✅ Phase 1 Server Actions
│   └── (dashboard)/
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── customers/page.tsx              # ✅ Phase 1 — full CRUD
│       ├── inventory/page.tsx              # ← Phase 2
│       ├── invoices/page.tsx               # ← Phase 3
│       ├── receivables/page.tsx            # ← Phase 4
│       ├── voice/page.tsx                  # ← Phase 6
│       └── settings/page.tsx              # ← Phase 8
├── components/
│   ├── Sidebar.tsx
│   └── customers/
│       ├── CustomerModal.tsx               # ✅ Phase 1
│       ├── CustomersClient.tsx             # ✅ Phase 1
│       └── DeleteCustomerButton.tsx        # ✅ Phase 1
├── lib/supabase/
│   ├── client.ts
│   └── server.ts
├── DATABASE_SCHEMA.md
├── API_SPEC.md
├── UI_SPEC.md
├── CHANGELOG.md
├── ROADMAP.md
├── SYSTEM_ARCHITECTURE.md
└── SESSION_HANDOFF.md
```

---

*Last updated: 2026-06-07 | Session: Phase 1 — Customer Management complete*
