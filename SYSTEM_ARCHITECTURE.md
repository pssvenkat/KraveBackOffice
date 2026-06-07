# Krave Microgreens — System Architecture

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│                                                             │
│  ┌───────────────────┐      ┌───────────────────────────┐   │
│  │  Browser (Chrome/ │      │  Telegram App (Mobile /   │   │
│  │  Edge / Mobile)   │      │  Desktop)                 │   │
│  │                   │      │                           │   │
│  │  Next.js Frontend │      │  Text / Voice Messages    │   │
│  │  Web Speech API   │      │                           │   │
│  └────────┬──────────┘      └────────────┬──────────────┘   │
└───────────┼─────────────────────────────┼────────────────────┘
            │ HTTPS                        │ HTTPS (Webhook)
┌───────────▼─────────────────────────────▼────────────────────┐
│                    VERCEL (Free Tier)                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Next.js 14 App (App Router)                │  │
│  │                                                         │  │
│  │  /app                    /api                           │  │
│  │  ├── (auth)/             ├── telegram/route.ts          │  │
│  │  │   └── login/          │   (Telegram webhook)         │  │
│  │  ├── dashboard/          ├── invoices/[id]/pdf/         │  │
│  │  ├── customers/          │   (PDF generation)           │  │
│  │  ├── inventory/          └── voice/route.ts             │  │
│  │  ├── invoices/               (voice command NLP)        │  │
│  │  ├── receivables/                                       │  │
│  │  └── settings/                                          │  │
│  └──────────────────────────────┬──────────────────────────┘  │
└─────────────────────────────────┼─────────────────────────────┘
                                  │ Supabase JS Client (HTTPS)
┌─────────────────────────────────▼─────────────────────────────┐
│                    SUPABASE (Free Tier)                        │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ PostgreSQL  │  │ Supabase Auth│  │ Supabase Storage     │  │
│  │ Database    │  │ (email/pwd)  │  │ (Invoice PDFs)       │  │
│  └─────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js | 14 (App Router) | Full-stack React framework |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| UI Components | shadcn/ui | Latest | Pre-built accessible components |
| Database ORM | Supabase JS | 2.x | DB queries, auth, realtime |
| Database | PostgreSQL | via Supabase | Relational data store |
| Auth | Supabase Auth | — | Email/password auth, session mgmt |
| File Storage | Supabase Storage | — | Invoice PDF storage |
| PDF Generation | jsPDF + html2canvas | Latest | Client-side PDF generation |
| Charts | Recharts | Latest | Dashboard analytics charts |
| Form Validation | Zod + react-hook-form | Latest | Type-safe form validation |
| Voice (browser) | Web Speech API | Native | Hands-free inventory updates |
| Voice (mobile) | Telegram Bot API | Latest | Inventory updates via chat |
| Hosting | Vercel | Free tier | CI/CD + serverless functions |

---

## Database Schema

### `customers`
```sql
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  gstin       TEXT,              -- GST Identification Number (optional)
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `inventory_categories`
```sql
CREATE TABLE inventory_categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL UNIQUE   -- 'Seeds', 'Trays', 'Packing Materials'
);
```

### `inventory_items`
```sql
CREATE TABLE inventory_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID REFERENCES inventory_categories(id),
  name            TEXT NOT NULL,
  unit            TEXT NOT NULL,   -- 'g', 'kg', 'pcs', 'rolls'
  quantity        NUMERIC(12,3) NOT NULL DEFAULT 0,
  reorder_level   NUMERIC(12,3) NOT NULL DEFAULT 0,
  cost_per_unit   NUMERIC(10,2),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `inventory_transactions`
```sql
CREATE TABLE inventory_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id          UUID REFERENCES inventory_items(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('add','consume','adjust')),
  quantity_delta   NUMERIC(12,3) NOT NULL,  -- positive = add, negative = consume
  note             TEXT,
  source           TEXT,                    -- 'manual','voice','telegram'
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### `invoices`
```sql
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT NOT NULL UNIQUE,    -- 'KM-2026-001'
  customer_id     UUID REFERENCES customers(id),
  issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','sent','paid','partial')),
  subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
  apply_gst       BOOLEAN DEFAULT FALSE,
  gst_rate        NUMERIC(5,2) DEFAULT 5.00,
  gst_amount      NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid     NUMERIC(12,2) DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `invoice_items`
```sql
CREATE TABLE invoice_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  unit         TEXT,
  quantity     NUMERIC(10,3) NOT NULL,
  unit_price   NUMERIC(10,2) NOT NULL,
  line_total   NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
```

### `payments`
```sql
CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     UUID REFERENCES invoices(id),
  amount         NUMERIC(12,2) NOT NULL,
  payment_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  method         TEXT CHECK (method IN ('cash','upi','bank_transfer','other')),
  reference      TEXT,   -- UPI ref / cheque number
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### `settings`
```sql
CREATE TABLE settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
-- Seed data:
-- ('business_name', 'Krave Microgreens')
-- ('business_address', '...')
-- ('gstin', '...')
-- ('invoice_prefix', 'KM')
-- ('invoice_next_number', '1')
-- ('default_gst_rate', '5')
-- ('bank_details', '...')
```

---

## Row-Level Security (RLS) Policies

All tables will have RLS enabled. Only authenticated users (the owner) can access any row.

```sql
-- Example policy (applied to all tables)
CREATE POLICY "owner_only" ON customers
  FOR ALL
  USING (auth.role() = 'authenticated');
