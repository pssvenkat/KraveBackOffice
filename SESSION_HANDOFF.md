# Krave Microgreens — Session Handoff

> Updated at the end of every work session. Read this first before starting a new session.

---

## Last Completed

- **Phase 5: Dashboard & Analytics** — live data, Recharts chart, clean build, deployed
  - 6 parallel Supabase queries via `Promise.all`
  - KPI cards: Revenue this month, Outstanding, Overdue (red when >0), Active Customers
  - `RevenueChart`: Recharts BarChart, last 6 months, gradient fills, current month highlighted
  - Low Stock panel: live items at/below reorder level with category icons
  - Recent Invoices panel: last 5 with status dot + amount

- Phase 4: Receivables & Payments ✅
- Phase 3: Invoice Generation ✅
- Phase 2: Inventory Management ✅
- Phase 1: Customer Management ✅
- Phase 0: Infrastructure ✅

---

## ⚠️ PENDING SQL — Run if not already done

All 4 SQL blocks must be run in Supabase (in order):
1. **Phase 1** — `customers` table
2. **Phase 2** — `inventory_categories`, `inventory_items`, `inventory_transactions`
3. **Phase 3** — `invoices`, `invoice_items`
4. **Phase 4** — `payments`

Full SQL for each is in **`DATABASE_SCHEMA.md`** and in each phase's SESSION_HANDOFF entry.

---

## Next Task

**Phase 6 — Voice Control (Web Speech API)**

- Floating mic button in app header (Chrome/Edge only)
- Web Speech API `SpeechRecognition` integration
- NLP command parser (regex/keyword matching):
  - `"add 500g sunflower seeds"` → adjustStock
  - `"show low stock"` → navigate to inventory
  - `"new invoice for [customer]"` → navigate to /invoices/new
  - `"outstanding balance"` → navigate to /receivables
- Confirmation toast after command executes
- Voice command help panel (slash command list)

---

## Next Tasks Queue

1. ✅ Phase 0 — Infrastructure
2. ✅ Phase 1 — Customer Management
3. ✅ Phase 2 — Inventory Management
4. ✅ Phase 3 — Invoice Generation
5. ✅ Phase 4 — Receivables & Payments
6. ✅ Phase 5 — Dashboard & Analytics
7. 🔄 **Phase 6 — Voice Control** ← next
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
| `line_total` as generated column | `quantity * unit_price` in Postgres |
| Invoice delete = draft only | Sent/paid = financial records |
| Payments update invoice directly | Simpler than triggers |
| Soft delete customers/inventory | Preserves history |
| Zod v4: `z.enum([...] as const, { error })` | Breaking change from Zod v3 |
| Voice: Web Speech API | Chrome/Edge only — no backend needed |
| Tailwind CSS v4 | `@import "tailwindcss"` syntax |

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
│       ├── dashboard/page.tsx           # ✅ Phase 5 — live KPIs + chart
│       ├── customers/page.tsx           # ✅ Phase 1
│       ├── inventory/page.tsx           # ✅ Phase 2
│       ├── invoices/{page,new,[id]}     # ✅ Phase 3
│       ├── receivables/page.tsx         # ✅ Phase 4
│       ├── voice/page.tsx               # ← Phase 6
│       └── settings/page.tsx           # ← Phase 8
├── components/
│   ├── dashboard/RevenueChart.tsx      # ✅ Phase 5
│   ├── customers/ (3 files)            # ✅ Phase 1
│   ├── inventory/ (4 files)            # ✅ Phase 2
│   ├── invoices/ (3 files)             # ✅ Phase 3
│   └── receivables/ (2 files)          # ✅ Phase 4
└── lib/supabase/
    ├── client.ts
    └── server.ts
```

---

*Last updated: 2026-06-07 | Session: Phase 5 — Dashboard & Analytics complete*
