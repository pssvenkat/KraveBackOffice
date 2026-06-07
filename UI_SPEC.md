# Krave Microgreens — UI Specification

> Design system, component patterns, and page-level specs.
> Updated as each phase builds new UI.

---

## Design System

### Color Palette (Dark Theme)

| Token | Hex | Usage |
|---|---|---|
| `bg-primary` | `#0a0f1a` | Page background |
| `bg-surface` | `#111827` | Cards, sidebar, modals |
| `bg-elevated` | `#1a2235` | Hover states, dropdowns |
| `border` | `#1e2d45` | Card borders, dividers |
| `border-subtle` | `#162032` | Subtle separators |
| `accent-green` | `#22c55e` | Primary CTA, active nav |
| `accent-emerald` | `#10b981` | Gradient end, highlights |
| `text-primary` | `#f1f5f9` | Headings, primary text |
| `text-secondary` | `#94a3b8` | Labels, secondary text |
| `text-muted` | `#475569` | Placeholders, meta text |

### Status Colors

| Status | Color | Usage |
|---|---|---|
| Success / Active | `#22c55e` (green) | Paid, in stock, active |
| Warning / Low | `#f59e0b` (amber) | Low stock, partial, due soon |
| Danger / Overdue | `#ef4444` (red) | Overdue invoices, out of stock |
| Info / Neutral | `#3b82f6` (blue) | Outstanding, sent |
| Muted / Draft | `#475569` (slate) | Draft status |

### Typography

| Element | Class | Size | Weight |
|---|---|---|---|
| Page title (`h1`) | `text-2xl font-bold text-slate-100 tracking-tight` | 24px | 700 |
| Section heading (`h2`) | `text-sm font-semibold text-slate-200` | 14px | 600 |
| Body | `text-sm text-slate-300` | 14px | 400 |
| Label | `text-xs font-medium text-slate-400 uppercase tracking-wide` | 12px | 500 |
| Meta / caption | `text-xs text-slate-500` | 12px | 400 |
| Code / mono | `text-xs font-mono text-green-400` | 12px | 400 |

### Font
- **Inter** — loaded via `next/font/google`
- Variable: `--font-inter`

---

## Spacing & Layout

| Element | Value |
|---|---|
| Page max width | `max-w-7xl mx-auto` |
| Page padding | `p-6` |
| Card padding | `p-5` |
| Card border radius | `rounded-2xl` |
| Card border | `border border-[#1e2d45]` |
| Card background | `bg-[#111827]` |
| Section gap | `space-y-6` |
| Input border radius | `rounded-xl` |
| Button border radius | `rounded-xl` |
| Sidebar width | `w-60` |
| Header height | `h-14` |

---

## Reusable Component Patterns

### Primary Button
```tsx
<button className="flex items-center gap-2 px-4 py-2.5
  bg-gradient-to-r from-green-500 to-emerald-600
  hover:from-green-400 hover:to-emerald-500
  text-white text-sm font-semibold rounded-xl
  shadow-lg shadow-green-500/25 transition-all">
  <Plus className="w-4 h-4" /> Label
</button>
```

### Secondary / Ghost Button
```tsx
<button className="px-4 py-2 text-xs font-semibold rounded-xl
  bg-green-500/15 text-green-400 border border-green-500/20
  hover:bg-green-500/25 transition-colors">
  Label
</button>
```

### Danger Button
```tsx
<button className="px-4 py-2 text-xs font-semibold rounded-xl
  bg-red-500/10 text-red-400 border border-red-500/20
  hover:bg-red-500/20 transition-colors">
  Delete
</button>
```

### Text Input
```tsx
<input className="w-full px-3.5 py-2.5
  bg-[#0a0f1a] border border-[#1e2d45] rounded-xl
  text-slate-100 placeholder:text-slate-600 text-sm
  focus:outline-none focus:border-green-500/70
  focus:ring-1 focus:ring-green-500/30 transition-all" />
```

### Form Label
```tsx
<label className="block text-xs font-medium text-slate-400
  mb-1.5 uppercase tracking-wide">
  Field Name
</label>
```

### Data Table Row
```tsx
<tr className="border-b border-[#1e2d45] hover:bg-[#1a2235] transition-colors">
  <td className="px-4 py-3 text-sm text-slate-200">...</td>
</tr>
```

### Status Badge
```tsx
// paid
<span className="px-2 py-0.5 text-xs font-semibold rounded-full
  bg-green-500/15 text-green-400 border border-green-500/20">
  Paid
</span>

// pending / sent
<span className="px-2 py-0.5 text-xs font-semibold rounded-full
  bg-blue-500/15 text-blue-400 border border-blue-500/20">
  Sent
</span>

// overdue
<span className="px-2 py-0.5 text-xs font-semibold rounded-full
  bg-red-500/15 text-red-400 border border-red-500/20">
  Overdue
</span>

// draft
<span className="px-2 py-0.5 text-xs font-semibold rounded-full
  bg-slate-500/15 text-slate-400 border border-slate-500/20">
  Draft
</span>
```

### KPI Card
```tsx
<div className="relative overflow-hidden rounded-2xl border
  bg-gradient-to-br from-green-500/20 to-emerald-500/10
  border-green-500/20 p-5">
  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
    Title
  </p>
  <p className="text-2xl font-bold text-slate-100">₹0</p>
  <p className="text-xs text-slate-500 mt-1">Subtitle</p>
</div>
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Icon className="w-12 h-12 text-slate-700 mb-4" />
  <p className="text-base font-semibold text-slate-400">No items yet</p>
  <p className="text-sm text-slate-600 mt-1">Subtitle message</p>
  <button className="mt-4 ...">Action</button>
</div>
```