```

---

## Application Routes

### Pages (Next.js App Router)

| Route | Description |
|---|---|
| `/login` | Login page |
| `/dashboard` | KPI cards, low-stock, recent activity |
| `/customers` | Customer list |
| `/customers/new` | Add customer |
| `/customers/[id]` | Customer detail + invoice history |
| `/inventory` | Inventory overview (3 tabs) |
| `/inventory/[id]` | Item detail + transaction history |
| `/invoices` | Invoice list |
| `/invoices/new` | Create invoice |
| `/invoices/[id]` | Invoice detail + PDF download |
| `/receivables` | Outstanding + aging view |
| `/settings` | Business info, bank details, defaults |

### API Routes (Serverless Functions)

| Route | Method | Description |
|---|---|---|
| `/api/telegram` | POST | Telegram webhook receiver |
| `/api/invoices/[id]/pdf` | GET | Server-side PDF generation (fallback) |
| `/api/voice` | POST | NLP command parser |

---

## Voice Control Architecture

### Web Speech API (Browser)

```
User speaks → Web Speech API → Transcript text
→ Command Parser (regex/NLP)
→ Supabase inventory update
→ Toast confirmation
```

**Supported command patterns:**

| Intent | Pattern | Example |
|---|---|---|
| Add stock | `add {qty} {unit} {item}` | "add 500 grams sunflower seeds" |
| Use stock | `use {qty} {unit} {item}` | "use 10 trays" |
| Adjust stock | `set {item} to {qty} {unit}` | "set radish seeds to 2 kilograms" |
| Check stock | `how much {item}` | "how much sunflower seeds" |
| Low stock | `show low stock` | shows filter |

### Telegram Bot Architecture

```
Telegram User → Telegram Bot API
→ POST /api/telegram (Vercel serverless)
→ Command parser
→ Supabase update
→ Reply message to Telegram
```

**Bot Commands:**

| Command | Description |
|---|---|
| `/stock` | Full inventory summary |
| `/add [qty] [unit] [item]` | Add inventory |
| `/use [qty] [unit] [item]` | Consume inventory |
| `/lowstock` | Items below reorder level |
| `/outstanding` | Total receivables |
| `/invoice [customer name]` | Last invoice summary |
| `/help` | List all commands |

**Voice message flow (Telegram):**
```
Voice message → Telegram Bot API
→ Download OGG audio file
→ OpenAI Whisper API (or Deepgram) transcription
→ Command parser → Supabase update → Reply
```
> Note: Whisper transcription requires an OpenAI API key. Text commands work without it.

---

## PDF Invoice Structure

```
┌────────────────────────────────────────────┐
│  KRAVE MICROGREENS              [Logo]      │
│  Address | Phone | GSTIN                   │
├────────────────────────────────────────────┤
│  INVOICE                                   │
│  Invoice No: KM-2026-001                   │
│  Date: 07 Jun 2026    Due: 21 Jun 2026     │
├────────────────────────────────────────────┤
│  Bill To:                                  │
│  Customer Name                             │
│  Address, City                             │
│  GSTIN: (if applicable)                    │
├────────────────────────────────────────────┤
│  # │ Description │ Qty │ Rate │ Amount     │
│  1 │ Sunflower   │ 500g│ ₹0.5 │ ₹250.00   │
│  2 │ Pea Shoots  │ 200g│ ₹0.8 │ ₹160.00   │
├────────────────────────────────────────────┤
│                        Subtotal: ₹410.00   │
│                     GST @ 5%:    ₹ 20.50   │
│                        TOTAL:   ₹430.50    │
├────────────────────────────────────────────┤
│  Payment: UPI / Bank Transfer              │
│  Notes: Thank you for your business!       │
└────────────────────────────────────────────┘
```

---

## Environment Variables

### Vercel Dashboard (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Telegram Bot (server-side only)
TELEGRAM_BOT_TOKEN=123456789:AAF...
TELEGRAM_ALLOWED_USER_ID=123456789   # Your Telegram user ID

# Optional: Voice transcription for Telegram voice messages
OPENAI_API_KEY=sk-...
```

---

## Deployment Flow

```
Developer pushes to GitHub main branch
         ↓
Vercel detects push → triggers build
         ↓
next build (TypeScript, Tailwind compile)
         ↓
Deploy to Vercel Edge Network
         ↓
Register Telegram Webhook (one-time):
GET https://api.telegram.org/bot{TOKEN}/setWebhook
    ?url=https://krave-backoffice.vercel.app/api/telegram
```

---

## Security Considerations

| Area | Measure |
|---|---|
| Auth | Supabase Auth sessions (JWT), server-side validation |
| Database | RLS policies — all rows locked to authenticated user |
| Telegram | Validate `TELEGRAM_ALLOWED_USER_ID` on every webhook call |
| Environment vars | All secrets in Vercel env vars, none in client bundle |
| PDF | Generated client-side; no sensitive data leaves the browser |
| HTTPS | Enforced by Vercel (free SSL) |

---

*Last updated: 2026-06-07 | Version: 1.0*
