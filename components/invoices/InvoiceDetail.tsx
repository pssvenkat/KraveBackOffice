'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Send, CheckCircle2, Trash2, Download, ArrowLeft, Loader2, FileText
} from 'lucide-react'
import { updateInvoiceStatus, deleteInvoice } from '@/app/actions/invoices'

type InvoiceItem = {
  id: string
  description: string
  unit: string | null
  quantity: number
  unit_price: number
  line_total: number
}

type Invoice = {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string | null
  status: string
  subtotal: number
  discount_type: string | null
  discount_value: number | null
  discount_amount: number | null
  apply_gst: boolean
  gst_rate: number
  gst_amount: number
  total: number
  amount_paid: number
  notes: string | null
  customers: { name: string; email: string | null; phone: string | null; address: string | null; city: string | null; gstin: string | null }
  invoice_items: InvoiceItem[]
}

const STATUS_STYLE: Record<string, string> = {
  draft:   'bg-slate-500/15 text-slate-400 border-slate-500/20',
  sent:    'bg-blue-500/15 text-blue-400 border-blue-500/20',
  paid:    'bg-green-500/15 text-green-400 border-green-500/20',
  partial: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
}

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

// ── Noto Sans font loader (Unicode — supports ₹ and all scripts) ────────────
// Cached per browser session so subsequent PDF downloads are instant.
let _notoCache: { regular: string; bold: string } | null = null
async function loadNotoSans() {
  if (_notoCache) return _notoCache
  async function ttfToBase64(path: string): Promise<string> {
    const buf = await fetch(path).then(r => r.arrayBuffer())
    const bytes = new Uint8Array(buf)
    let str = ''
    // Chunk to avoid call-stack overflow on large (550 KB) arrays
    for (let i = 0; i < bytes.length; i += 8192) {
      str += String.fromCharCode(...Array.from(bytes.subarray(i, i + 8192)))
    }
    return btoa(str)
  }
  _notoCache = {
    regular: await ttfToBase64('/fonts/NotoSans-Regular.ttf'),
    bold:    await ttfToBase64('/fonts/NotoSans-Bold.ttf'),
  }
  return _notoCache
}

function numberToWords(n: number): string {
  if (n === 0) return 'INR Zero Rupees Only.'
  const U = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen']
  const T = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  function w(x: number): string {
    if (x === 0) return ''
    if (x < 20) return U[x] + ' '
    if (x < 100) return T[Math.floor(x / 10)] + (x % 10 ? ' ' + U[x % 10] : '') + ' '
    if (x < 1000) return U[Math.floor(x / 100)] + ' Hundred ' + w(x % 100)
    if (x < 100000) return w(Math.floor(x / 1000)) + 'Thousand ' + w(x % 1000)
    if (x < 10000000) return w(Math.floor(x / 100000)) + 'Lakh ' + w(x % 100000)
    return w(Math.floor(x / 10000000)) + 'Crore ' + w(x % 10000000)
  }
  const rupees = Math.floor(n)
  const paise  = Math.round((n - rupees) * 100)
  let r = 'INR ' + w(rupees).trim().replace(/\s+/g, ' ') + ' Rupee' + (rupees !== 1 ? 's' : '')
  if (paise > 0) r += ' and ' + w(paise).trim().replace(/\s+/g, ' ') + ' Paise'
  return r + ' Only.'
}