### Modal / Drawer (pattern)
```tsx
// Overlay
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  // Panel
  <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl w-full max-w-md p-6 shadow-2xl">
    // Header
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-lg font-semibold text-slate-100">Title</h2>
      <button className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
    </div>
    // Body
    // Footer
    <div className="flex gap-3 mt-6">
      <button className="flex-1 ...cancel...">Cancel</button>
      <button className="flex-1 ...primary...">Save</button>
    </div>
  </div>
</div>
```

---

## Page Specifications

### Login `/login`
- **Status:** ✅ Built (Phase 0)
- Full-screen centered card
- Ambient green blur blobs background
- Logo: green gradient rounded square + Leaf icon
- Email + password fields
- Password show/hide toggle
- Gradient green submit button
- Error display on auth failure

### Dashboard `/dashboard`
- **Status:** ✅ Skeleton built (Phase 0), live data in Phase 5
- 4 KPI cards: Revenue, Outstanding, Overdue, Inventory Items
- 2 panels: Low Stock Alerts | Recent Invoices
- Getting Started guide (3 steps)
- Empty state for all panels until data exists

### Customers `/customers`
- **Status:** ⬜ Phase 1
- Search bar (filter by name/phone/email)
- "Add Customer" button → opens modal
- Table: Name | Phone | Email | City | GSTIN | Actions
- Row actions: Edit (pencil) | Delete (trash)
- Add/Edit modal with all fields
- Confirm delete dialog

### Inventory `/inventory`
- **Status:** ⬜ Phase 2
- 3 tabs: Seeds | Trays | Packing Materials
- Per-tab table: Name | Unit | Stock | Reorder Level | Status | Actions
- Stock status indicator: 🟢 OK / 🟡 Low / 🔴 Critical
- "Add Item" button per tab
- "Adjust Stock" button per row → opens adjust modal (add/consume/adjust + note)
- Transaction history drawer per item

### Invoices `/invoices`
- **Status:** ⬜ Phase 3
- Filter bar: All | Draft | Sent | Paid | Partial
- Table: Invoice # | Customer | Date | Due | Amount | Status | Actions
- "New Invoice" button → `/invoices/new`
- Row actions: View | Download PDF | Mark Sent | Delete (draft only)
- `/invoices/new` page:
  - Customer selector (dropdown from customers table)
  - Line items builder (add/remove rows)
  - GST toggle (5%)
  - Auto-calculated totals
  - Due date picker
  - Notes textarea
  - Save as Draft / Save & Send

### Invoice PDF Layout
```
┌─────────────────────────────────┐
│  KRAVE MICROGREENS        [Leaf]│
│  Address | Phone | GSTIN        │
├─────────────────────────────────┤
│  INVOICE No: KM-2026-001        │
│  Date: 07 Jun 2026              │
│  Due:  21 Jun 2026              │
├─────────────────────────────────┤
│  Bill To:                       │
│  Customer Name                  │
│  Address, City                  │
│  GSTIN: xxxxxxxxxx              │
├─────────────────────────────────┤
│  # │ Description │ Qty │ Rate │ ₹ │
│  1 │ Sunflower   │ 500g│ 0.50│250│
├─────────────────────────────────┤
│              Subtotal:  ₹250.00 │
│           GST @ 5%:     ₹ 12.50 │
│               TOTAL:   ₹262.50 │
├─────────────────────────────────┤
│  Pay via UPI: upi@id            │
│  Thank you for your business!   │
└─────────────────────────────────┘
```

### Receivables `/receivables`
- **Status:** ⬜ Phase 4
- Summary strip: Total Outstanding | Overdue count | Collected this month
- Aging tabs: All | Current | 1–30 days | 31–60 days | 60+ days
- Table: Invoice # | Customer | Total | Paid | Outstanding | Due Date | Aging | Action
- "Record Payment" button per row → modal (amount, date, method, reference)
- Payment history per invoice (expandable row)

### Voice `/voice`
- **Status:** ⬜ Phase 6
- Large mic button (pulsing animation when active)
- Live transcript display
- Command confirmation toast
- Supported commands reference list

### Settings `/settings`
- **Status:** ⬜ Phase 8
- Business info section (name, address, phone, email, GSTIN)
- Invoice defaults (prefix, default GST, payment terms, notes)
- Bank details (for invoice footer)
- Save button

---

## Navigation (Sidebar)

| Item | Icon | Route | Phase |
|---|---|---|---|
| Dashboard | LayoutDashboard | `/dashboard` | 0 ✅ |
| Customers | Users | `/customers` | 1 |
| Inventory | Package | `/inventory` | 2 |
| Invoices | FileText | `/invoices` | 3 |
| Receivables | CreditCard | `/receivables` | 4 |
| Voice Commands | Mic | `/voice` | 6 |
| Settings | Settings | `/settings` | 8 |

---

## Icons Library

**Package:** `lucide-react`

| Usage | Icon name |
|---|---|
| Dashboard | `LayoutDashboard` |
| Customers | `Users`, `User`, `UserPlus` |
| Inventory | `Package`, `PackagePlus` |
| Invoices | `FileText`, `FilePlus` |
| Receivables | `CreditCard`, `DollarSign` |
| Voice | `Mic`, `MicOff` |
| Settings | `Settings`, `Sliders` |
| Add | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Close | `X` |
| Search | `Search` |
| Download | `Download` |
| Print | `Printer` |
| Alert | `AlertTriangle` |
| Check | `CheckCircle2` |
| Arrow | `ArrowUpRight`, `ChevronRight` |
| Leaf (brand) | `Leaf` |
| Loading | `Loader2` (with `animate-spin`) |

---

*Last updated: 2026-06-07 | Phase 0 complete — login + dashboard shell built*
