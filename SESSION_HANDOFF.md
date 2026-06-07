# Krave Microgreens — Session Handoff

> Updated at the end of every work session. Read this first before starting a new session.

---

## Last Completed

- **Items Catalog** (unplanned addition — user requested)
  - `app/actions/catalogItems.ts` — `createCatalogItem`, `updateCatalogItem`, `deleteCatalogItem` (soft-delete)
  - `components/items/CatalogItemModal.tsx` — UOM grouped picker (Weight / Quantity / Volume / Service), HSN code, default rate
  - `components/items/CatalogItemsClient.tsx` — search, UOM colour badges, hover-reveal edit/delete
  - `app/(dashboard)/items/page.tsx` — `/items` route added
  - `Sidebar.tsx` — "Items" nav entry added between Inventory and Invoices (Package2 icon)
  - `InvoiceForm.tsx` — per-row catalog dropdown with search; selecting an item auto-fills **description + UOM + rate** (all editable after)
  - `invoices/new/page.tsx` — parallel fetch of customers + catalog items

- Phase 5: Dashboard & Analytics ✅
- Phase 4: Receivables & Payments ✅
- Phase 3: Invoice Generation ✅
- Phase 2: Inventory Management ✅
- Phase 1: Customer Management ✅
- Phase 0: Infrastructure ✅

---

## ⚠️ ACTION REQUIRED — Run catalog_items SQL in Supabase

**[Open SQL Editor →](https://supabase.com/dashboard/project/eostzwmrakhfbbehytaw/sql/new)**

```sql
create table catalog_items (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  description   text,
  uom           text not null,
  default_price numeric(12,2) not null default 0,
  hsn_code      text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger catalog_items_updated_at
  before update on catalog_items
  for each row execute function update_updated_at();

alter table catalog_items enable row level security;
create policy "Authenticated read/write" on catalog_items
  for all using (auth.role() = 'authenticated');
```

---

## Pending SQL (all phases — run in order if not yet done)

1. **Phase 1** — `customers`
2. **Phase 2** — `inventory_categories`, `inventory_items`, `inventory_transactions`
3. **Phase 3** — `invoices`, `invoice_items`
4. **Phase 4** — `payments`
5. **Items Catalog** — `catalog_items` (see above)

Full SQL for all phases is in **`DATABASE_SCHEMA.md`**.

---

## Next Task

**Phase 6 — Voice Control (Web Speech API)**

- Floating mic button in the app header (visible on all pages)
- Web Speech API `SpeechRecognition` integration (Chrome/Edge only — graceful fallback)
- NLP command parser (regex/keyword matching):
  - `"add 500g sunflower seeds"` → `adjustStock` action
  - `"show low stock"` → navigate to `/inventory`
  - `"new invoice"` → navigate to `/invoices/new`
  - `"outstanding balance"` → navigate to `/receivables`
  - `"go to customers"` → navigate to `/customers`
- Visual feedback: pulse animation while listening, transcript display
- Confirmation toast after command executes
- `/voice` page with command reference card

---

## Next Tasks Queue

1. ✅ Phase 0 — Infrastructure
2. ✅ Phase 1 — Customer Management
3. ✅ Phase 2 — Inventory Management
4. ✅ Phase 3 — Invoice Generation
5. ✅ Phase 4 — Receivables & Payments
6. ✅ Phase 5 — Dashboard & Analytics
7. ✅ Items Catalog (bonus feature)
8. 🔄 **Phase 6 — Voice Control** ← next
9. Phase 7 — Telegram Bot
10. Phase 8 — Polish & Hardening

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
| Catalog dropdown closes on backdrop click | Fixed `z-20` overlay behind `z-30` dropdown |
| Client-side jsPDF | No server-side PDF complexity |
| `line_total` as generated column | `quantity * unit_price` in Postgres |
| Invoice delete = draft only | Sent/paid = financial records |
| Payments update invoice directly | Simpler than triggers |
| Soft delete everywhere | Preserves history |
| Zod v4: `z.enum([...] as const, { error })` | Breaking change from Zod v3 |
| Voice: Web Speech API | Chrome/Edge only — no backend needed |

---

## File Structure (Key Files)

```
KraveBackOffice/
├── app/
│   ├── actions/
│   │   ├── customers.ts       # ✅ Phase 1
│   │   ├── inventory.ts       # ✅ Phase 2
│   │   ├── invoices.ts        # ✅ Phase 3
│   │   ├── payments.ts        # ✅ Phase 4
│   │   └── catalogItems.ts    # ✅ Items Catalog
│   └── (dashboard)/
│       ├── dashboard/page.tsx            # ✅ Phase 5 — live KPIs + chart
│       ├── customers/page.tsx            # ✅ Phase 1
│       ├── inventory/page.tsx            # ✅ Phase 2
│       ├── items/page.tsx                # ✅ Items Catalog
│       ├── invoices/{page,new,[id]}      # ✅ Phase 3
│       ├── receivables/page.tsx          # ✅ Phase 4
│       ├── voice/page.tsx                # ← Phase 6
│       └── settings/page.tsx            # ← Phase 8
├── components/
│   ├── dashboard/RevenueChart.tsx       # ✅ Phase 5
│   ├── customers/ (3 files)             # ✅ Phase 1
│   ├── inventory/ (4 files)             # ✅ Phase 2
│   ├── items/ (2 files)                 # ✅ Items Catalog
│   ├── invoices/ (3 files)              # ✅ Phase 3
│   └── receivables/ (2 files)           # ✅ Phase 4
└── lib/supabase/
    ├── client.ts
    └── server.ts
```

---

*Last updated: 2026-06-07 | Items Catalog complete — Phase 6 Voice Control next*