export default function InvoiceDetail({
  invoice, logoUrl, settings = {},
}: {
  invoice: Invoice
  logoUrl?: string | null
  settings?: Record<string, string>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleStatus(status: 'sent' | 'paid') {
    setError(null)
    startTransition(async () => {
      const res = await updateInvoiceStatus(invoice.id, status)
      if (res.error) setError(res.error)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteInvoice(invoice.id)
      if (res.error) { setError(res.error); setShowDeleteConfirm(false) }
      else router.push('/invoices')
    })
  }

  function downloadPDF() {
    import('jspdf').then(async ({ default: jsPDF }) => {
      const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const ML   = 14   // left margin
      const MR   = 196  // right edge
      const CW   = MR - ML  // 182 mm content width

      // Business info from settings (with sensible defaults)
      const bName    = settings.business_name || 'Krave Microgreens'
      const bAddress = settings.address || ''
      const bPhone   = settings.phone   || ''
      const bEmail   = settings.email   || ''
      const bGstin   = settings.gstin   || ''
      const invNotes = settings.invoice_notes || ''
      const cust     = invoice.customers

      let y = 12

      // ── Load logo (async, top-right) ─────────────────────────────────
      let logoB64 = '', logoType = 'PNG'
      if (logoUrl) {
        try {
          const blob = await fetch(logoUrl).then(r => r.blob())
          logoB64 = await new Promise<string>(res => {
            const reader = new FileReader()
            reader.onload = () => res(reader.result as string)
            reader.readAsDataURL(blob)
          })
          logoType = blob.type.includes('png') ? 'PNG' : 'JPEG'
        } catch {}
      }

      // ── Register Noto Sans (Unicode — ₹ and all scripts) ─────────────────
      const noto = await loadNotoSans()
      doc.addFileToVFS('NotoSans-Regular.ttf', noto.regular)
      doc.addFileToVFS('NotoSans-Bold.ttf', noto.bold)
      doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
      doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold')
      doc.setFont('NotoSans', 'normal') // default for entire document

      // ── SECTION 1 — HEADER ───────────────────────────────────────────
      doc.setFontSize(10)
      doc.setFont('NotoSans', 'bold')
      doc.setTextColor(0, 119, 167)
      doc.text('INVOICE', ML, y)

      doc.setFontSize(7.5)
      doc.setFont('NotoSans', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text('ORIGINAL FOR RECIPIENT', MR, y, { align: 'right' })
      y += 6

      if (logoB64) doc.addImage(logoB64, logoType, MR - 30, 10, 30, 30)

      // Business name
      doc.setFontSize(15)
      doc.setFont('NotoSans', 'bold')
      doc.setTextColor(20, 20, 20)
      doc.text(bName.toUpperCase(), ML, y)
      y += 6

      // Address (wrap, leave room for logo)
      if (bAddress) {
        const addrW = logoB64 ? 138 : CW
        const addrLines = doc.splitTextToSize(bAddress, addrW)
        doc.setFontSize(7.5)
        doc.setFont('NotoSans', 'normal')
        doc.setTextColor(60, 60, 60)
        addrLines.forEach((l: string) => { doc.text(l, ML, y); y += 3.8 })
      }

      // Phone / Email / GSTIN
      const contactParts = [
        bPhone && `Mobile ${bPhone}`,
        bEmail && `Email ${bEmail}`,
      ].filter(Boolean)
      if (contactParts.length) {
        doc.setFontSize(7.5)
        doc.setFont('NotoSans', 'normal')
        doc.setTextColor(60, 60, 60)
        doc.text(contactParts.join('   '), ML, y)
        y += 3.8
      }
      if (bGstin) {
        doc.setFontSize(7.5)
        doc.setFont('NotoSans', 'normal')
        doc.setTextColor(60, 60, 60)
        doc.text(`GSTIN: ${bGstin}`, ML, y)
        y += 3.8
      }

      if (logoB64) y = Math.max(y, 43) // clear logo height
      y += 2

      // ── DIVIDER ──────────────────────────────────────────────────────
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3)
      doc.line(ML, y, MR, y); y += 5

      // ── SECTION 2 — INVOICE INFO ROW ─────────────────────────────────
      const c1 = ML, c2 = ML + CW / 3, c3 = ML + (CW * 2) / 3

      doc.setFontSize(7.5); doc.setFont('NotoSans', 'normal'); doc.setTextColor(80, 80, 80)
      doc.text('Invoice #:', c1, y)
      doc.text('Invoice Date:', c2, y)
      if (invoice.due_date) doc.text('Due Date:', c3, y)
      y += 4

      doc.setFontSize(8.5); doc.setFont('NotoSans', 'bold'); doc.setTextColor(20, 20, 20)
      doc.text(invoice.invoice_number, c1, y)
      doc.text(fmtDate(invoice.issue_date), c2, y)
      if (invoice.due_date) doc.text(fmtDate(invoice.due_date), c3, y)
      y += 8

      // ── DIVIDER ──────────────────────────────────────────────────────
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3)
      doc.line(ML, y, MR, y); y += 5

      // ── SECTION 3 — CUSTOMER INFO (3 cols) ───────────────────────────
      const colW3 = CW / 3

      doc.setFontSize(7.5); doc.setFont('NotoSans', 'normal'); doc.setTextColor(80, 80, 80)
      doc.text('Customer Details:', c1, y)
      doc.text('Billing Address:', c2, y)
      doc.text('Shipping Address:', c3, y)
      y += 4

      doc.setFont('NotoSans', 'bold'); doc.setFontSize(8.5); doc.setTextColor(20, 20, 20)
      doc.text(cust.name ?? '', c1, y)

      const custAddr  = [cust.address, cust.city].filter(Boolean).join(', ')
      const custLines = doc.splitTextToSize(custAddr || '—', colW3 - 3)
      doc.setFont('NotoSans', 'normal'); doc.setFontSize(7.5); doc.setTextColor(60, 60, 60)
      let bilY = y, shiY = y
      custLines.forEach((l: string) => { doc.text(l, c2, bilY); bilY += 3.5 })
      custLines.forEach((l: string) => { doc.text(l, c3, shiY); shiY += 3.5 })

      y += 4
      if (cust.gstin) {
        doc.setFontSize(7.5); doc.setFont('NotoSans', 'normal'); doc.setTextColor(60, 60, 60)
        doc.text(`GSTIN: ${cust.gstin}`, c1, y); y += 4
      }
      y = Math.max(y, bilY, shiY) + 4

      // ── DIVIDER ──────────────────────────────────────────────────────
      doc.setDrawColor(160, 160, 160); doc.setLineWidth(0.5)
      doc.line(ML, y, MR, y); y += 1

      // ── SECTION 4 — LINE ITEMS TABLE ─────────────────────────────────
      const tNum  = ML,       tItem = ML + 8
      const tRate = ML + 88,  tQty  = ML + 124, tAmt = MR

      // Header row
      doc.setFillColor(34, 34, 34)
      doc.rect(ML, y, CW, 8, 'F')
      doc.setFont('NotoSans', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255)
      const hY = y + 5.3
      doc.text('#', tNum + 1, hY)
      doc.text('Item', tItem, hY)
      doc.text('Rate / Item', tRate, hY)
      doc.text('Qty', tQty, hY)
      doc.text('Amount', tAmt, hY, { align: 'right' })
      y += 8

      // Data rows
      invoice.invoice_items.forEach((item, idx) => {
        const rH = 7
        if (idx % 2 === 1) {
          doc.setFillColor(248, 249, 250)
          doc.rect(ML, y, CW, rH, 'F')
        }
        doc.setFont('NotoSans', 'normal'); doc.setFontSize(8); doc.setTextColor(30, 30, 30)
        const rY = y + 4.5
        doc.text(String(idx + 1), tNum + 1, rY)
        doc.text(item.description.substring(0, 38), tItem, rY)
        doc.text(fmt(item.unit_price), tRate, rY)
        doc.text(`${item.quantity} ${(item.unit ?? '').toUpperCase()}`, tQty, rY)
        doc.text(fmt(item.line_total ?? item.quantity * item.unit_price), tAmt, rY, { align: 'right' })
        y += rH
      })

      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3)
      doc.line(ML, y, MR, y); y += 5

      // ── SECTION 5 — TOTALS (right-aligned) ───────────────────────────
      const tLX = ML + CW * 0.55

      if ((invoice.discount_amount ?? 0) > 0) {
        doc.setFont('NotoSans', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60, 60, 60)
        const dl = invoice.discount_type === 'pct'
          ? `Discount (${invoice.discount_value}%)` : 'Discount'
        doc.text(dl, tLX, y)
        doc.setTextColor(180, 30, 30)
        doc.text(`- ₹${fmt(invoice.discount_amount ?? 0)}`, MR, y, { align: 'right' })
        y += 7
      }

      if (invoice.apply_gst) {
        doc.setFont('NotoSans', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60, 60, 60)
        doc.text(`GST (${invoice.gst_rate}%)`, tLX, y)
        doc.setTextColor(30, 30, 30)
        doc.text(`₹${fmt(invoice.gst_amount)}`, MR, y, { align: 'right' })
        y += 7
      }

      // Total line
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3)
      doc.line(tLX - 2, y - 2, MR, y - 2)
      doc.setFont('NotoSans', 'bold'); doc.setFontSize(12); doc.setTextColor(20, 20, 20)
      doc.text('Total', tLX, y + 5)
      doc.text(`₹${fmt(invoice.total)}`, MR, y + 5, { align: 'right' })
      y += 12

      // ── DIVIDER ──────────────────────────────────────────────────────
      doc.setDrawColor(160, 160, 160); doc.setLineWidth(0.5)
      doc.line(ML, y, MR, y); y += 1

      // ── SECTION 6 — FOOTER STRIP ─────────────────────────────────────
      const stripH = 17
      doc.setFillColor(247, 247, 247)
      doc.rect(ML, y, CW, stripH, 'F')

      const totalQty  = invoice.invoice_items.reduce((s, i) => s + i.quantity, 0)
      const amtWords  = numberToWords(invoice.total)
      const hasDisc   = (invoice.discount_amount ?? 0) > 0

      doc.setFontSize(7.5); doc.setFont('NotoSans', 'normal'); doc.setTextColor(60, 60, 60)
      doc.text(`Total Items / Qty : ${invoice.invoice_items.length} / ${totalQty}`, ML + 2, y + 5)
      if (hasDisc) {
        doc.text(`Total Discount : ₹${fmt(invoice.discount_amount ?? 0)}`, ML + 2, y + 10)
      }
      const wordsStr  = `Total amount (in words): ${amtWords}`
      const wordsLines = doc.splitTextToSize(wordsStr, CW * 0.65)
      const wordsStartY = hasDisc ? y + 14 : y + 10
      wordsLines.forEach((l: string, i: number) => doc.text(l, ML + 2, wordsStartY + i * 3.5))

      // Amount payable (right)
      doc.setFont('NotoSans', 'bold'); doc.setFontSize(8.5); doc.setTextColor(20, 20, 20)
      doc.text('Amount Payable:', MR - 44, y + 7)
      doc.text(`₹${fmt(invoice.total)}`, MR, y + 7, { align: 'right' })

      doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.5)
      doc.line(ML, y + stripH, MR, y + stripH)
      y += stripH + 8

      // ── SECTION 7 — SIGNATURE ────────────────────────────────────────
      const sigUrl = settings.signature_url || null

      // Load signature image async (if set)
      let sigB64 = '', sigType = 'PNG'
      if (sigUrl) {
        try {
          const blob = await fetch(sigUrl).then(r => r.blob())
          sigB64 = await new Promise<string>(res => {
            const reader = new FileReader()
            reader.onload = () => res(reader.result as string)
            reader.readAsDataURL(blob)
          })
          sigType = blob.type.includes('png') ? 'PNG' : 'JPEG'
        } catch {}
      }

      doc.setFontSize(8); doc.setFont('NotoSans', 'normal'); doc.setTextColor(50, 50, 50)
      doc.text(`For ${bName.toUpperCase()}`, MR, y, { align: 'right' })
      y += 4

      // Signature image (48mm wide, 18mm tall), right-aligned
      if (sigB64) {
        doc.addImage(sigB64, sigType, MR - 52, y, 52, 18)
        y += 20
      } else {
        y += 20 // blank space when no signature uploaded
      }

      doc.setDrawColor(160, 160, 160); doc.setLineWidth(0.4)
      doc.line(MR - 52, y, MR, y)
      y += 4
      doc.setFontSize(7.5); doc.setTextColor(80, 80, 80)
      doc.text('Authorized Signatory', MR - 26, y, { align: 'center' })
      y += 10

      // ── SECTION 8 — NOTES & T&C ──────────────────────────────────────
      const noteText = invoice.notes || invNotes
      if (noteText) {
        doc.setFontSize(8); doc.setFont('NotoSans', 'bold'); doc.setTextColor(20, 20, 20)
        doc.text('Notes:', ML, y); y += 4
        doc.setFont('NotoSans', 'normal'); doc.setFontSize(7.5); doc.setTextColor(60, 60, 60)
        doc.splitTextToSize(`"${noteText}"`, CW)
          .forEach((l: string) => { doc.text(l, ML, y); y += 3.5 })
        y += 3
      }

      doc.setFontSize(8); doc.setFont('NotoSans', 'bold'); doc.setTextColor(20, 20, 20)
      doc.text('Terms and Conditions:', ML, y); y += 4
      doc.setFont('NotoSans', 'normal'); doc.setFontSize(7.5); doc.setTextColor(60, 60, 60)
      doc.text('1. Goods once sold will not be taken back or exchanged', ML, y); y += 3.8
      doc.text('2. All disputes are subject to COIMBATORE jurisdiction only', ML, y)

      doc.save(`${invoice.invoice_number}.pdf`)
    })
  }

  const outstanding = invoice.total - invoice.amount_paid
  const canMarkSent = invoice.status === 'draft'
  const canMarkPaid = invoice.status === 'sent' || invoice.status === 'partial'
  const canDelete = invoice.status === 'draft'

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/invoices')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All Invoices
        </button>
        <div className="flex items-center gap-2">
          <button
            id="btn-download-pdf"
            onClick={downloadPDF}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#1a2235] hover:bg-[#1e2d45] text-slate-300 border border-[#1e2d45] transition-all"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          {canMarkSent && (
            <button
              id="btn-mark-sent"
              onClick={() => handleStatus('sent')}
              disabled={isPending}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-all disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Mark Sent
            </button>
          )}
          {canMarkPaid && (
            <button
              id="btn-mark-paid"
              onClick={() => handleStatus('paid')}
              disabled={isPending}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-all disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Mark Paid
            </button>
          )}
          {canDelete && (
            <button
              id="btn-delete-invoice"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>
      )}

      {/* Invoice card */}
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl overflow-hidden">
        {/* Invoice header */}
        <div className="bg-gradient-to-r from-[#0d1525] to-[#111827] px-6 py-5 border-b border-[#1e2d45]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100 tracking-tight">{invoice.invoice_number}</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Issued {fmtDate(invoice.issue_date)}
                  {invoice.due_date && ` · Due ${fmtDate(invoice.due_date)}`}
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border capitalize ${STATUS_STYLE[invoice.status] ?? STATUS_STYLE.draft}`}>
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Bill To */}
        <div className="px-6 py-4 border-b border-[#1e2d45]">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1">Bill To</p>
          <p className="text-base font-semibold text-slate-200">{invoice.customers.name}</p>
          {(invoice.customers.address || invoice.customers.city) && (
            <p className="text-sm text-slate-500 mt-0.5">
              {[invoice.customers.address, invoice.customers.city].filter(Boolean).join(', ')}
            </p>
          )}
          {invoice.customers.gstin && (
            <p className="text-xs font-mono text-slate-600 mt-1">GSTIN: {invoice.customers.gstin}</p>
          )}
        </div>

        {/* Line items table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2d45] bg-[#0d1525]">
                {['#', 'Description', 'Unit', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest ${i >= 4 ? 'text-right' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoice.invoice_items.map((item, idx) => (
                <tr key={item.id} className="border-b border-[#1e2d45] last:border-0">
                  <td className="px-4 py-3 text-xs text-slate-600">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{item.unit ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-slate-400 text-right">₹{fmt(item.unit_price)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-200 text-right">
                    ₹{fmt(item.line_total ?? item.quantity * item.unit_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 border-t border-[#1e2d45] flex justify-end">
          <div className="space-y-2 min-w-[220px]">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono">₹{fmt(invoice.subtotal)}</span>
            </div>
            {(invoice.discount_amount ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-green-500">
                <span>
                  Discount
                  {invoice.discount_type === 'pct' && ` (${invoice.discount_value}%)`}
                </span>
                <span className="font-mono">−₹{fmt(invoice.discount_amount ?? 0)}</span>
              </div>
            )}
            {invoice.apply_gst && (
              <div className="flex justify-between text-sm text-slate-400">
                <span>GST ({invoice.gst_rate}%)</span>
                <span className="font-mono">₹{fmt(invoice.gst_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-100 pt-2 border-t border-[#1e2d45]">
              <span>Total</span>
              <span className="font-mono text-green-400">₹{fmt(invoice.total)}</span>
            </div>
            {invoice.amount_paid > 0 && (
              <>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Paid</span>
                  <span className="font-mono text-green-500">₹{fmt(invoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-amber-400 pt-1 border-t border-[#1e2d45]">
                  <span>Outstanding</span>
                  <span className="font-mono">₹{fmt(outstanding)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="px-6 py-4 border-t border-[#1e2d45] bg-[#0d1525]">
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest mb-1">Notes</p>
            <p className="text-sm text-slate-400">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">Delete Invoice</h3>
            <p className="text-sm text-slate-400 mb-5">
              Permanently delete <span className="font-semibold text-slate-200">{invoice.invoice_number}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={isPending} className="flex-1 py-2.5 bg-[#1a2235] hover:bg-[#1e2d45] text-slate-300 font-semibold text-sm rounded-xl border border-[#1e2d45] transition-all">Cancel</button>
              <button id="btn-confirm-delete" onClick={handleDelete} disabled={isPending} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-semibold text-sm rounded-xl transition-all disabled:opacity-60">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
