# Krave Microgreens — Session Handoff

> Updated at the end of every work session. Read this first before starting a new session.

---

## Last Completed

- **Phase 6: Voice Control** — Web Speech API, header mic button, command center page
  - `hooks/useVoiceRecognition.ts` — SpeechRecognition lifecycle, en-IN, interim results, error handling
  - `components/voice/VoiceCommandEngine.ts` — Regex command parser, 10 destinations, exported command list
  - `components/voice/VoiceButton.tsx` — Header mic: pulse rings while listening, interim speech bubble, toast
  - `components/voice/VoiceCommandCenter.tsx` — `/voice` page: large mic, history log, command reference
  - `app/(dashboard)/layout.tsx` — VoiceButton added to sticky header (auto-hides in Firefox/Safari)
  - **Fix**: SpeechRecognition typed as `any` (browser types not in default tsconfig lib)

- Items Catalog ✅ (bonus feature — per user request)
- Phase 5: Dashboard & Analytics ✅
- Phase 4: Receivables & Payments ✅
- Phase 3: Invoice Generation ✅
- Phase 2: Inventory Management ✅
- Phase 1: Customer Management ✅
- Phase 0: Infrastructure ✅

---

## Voice Commands Reference

| Phrase | Action |
|---|---|
| `"dashboard"` / `"home"` | Navigate to Dashboard |
| `"customers"` | Navigate to Customers |
| `"inventory"` / `"stock"` | Navigate to Inventory |
| `"catalog"` / `"products"` | Navigate to Items Catalog |
| `"new invoice"` / `"create invoice"` | Open New Invoice form |
| `"invoices"` | Navigate to Invoices |
| `"receivables"` / `"outstanding"` / `"unpaid"` | Navigate to Receivables |
| `"low stock"` / `"running low"` | Navigate to Inventory |
| `"settings"` | Navigate to Settings |
| `"help"` / `"commands"` | Navigate to Voice page |

---

## ⚠️ Pending SQL — Run if not already done

Run in order from **[Supabase SQL Editor](https://supabase.com/dashboard/project/eostzwmrakhfbbehytaw/sql/new)**:

1. Phase 1 — `customers`
2. Phase 2 — `inventory_categories`, `inventory_items`, `inventory_transactions`
3. Phase 3 — `invoices`, `invoice_items`
4. Phase 4 — `payments`
5. Items Catalog — `catalog_items`

Full SQL in **`DATABASE_SCHEMA.md`**.

---

## Next Task

**Phase 7 — Telegram Bot**

- Webhook endpoint: `POST /api/telegram/webhook`
- Bot commands:
  - `/start` — greeting + menu
  - `/stock` — list low stock items
  - `/outstanding` — list unpaid invoices + totals
  - `/addstock [item] [qty]` — quick stock adjustment
  - `/revenue` — this month's revenue
- Telegram Bot API via fetch (no heavy SDK)
- Environment variable: `TELEGRAM_BOT_TOKEN`

**Phase 8 — Polish & Hardening**
- Loading skeletons
- Error boundaries
- Mobile responsive tweaks
- SEO meta tags

---

## Next Tasks Queue

1. ✅ Phase 0–5 complete
2. ✅ Items Catalog
3. ✅ Phase 6 — Voice Control
4. 🔄 **Phase 7 — Telegram Bot** ← next
5. Phase 8 — Polish & Hardening

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

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| `proxy.ts` not `middleware.ts` | Next.js 16 convention |
| `params` is `Promise<{id}>` | Always `await params` in server pages |
| Line items via JSON hidden input | Dynamic arrays can't use FormData cleanly |
| Client-side jsPDF | No server PDF complexity |
| Voice: Web Speech API | Chrome/Edge — no backend needed |
| SpeechRecognition typed as `any` | Browser Speech types not in default tsconfig lib |
| VoiceButton renders null if unsupported | Progressive enhancement — no broken UI in Firefox |
| Payments update invoice directly | Simpler than Postgres triggers |
| Soft delete everywhere | Preserves history |
| Zod v4: `z.enum([...] as const, { error })` | Breaking change from Zod v3 |

---

## File Structure (Key Files)

```
KraveBackOffice/
├── hooks/
│   └── useVoiceRecognition.ts        # ✅ Phase 6
├── app/
│   ├── actions/
│   │   ├── customers.ts              # ✅ Phase 1
│   │   ├── inventory.ts              # ✅ Phase 2
│   │   ├── invoices.ts               # ✅ Phase 3
│   │   ├── payments.ts               # ✅ Phase 4
│   │   └── catalogItems.ts           # ✅ Items
│   └── (dashboard)/
│       ├── layout.tsx                # ✅ VoiceButton in header
│       ├── dashboard/page.tsx        # ✅ Phase 5
│       ├── customers/page.tsx        # ✅ Phase 1
│       ├── inventory/page.tsx        # ✅ Phase 2
│       ├── items/page.tsx            # ✅ Items Catalog
│       ├── invoices/ (3 pages)       # ✅ Phase 3
│       ├── receivables/page.tsx      # ✅ Phase 4
│       ├── voice/page.tsx            # ✅ Phase 6
│       ├── settings/page.tsx         # ← Phase 8
│       └── api/telegram/webhook/     # ← Phase 7
├── components/
│   ├── voice/ (3 files)              # ✅ Phase 6
│   ├── dashboard/RevenueChart.tsx    # ✅ Phase 5
│   ├── customers/ (3 files)          # ✅ Phase 1
│   ├── inventory/ (4 files)          # ✅ Phase 2
│   ├── items/ (2 files)              # ✅ Items
│   ├── invoices/ (3 files)           # ✅ Phase 3
│   └── receivables/ (2 files)        # ✅ Phase 4
└── lib/supabase/
    ├── client.ts
    └── server.ts
```

---

*Last updated: 2026-06-07 | Phase 6 — Voice Control complete. Phase 7 (Telegram Bot) next.*
