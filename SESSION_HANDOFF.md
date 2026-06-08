# Krave Microgreens — Session Handoff

> Updated at the end of every work session. Read this first before starting a new session.

---

## Last Completed

- **Phase 7: Telegram Bot** — webhook + 7 commands, clean build, deployed
  - `lib/telegram/bot.ts` — `sendMessage`, MarkdownV2 `esc()`, `TelegramUpdate` type
  - `lib/telegram/commands.ts` — 7 command handlers
  - `app/api/telegram/webhook/route.ts` — POST handler, secret header validation

- Phase 6: Voice Control ✅
- Items Catalog ✅
- Phase 5: Dashboard & Analytics ✅
- Phase 4: Receivables & Payments ✅
- Phase 3: Invoice Generation ✅
- Phase 2: Inventory Management ✅
- Phase 1: Customer Management ✅
- Phase 0: Infrastructure ✅

---

## Telegram Bot Commands

| Command | Description |
|---|---|
| `/start` | Welcome message + full command menu |
| `/help` | Show command list |
| `/stock` | Low stock alerts (items at/below reorder level) |
| `/outstanding` | Unpaid invoices with overdue flags + grand total |
| `/revenue` | This month's paid invoice revenue |
| `/addstock [name] [qty]` | Add inventory (partial name match, logs transaction) |
| `/customers` | Active customer count |

---

## ⚠️ Telegram Setup Required (one-time)

### Step 1 — Create bot
1. Telegram → `@BotFather` → `/newbot` → copy **Bot Token**

### Step 2 — Add Vercel env vars
Go to [Vercel → Environment Variables](https://vercel.com/pssvenkat/kravebackoffice/settings/environment-variables):
```
TELEGRAM_BOT_TOKEN       = <token from BotFather>
TELEGRAM_WEBHOOK_SECRET  = kravebot2024
```
Then **redeploy** (Vercel → Deployments → Redeploy latest).

### Step 3 — Register webhook (run once in browser)
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://kravebackoffice.vercel.app/api/telegram/webhook&secret_token=kravebot2024
```
Should return `{"ok":true,"description":"Webhook was set"}`

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

**Phase 8 — Polish & Hardening**

- Loading skeletons for all data-heavy pages (Dashboard, Invoices, Inventory, Receivables)
- Error boundaries with friendly fallback UI
- Mobile responsive tweaks (sidebar collapse / hamburger menu)
- Global toast notifications system
- Settings page (business name, GST number, bank details for invoices)
- SEO: meta descriptions for all pages

---

## Next Tasks Queue

1. ✅ Phase 0–6 complete
2. ✅ Items Catalog (bonus)
3. ✅ Phase 7 — Telegram Bot
4. 🔄 **Phase 8 — Polish & Hardening** ← next

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
| Telegram via raw fetch | No SDK dependency needed |
| MarkdownV2 `esc()` helper | Telegram requires escaping `_ * [ ] ( ) ~ > # + - = \| { } . !` |
| Webhook secret header | Protects against random POSTs to webhook URL |
| `/stock` filters client-side | PostgREST can't compare two columns directly |
| SpeechRecognition typed as `any` | Browser types not in default tsconfig lib |
| Regex `[\s\S]*` not `.*s` | `s` flag (dotAll) requires ES2018 target |
| Line items via JSON hidden input | Dynamic arrays can't use FormData cleanly |
| Soft delete everywhere | Preserves history |
| Zod v4: `z.enum([...] as const, { error })` | Breaking change from Zod v3 |

---

## File Structure (Key Files)

```
KraveBackOffice/
├── hooks/
│   └── useVoiceRecognition.ts         # ✅ Phase 6
├── lib/
│   ├── supabase/{client,server}.ts    # ✅ Phase 0
│   └── telegram/
│       ├── bot.ts                     # ✅ Phase 7
│       └── commands.ts                # ✅ Phase 7
├── app/
│   ├── api/telegram/webhook/route.ts  # ✅ Phase 7
│   ├── actions/
│   │   ├── customers.ts               # ✅ Phase 1
│   │   ├── inventory.ts               # ✅ Phase 2
│   │   ├── invoices.ts                # ✅ Phase 3
│   │   ├── payments.ts                # ✅ Phase 4
│   │   └── catalogItems.ts            # ✅ Items
│   └── (dashboard)/
│       ├── layout.tsx                 # ✅ VoiceButton in header
│       ├── dashboard/page.tsx         # ✅ Phase 5
│       ├── customers/page.tsx         # ✅ Phase 1
│       ├── inventory/page.tsx         # ✅ Phase 2
│       ├── items/page.tsx             # ✅ Items Catalog
│       ├── invoices/ (3 pages)        # ✅ Phase 3
│       ├── receivables/page.tsx       # ✅ Phase 4
│       ├── voice/page.tsx             # ✅ Phase 6
│       └── settings/page.tsx          # ← Phase 8
└── components/
    ├── voice/ (3 files)               # ✅ Phase 6
    ├── dashboard/RevenueChart.tsx     # ✅ Phase 5
    ├── customers/ (3 files)           # ✅ Phase 1
    ├── inventory/ (4 files)           # ✅ Phase 2
    ├── items/ (2 files)               # ✅ Items
    ├── invoices/ (3 files)            # ✅ Phase 3
    └── receivables/ (2 files)         # ✅ Phase 4
```

---

*Last updated: 2026-06-08 | Phase 7 — Telegram Bot complete. Phase 8 (Polish) next.*
