# Krave Microgreens — Database Schema

> Supabase (PostgreSQL) schema. Updated as each phase adds tables.
> Run all SQL in **Supabase Dashboard → SQL Editor**.

---

## Connection Details

| Key | Value |
|---|---|
| Project URL | `https://eostzwmrakhfbbehytaw.supabase.co` |
| Region | (your selected region) |
| Database | PostgreSQL 15 (managed by Supabase) |

---

## Schema Status

| Table | Phase | Status |
|---|---|---|
| `customers` | Phase 1 | ⬜ Not created |
| `inventory_categories` | Phase 2 | ⬜ Not created |
| `inventory_items` | Phase 2 | ⬜ Not created |
| `inventory_transactions` | Phase 2 | ⬜ Not created |
| `invoices` | Phase 3 | ⬜ Not created |
| `invoice_items` | Phase 3 | ⬜ Not created |
| `payments` | Phase 4 | ⬜ Not created |
| `settings` | Phase 8 | ⬜ Not created |

---

## Phase 1 — Customers

```sql
-- Enable UUID generation
create extension if not exists "pgcrypto";

create table customers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text,
  phone         text,
  address       text,
  city          text,
  gstin         text,          -- GST Identification Number (optional)
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger customers_updated_at
  before update on customers
  for each row execute function update_updated_at();

-- Row Level Security
alter table customers enable row level security;

create policy "Authenticated users can do everything"
  on customers for all
  using (auth.role() = 'authenticated');
```

### Columns

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `name` | text | NO | — | Customer / business name |
| `email` | text | YES | — | Email address |
| `phone` | text | YES | — | Phone number |
| `address` | text | YES | — | Street address |
| `city` | text | YES | — | City |
| `gstin` | text | YES | — | GST Identification Number |
| `notes` | text | YES | — | Internal notes |
| `is_active` | boolean | NO | true | Soft delete flag |
| `created_at` | timestamptz | NO | now() | Record creation time |
| `updated_at` | timestamptz | NO | now() | Last update time (auto) |

---

## Phase 2 — Inventory

```sql
-- Categories (seeded, not user-managed)
create table inventory_categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  icon  text           -- emoji or icon name
);

insert into inventory_categories (name, icon) values
  ('Seeds', '🌱'),
  ('Trays', '🗂️'),
  ('Packing Materials', '📦');

alter table inventory_categories enable row level security;
create policy "Authenticated read/write"
  on inventory_categories for all
  using (auth.role() = 'authenticated');

-- Inventory items
create table inventory_items (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid not null references inventory_categories(id),
  name            text not null,
  unit            text not null,          -- 'g', 'kg', 'pcs', 'rolls', 'bags'
  quantity        numeric(12,3) not null default 0,
  reorder_level   numeric(12,3) not null default 0,
  cost_per_unit   numeric(10,2),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger inventory_items_updated_at
  before update on inventory_items
  for each row execute function update_updated_at();

alter table inventory_items enable row level security;
create policy "Authenticated read/write"
  on inventory_items for all
  using (auth.role() = 'authenticated');

-- Transaction audit trail
create table inventory_transactions (
  id                uuid primary key default gen_random_uuid(),
  item_id           uuid not null references inventory_items(id),
  transaction_type  text not null check (transaction_type in ('add', 'consume', 'adjust')),
  quantity_delta    numeric(12,3) not null,  -- positive = add, negative = consume/adjust
  quantity_after    numeric(12,3) not null,  -- snapshot of quantity post-transaction
  note              text,
  source            text default 'manual' check (source in ('manual', 'voice', 'telegram')),
  created_at        timestamptz not null default now()
);

alter table inventory_transactions enable row level security;
create policy "Authenticated read/write"
  on inventory_transactions for all
  using (auth.role() = 'authenticated');
```

### inventory_items Columns

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | uuid | NO | Primary key |
| `category_id` | uuid | NO | FK → inventory_categories |
| `name` | text | NO | Item name (e.g. "Sunflower Seeds") |
| `unit` | text | NO | Unit of measure (g, kg, pcs, rolls) |
| `quantity` | numeric(12,3) | NO | Current stock level |
| `reorder_level` | numeric(12,3) | NO | Triggers low-stock alert |
| `cost_per_unit` | numeric(10,2) | YES | Cost for valuation |
| `is_active` | boolean | NO | Soft delete |
| `created_at` | timestamptz | NO | — |
| `updated_at` | timestamptz | NO | Auto-updated |

---

## Phase 3 — Invoices

