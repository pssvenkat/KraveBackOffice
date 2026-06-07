# Krave Microgreens — Session Handoff

> Updated at the end of every work session. Read this first before starting a new session.

---

## Last Completed

- Phase 0: Full project infrastructure setup
  - Next.js 16.2.7 scaffolded with TypeScript, Tailwind CSS, App Router
  - Supabase auth wired up (`proxy.ts` route protection — Next.js 16 convention)
  - Premium dark login page with email/password auth
  - App shell: Sidebar navigation + sticky header + dashboard layout
  - Dashboard page with KPI cards and empty-state panels
  - Placeholder pages: Customers, Inventory, Invoices, Receivables, Voice, Settings
  - Auth callback route (`/auth/callback`)
  - Clean production build — zero warnings
  - Deployed to Vercel: https://kravebackoffice.vercel.app
  - Source pushed to GitHub: https://github.com/pssvenkat/KraveBackOffice

---

## Current Task

**Phase 1 — Customer Management** (not yet started)

- Create `customers` table in Supabase
- Customers list page with search/filter
- Add / Edit / Delete customer (modal or drawer)
- Customer detail view (future: invoice history)

---

## Next Tasks

1. Phase 2 — Inventory Management (seeds, trays, packing materials + low-stock alerts)
2. Phase 3 — Invoice Generation (GST 5%, PDF export, KM-2026-001 numbering)
3. Phase 4 — Receivables & Payments (aging, partial payments)
4. Phase 5 — Dashboard & Analytics (live KPIs, charts)
5. Phase 6 — Voice Control (Web Speech API)
6. Phase 7 — Telegram Bot integration
7. Phase 8 — Polish & Production Hardening

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

- [ ] Supabase Auth user not yet created — owner needs to go to Supabase Dashboard → Authentication → Users → Invite User, then set Site URL to `https://kravebackoffice.vercel.app`
- [ ] No database tables created yet — Supabase schema setup begins in Phase 1
- [ ] Tailwind v4 is installed — uses `@import "tailwindcss"` syntax (not `@tailwind base/components/utilities`)

---

## Key Technical Decisions (Do Not Change Without Review)

| Decision | Rationale |
|---|---|
| `proxy.ts` (not `middleware.ts`) | Next.js 16 renamed middleware to proxy — file AND function must be named `proxy` |
| `@supabase/ssr` (not `@supabase/auth-helpers-nextjs`) | Modern SSR-safe Supabase client for Next.js App Router |
| Tailwind CSS v4 | Installed by create-next-app; uses new `@import` syntax |
| INR (₹) currency | Business operates in India |
| GST 5% optional per invoice | Not all customers are GST-registered |
| Sequential invoice numbers | Format: `KM-YYYY-NNN` (e.g. KM-2026-001) |

---

## File Structure (Key Files)

```
KraveBackOffice/
├── proxy.ts                          # Auth route protection (Next.js 16)
├── app/
│   ├── layout.tsx                    # Root layout (Inter font, dark bg)
│   ├── globals.css                   # Global styles + design tokens
│   ├── page.tsx                      # Root → redirects to /dashboard
│   ├── login/page.tsx                # Login page (Supabase auth)
│   ├── auth/callback/route.ts        # Supabase PKCE callback handler
│   └── (dashboard)/
│       ├── layout.tsx                # App shell (sidebar + header)
│       ├── dashboard/page.tsx        # Dashboard KPI page
│       ├── customers/page.tsx        # Placeholder → Phase 1
│       ├── inventory/page.tsx        # Placeholder → Phase 2
│       ├── invoices/page.tsx         # Placeholder → Phase 3
│       ├── receivables/page.tsx      # Placeholder → Phase 4
│       ├── voice/page.tsx            # Placeholder → Phase 6
│       └── settings/page.tsx         # Placeholder → Phase 8
├── components/
│   └── Sidebar.tsx                   # Navigation sidebar
├── lib/
│   └── supabase/
│       ├── client.ts                 # Browser Supabase client
│       └── server.ts                 # Server Supabase client
├── PROJECT_OVERVIEW.md
├── ROADMAP.md
├── SYSTEM_ARCHITECTURE.md
└── SESSION_HANDOFF.md                # ← This file
```

---

*Last updated: 2026-06-07 | Session: Phase 0 completion*
