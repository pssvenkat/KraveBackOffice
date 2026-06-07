# Krave Microgreens — API Specification

> Documents all Next.js API route handlers (`/api/*`) and Supabase RPC calls.
> Updated as each phase adds server-side logic.

---

## Base URL

| Environment | Base URL |
|---|---|
| Production | `https://kravebackoffice.vercel.app` |
| Local | `http://localhost:3000` |

---

## Authentication

All API routes require an active Supabase session cookie (set by the login flow).  
The `proxy.ts` gate redirects unauthenticated requests to `/login`.

For server-side calls, the Supabase session is read from cookies via `@supabase/ssr`.

---

## API Routes Status

| Route | Method | Phase | Status |
|---|---|---|---|
| `/api/telegram` | POST | 7 | ⬜ Not built |
| `/api/voice` | POST | 6 | ⬜ Not built |
| `/api/invoices/[id]/pdf` | GET | 3 | ⬜ Not built |

---

## Phase 3 — Invoice PDF

### `GET /api/invoices/[id]/pdf`

Generates and streams a PDF of the specified invoice.

**Auth:** Required (session cookie)

**Path params:**

| Param | Type | Description |
|---|---|---|
| `id` | uuid | Invoice ID |

**Response:**

| Status | Content-Type | Description |
|---|---|---|
| 200 | `application/pdf` | PDF binary stream |
| 401 | `application/json` | Not authenticated |
| 404 | `application/json` | Invoice not found |
| 500 | `application/json` | Generation error |

**Implementation notes:**
- Fetches invoice + customer + line items from Supabase server client
- Renders PDF using `jsPDF` on the server
- Sets `Content-Disposition: attachment; filename="KM-2026-001.pdf"`

---

## Phase 6 — Voice Command Parser

### `POST /api/voice`

Parses a voice transcript into a structured inventory command.

**Auth:** Required

**Request body:**

```json
{
  "transcript": "add 500 grams sunflower seeds"
}
```

**Response:**

```json
{
  "intent": "add_stock",
  "item": "sunflower seeds",
  "quantity": 500,
  "unit": "g",
  "matched_item_id": "uuid-here",
  "confirmation": "Added 500g sunflower seeds ✓"
}
```

**Error response:**

```json
{
  "intent": "unknown",
  "transcript": "original text",
  "error": "Could not parse command"
}
```

**Supported intents:**

| Intent | Example transcript |
|---|---|
| `add_stock` | "add 500 grams sunflower seeds" |
| `consume_stock` | "use 10 trays" / "consumed 2kg radish seeds" |
| `adjust_stock` | "set sunflower seeds to 1 kilogram" |
| `check_stock` | "how much sunflower seeds do I have" |
| `show_low_stock` | "show low stock" / "what's running low" |

---

## Phase 7 — Telegram Webhook

### `POST /api/telegram`

Receives webhook POST from Telegram Bot API. Processes text and voice messages.

**Auth:** Validated via `TELEGRAM_ALLOWED_USER_ID` env var (not cookie-based)

**Telegram webhook payload (relevant fields):**

```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 42,
    "from": { "id": 123456789, "first_name": "Venkat" },
    "chat": { "id": 123456789 },
    "text": "/add 500g sunflower seeds",
    "voice": {
      "file_id": "AwACAgIA...",
      "duration": 3,
      "mime_type": "audio/ogg"
    }
  }
}
```

**Supported bot commands:**

| Command | Description | Example |
|---|---|---|
| `/stock` | Full inventory summary | `/stock` |
| `/add [qty] [unit] [item]` | Add to inventory | `/add 500g sunflower seeds` |
| `/use [qty] [unit] [item]` | Consume from inventory | `/use 10 trays` |
| `/lowstock` | Items below reorder level | `/lowstock` |
| `/outstanding` | Total receivables | `/outstanding` |
| `/invoice [name]` | Last invoice for customer | `/invoice Priya` |
| `/help` | List all commands | `/help` |

**Voice message flow:**
1. Download OGG audio from Telegram file API
2. Send to OpenAI Whisper for transcription (requires `OPENAI_API_KEY`)
3. Pass transcript to voice command parser (same logic as `/api/voice`)
4. Execute inventory update in Supabase
5. Reply to Telegram with confirmation

**Response to Telegram:**
Always return `200 OK` with `{"ok": true}` — Telegram retries on non-200.

**Webhook registration (one-time setup):**
```
GET https://api.telegram.org/bot{TOKEN}/setWebhook
  ?url=https://kravebackoffice.vercel.app/api/telegram
```

---

## Supabase Client-Side Calls

These are direct Supabase JS calls from the browser or server components (not API routes).

### Customers

```typescript
// List all active customers
const { data } = await supabase
  .from('customers')
  .select('*')
  .eq('is_active', true)
  .order('name')

// Create customer
const { data } = await supabase
  .from('customers')
  .insert({ name, email, phone, address, city, gstin, notes })
  .select()
  .single()

// Update customer
const { data } = await supabase
  .from('customers')
  .update({ name, email, phone, address, city, gstin, notes })
  .eq('id', id)
  .select()
  .single()

// Soft delete
const { data } = await supabase
  .from('customers')
  .update({ is_active: false })
  .eq('id', id)
```

### Inventory

```typescript
// Get inventory with category info
const { data } = await supabase
  .from('inventory_items')
  .select('*, inventory_categories(name, icon)')
  .eq('is_active', true)
  .order('name')

// Adjust stock (add/consume)
const { data } = await supabase.rpc('adjust_inventory', {
  p_item_id: id,
  p_delta: 500,           // positive = add, negative = consume
  p_type: 'add',          // 'add' | 'consume' | 'adjust'
  p_note: 'Voice command',
  p_source: 'voice'
})
```

### Invoices

```typescript
// Get invoices with customer name
const { data } = await supabase
  .from('invoices')
  .select('*, customers(name), invoice_items(*)')
  .order('created_at', { ascending: false })

// Create invoice with items (transaction)
const { data: invoice } = await supabase
  .from('invoices')
  .insert({ invoice_number, customer_id, issue_date, due_date, ... })
  .select()
  .single()

await supabase
  .from('invoice_items')
  .insert(items.map(item => ({ invoice_id: invoice.id, ...item })))
```

---

## Environment Variables

| Variable | Required | Used in | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Client + Server | Supabase anon/public key |
| `TELEGRAM_BOT_TOKEN` | Phase 7 | `/api/telegram` | Telegram bot token from @BotFather |
| `TELEGRAM_ALLOWED_USER_ID` | Phase 7 | `/api/telegram` | Your Telegram numeric user ID |
| `OPENAI_API_KEY` | Phase 7 (optional) | `/api/telegram` | For Whisper voice transcription |

---

*Last updated: 2026-06-07 | Phase 0 complete — no API routes built yet*