```sql
create table invoices (
  id              uuid primary key default gen_random_uuid(),
  invoice_number  text not null unique,     -- 'KM-2026-001'
  customer_id     uuid not null references customers(id),
  issue_date      date not null default current_date,
  due_date        date,
  status          text not null default 'draft'
                  check (status in ('draft', 'sent', 'paid', 'partial')),
  subtotal        numeric(12,2) not null default 0,
  apply_gst       boolean not null default false,
  gst_rate        numeric(5,2) not null default 5.00,
  gst_amount      numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,
  amount_paid     numeric(12,2) not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger invoices_updated_at
  before update on invoices
  for each row execute function update_updated_at();

alter table invoices enable row level security;
create policy "Authenticated read/write"
  on invoices for all
  using (auth.role() = 'authenticated');

create table invoice_items (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoices(id) on delete cascade,
  description  text not null,
  unit         text,
  quantity     numeric(10,3) not null,
  unit_price   numeric(10,2) not null,
  line_total   numeric(12,2) generated always as (quantity * unit_price) stored
);

alter table invoice_items enable row level security;
create policy "Authenticated read/write"
  on invoice_items for all
  using (auth.role() = 'authenticated');

-- Invoice auto-numbering helper
create sequence invoice_number_seq start 1;

create or replace function next_invoice_number()
returns text as $$
declare
  year_part text := to_char(now(), 'YYYY');
  seq_val   int  := nextval('invoice_number_seq');
begin
  return 'KM-' || year_part || '-' || lpad(seq_val::text, 3, '0');
end;
$$ language plpgsql;
```

---

## Phase 4 — Payments

```sql
create table payments (
  id             uuid primary key default gen_random_uuid(),
  invoice_id     uuid not null references invoices(id),
  amount         numeric(12,2) not null,
  payment_date   date not null default current_date,
  method         text check (method in ('cash', 'upi', 'bank_transfer', 'other')),
  reference      text,   -- UPI transaction ID / cheque number
  note           text,
  created_at     timestamptz not null default now()
);

alter table payments enable row level security;
create policy "Authenticated read/write"
  on payments for all
  using (auth.role() = 'authenticated');

-- After payment insert, update invoice.amount_paid and status
create or replace function sync_invoice_payment()
returns trigger as $$
declare
  total_paid numeric(12,2);
  inv_total  numeric(12,2);
begin
  select coalesce(sum(amount), 0) into total_paid
  from payments where invoice_id = new.invoice_id;

  select total into inv_total
  from invoices where id = new.invoice_id;

  update invoices set
    amount_paid = total_paid,
    status = case
      when total_paid >= inv_total then 'paid'
      when total_paid > 0 then 'partial'
      else status
    end,
    updated_at = now()
  where id = new.invoice_id;

  return new;
end;
$$ language plpgsql;

create trigger payments_sync_invoice
  after insert or update on payments
  for each row execute function sync_invoice_payment();
```

---

## Phase 8 — Settings

```sql
create table settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table settings enable row level security;
create policy "Authenticated read/write"
  on settings for all
  using (auth.role() = 'authenticated');

-- Seed default settings
insert into settings (key, value) values
  ('business_name',    'Krave Microgreens'),
  ('business_address', ''),
  ('business_phone',   ''),
  ('business_email',   ''),
  ('gstin',            ''),
  ('invoice_prefix',   'KM'),
  ('default_gst_rate', '5'),
  ('bank_name',        ''),
  ('bank_account',     ''),
  ('bank_ifsc',        ''),
  ('upi_id',           ''),
  ('invoice_notes',    'Thank you for your business!');
```

---

## Useful Queries

```sql
-- Low stock items
select i.name, i.quantity, i.reorder_level, i.unit, c.name as category
from inventory_items i
join inventory_categories c on i.category_id = c.id
where i.quantity <= i.reorder_level and i.is_active = true
order by (i.quantity / nullif(i.reorder_level, 0));

-- Outstanding receivables with aging
select
  i.invoice_number,
  cu.name as customer,
  i.total,
  i.amount_paid,
  (i.total - i.amount_paid) as outstanding,
  i.due_date,
  (current_date - i.due_date) as days_overdue
from invoices i
join customers cu on i.customer_id = cu.id
where i.status in ('sent', 'partial')
order by days_overdue desc;

-- Monthly revenue
select
  date_trunc('month', issue_date) as month,
  sum(total) as revenue,
  count(*) as invoice_count
from invoices
where status = 'paid'
group by 1
order by 1 desc;
```

---

*Last updated: 2026-06-07 | Phase 0 complete — no tables created yet*
