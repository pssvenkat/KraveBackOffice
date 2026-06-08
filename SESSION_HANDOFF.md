# Krave Microgreens — Session Handoff

> Updated at the end of every work session. Read this first before starting a new session.

---

## 🎉 ALL PHASES COMPLETE

| Phase | Status | Summary |
|---|---|---|
| 0 — Infrastructure | ✅ | Next.js 16, Supabase, Vercel, auth |
| 1 — Customers | ✅ | CRUD, search, soft-delete |
| 2 — Inventory | ✅ | Categories, items, stock adjust, low-stock |
| 3 — Invoices | ✅ | `KM-YYYY-NNN`, line items, GST, PDF |
| 4 — Receivables | ✅ | Aging buckets, Record Payment |
| 5 — Dashboard | ✅ | Live KPIs, 6-month Recharts chart |
| Items Catalog | ✅ | Product/service catalog with UOM, invoice auto-fill |
| 6 — Voice Control | ✅ | Web Speech API, header mic, command center |
| 7 — Telegram Bot | ✅ | 7 commands, webhook, /addstock |
| 8 — Polish | ✅ | Skeletons, error boundary, mobile sidebar, Settings |

---

## Last Completed

**Phase 8: Polish & Hardening**
- `components/ui/Skeleton.tsx` — `Skeleton`, `SkeletonKpi`, `SkeletonTable`, `SkeletonCard`
- `loading.tsx` files for 6 routes — dashboard, customers, inventory, invoices, receivables, items
- `app/(dashboard)/error.tsx` — error boundary with reset button + digest ID
- `components/layout/MobileSidebar.tsx` — hamburger drawer for mobile screens
- `layout.tsx` — desktop sidebar via `hidden lg:block`, mobile via MobileSidebar
- `app/actions/settings.ts` — `saveSettings` (upsert key-value), `getSettings`
- `components/settings/SettingsForm.tsx` — 3-section settings form
- `app/(dashboard)/settings/page.tsx` — live settings page
- `lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)

---

## ⚠️ Pending SQL — Run ALL of these if not yet done

**[Open Supabase SQL Editor →](https://supabase.com/dashboard/project/eostzwmrakhfbbehytaw/sql/new)**

Run in order (full SQL in `DATABASE_SCHEMA.md`):

1. `customers`
2. `inventory_categories`, `inventory_items`, `inventory_transactions`
3. `invoices`, `invoice_items`
4. `payments`
5. `catalog_items`
6. `app_settings` ← **NEW**

```sql
-- app_settings table
create table app_settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);
alter table app_settings enable row level security;
create policy "Authenticated read/write" on app_settings
  for all using (auth.role() = 'authenticated');

insert into app_settings (key, value) values
  ('business_name', 'Krave Microgreens'),
  ('gstin', ''), ('address', ''), ('phone', ''), ('email', ''),
  ('bank_name', ''), ('account_number', ''), ('ifsc_code', ''), ('upi_id', ''),
  ('invoice_prefix', 'KM'), ('invoice_notes', 'Thank you for your business!')
on conflict (key) do nothing;
```

---

## ⚠️ Telegram Bot Setup (if not done)

1. `@BotFather` → `/newbot` → copy token
2. [Vercel env vars](https://vercel.com/pssvenkat/kravebackoffice/settings/environment-variables):
   - `TELEGRAM_BOT_TOKEN` = your token
   - `TELEGRAM_WEBHOOK_SECRET` = `kravebot2024`
3. Redeploy on Vercel
4. Register webhook in browser:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://kravebackoffice.vercel.app/api/telegram/webhook&secret_token=kravebot2024
   ```

---

## If Starting a New Session

All 8 phases are complete. Future work could include:
- PDF improvements (bank details, logo, UPI QR code from settings)
- Customer-wise invoice history page
- Date-range filter on invoices/receivables
- Export to Excel / CSV
- Multi-user roles (owner vs staff)
- WhatsApp Business API integration

---

## Environment

| Key | Value |
|---|---|
| Live URL | https://kravebackoffice.vercel.app |
| GitHub | https://github.com/pssvenkat/KraveBackOffice |
| Supabase | https://eostzwmrakhfbbehytaw.supabase.co |
| Node | v24.16.0 |
| Next.js | 16.2.7 |
| Branch | master |

---

*Last updated: 2026-06-08 | ALL 8 PHASES COMPLETE 🎉*
