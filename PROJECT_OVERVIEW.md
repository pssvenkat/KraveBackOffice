# Krave Microgreens — Back Office Application
## Project Overview

---

### About the Business

**Krave Microgreens** is a microgreens production and delivery business. The back-office system manages day-to-day operations including inventory, customer billing, and payment tracking — accessible from any browser and controllable via voice.

---

### Problem Statement

Manual tracking of seeds, growing trays, and packaging materials leads to stockouts and waste. Invoice creation is time-consuming and receivables are hard to monitor. The farmer/operator needs hands-free inventory updates while working in the grow room.

---

### Solution

A web-based back-office application hosted on **Vercel** (free tier) backed by **Supabase** (free-tier PostgreSQL + Auth). The app covers:

| Module | Description |
|---|---|
| **Dashboard** | KPIs, low-stock alerts, recent activity |
| **Inventory** | Track seeds (by variety), trays, and packing materials with reorder alerts |
| **Customers** | Managed customer list with contact info and billing details |
| **Invoices** | Line-item invoices with optional 5% GST, PDF export |
| **Receivables** | Track outstanding balances, partial payments, and overdue aging |
| **Voice Control** | Hands-free inventory updates via Web Speech API (browser) + Telegram Bot |

---

### Target Users

| Role | Usage |
|---|---|
| Owner / Operator | Full access — all modules |
| Staff (future phase) | Inventory updates only |
| Accountant (future phase) | Invoices and receivables read access |

---

### Key Technical Decisions

| Topic | Decision | Rationale |
|---|---|---|
| Currency | INR (₹) | Business operates in India |
| GST | Optional per invoice — 5% | Some customers are GST-registered |
| Voice interface | Web Speech API + Telegram Bot | No AWS account needed; Telegram works on mobile too |
| Hosting | Vercel free tier | Generous limits, seamless Next.js deployment |
| Database | Supabase free tier (PostgreSQL) | 500 MB DB, built-in Auth, real-time capability |
| Auth | Supabase Auth — email/password | Single-owner MVP |
| PDF Generation | `jsPDF` + `html2canvas` | Client-side, no server cost |
| Framework | Next.js 14 (App Router) | Vercel-native, excellent DX |
| Styling | Tailwind CSS v3 | Rapid premium UI development |
| Customers | Managed list | Reuse across invoices, history tracking |

---

### Free Tier Limits to Monitor

| Service | Free Limit | Our Usage |
|---|---|---|
| Vercel | 100 GB bandwidth/mo | Low (internal tool) |
| Vercel | 100k serverless invocations/mo | Low (single user) |
| Supabase | 500 MB database | Adequate for MVP |
| Supabase | 1 GB file storage (PDFs) | Adequate |
| Supabase | 50,000 MAU | 1 user — no issue |
| Telegram Bot API | 30 msgs/sec | No issue |

---

### Out of Scope for MVP

- Multi-user role-based access control
- Accounting / P&L / balance sheet
- Production scheduling / grow-cycle tracking
- e-Commerce storefront or customer ordering portal
- WhatsApp integration
- Native mobile app

---

### Success Criteria

- [ ] Operator can add/edit/delete inventory in < 30 seconds
- [ ] Invoice with GST can be created and downloaded as PDF in < 2 minutes
- [ ] Voice command updates inventory without touching a keyboard
- [ ] Outstanding receivables visible at a glance on the dashboard
- [ ] Full app runs within Vercel + Supabase free tier limits
- [ ] Works on Chrome, Edge, and mobile browsers

---

### Long-Term Vision

A fully AI-enabled microgreens operations platform with:
- Production forecasting and yield tracking
- Demand forecasting based on customer order history
- Automated purchase recommendations
- AI business assistant (chat interface)
- WhatsApp / Alexa integration

---

*Last updated: 2026-06-07 | Version: 1.0*
