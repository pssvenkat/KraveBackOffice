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

export default function InvoiceDetail({ invoice }: { invoice: Invoice }) {
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
    // Dynamic import so jsPDF only loads client-side
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210
      const margin = 20
      const contentW = pageW - margin * 2
      let y = 20

      // Header — Brand
      doc.setFillColor(17, 24, 39)
      doc.rect(0, 0, pageW, 40, 'F')
      doc.setTextColor(34, 197, 94)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('KRAVE MICROGREENS', margin, y + 8)
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.setFont('helvetica', 'normal')
      doc.text('Fresh Microgreens | Quality You Can Taste', margin, y + 15)

      // Invoice badge
      doc.setFillColor(34, 197, 94)
      doc.roundedRect(pageW - margin - 40, y, 40, 14, 3, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(invoice.status.toUpperCase(), pageW - margin - 20, y + 9, { align: 'center' })

      y = 50

      // Invoice number + dates
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(`Invoice ${invoice.invoice_number}`, margin, y)
      y += 8
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Issue Date: ${fmtDate(invoice.issue_date)}`, margin, y)
      if (invoice.due_date) {
        doc.text(`Due Date: ${fmtDate(invoice.due_date)}`, margin + 65, y)
      }
      y += 12

      // Bill To
      doc.setFillColor(245, 247, 250)
      doc.rect(margin, y, contentW, invoice.customers.gstin ? 28 : 24, 'F')
      y += 5
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'bold')
      doc.text('BILL TO', margin + 4, y)
      y += 5
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(10)
      doc.text(invoice.customers.name, margin + 4, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)
      const addr = [invoice.customers.address, invoice.customers.city].filter(Boolean).join(', ')
      if (addr) { doc.text(addr, margin + 4, y); y += 4 }
      if (invoice.customers.gstin) { doc.text(`GSTIN: ${invoice.customers.gstin}`, margin + 4, y); y += 4 }
      y += 6

      // Table header
      doc.setFillColor(17, 24, 39)
      doc.rect(margin, y, contentW, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('#', margin + 2, y + 5.5)
      doc.text('DESCRIPTION', margin + 8, y + 5.5)
      doc.text('UNIT', margin + 100, y + 5.5)
      doc.text('QTY', margin + 118, y + 5.5)
      doc.text('RATE', margin + 132, y + 5.5)
      doc.text('AMOUNT', pageW - margin - 2, y + 5.5, { align: 'right' })
      y += 8

      // Table rows
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 30, 30)
      invoice.invoice_items.forEach((item, idx) => {
        const rowH = 7
        if (idx % 2 === 0) { doc.setFillColor(252, 252, 252); doc.rect(margin, y, contentW, rowH, 'F') }
        doc.setFontSize(8)
        doc.text(String(idx + 1), margin + 2, y + 4.5)
        doc.text(item.description.substring(0, 45), margin + 8, y + 4.5)
        doc.text(item.unit ?? '', margin + 100, y + 4.5)
        doc.text(String(item.quantity), margin + 118, y + 4.5)
        doc.text(`₹${fmt(item.unit_price)}`, margin + 132, y + 4.5)
        doc.text(`₹${fmt(item.line_total ?? item.quantity * item.unit_price)}`, pageW - margin - 2, y + 4.5, { align: 'right' })
        y += rowH
      })

      // Totals
      y += 4
      doc.setDrawColor(220, 220, 220)
      doc.line(margin + contentW / 2, y, pageW - margin, y)
      y += 5
      const totalsX = margin + contentW / 2
      const totalsValX = pageW - margin - 2
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      doc.text('Subtotal', totalsX + 20, y)
      doc.text(`₹${fmt(invoice.subtotal)}`, totalsValX, y, { align: 'right' })
      if ((invoice.discount_amount ?? 0) > 0) {
        y += 6
        const discLabel = invoice.discount_type === 'pct'
          ? `Discount (${invoice.discount_value}%)`
          : 'Discount'
        doc.setTextColor(34, 197, 94)
        doc.text(discLabel, totalsX + 20, y)
        doc.text(`-₹${fmt(invoice.discount_amount ?? 0)}`, totalsValX, y, { align: 'right' })
        doc.setTextColor(80, 80, 80)
      }
      if (invoice.apply_gst) {
        y += 6
        doc.text(`GST (${invoice.gst_rate}%)`, totalsX + 20, y)
        doc.text(`₹${fmt(invoice.gst_amount)}`, totalsValX, y, { align: 'right' })
      }
      y += 8
      doc.setFillColor(17, 24, 39)
      doc.rect(totalsX + 16, y - 5, pageW - margin - totalsX - 16, 10, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('TOTAL', totalsX + 20, y + 2)
      doc.text(`₹${fmt(invoice.total)}`, totalsValX, y + 2, { align: 'right' })
      y += 16

      // Notes
      if (invoice.notes) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(invoice.notes, margin, y)
        y += 8
      }

      // Footer
      doc.setFillColor(245, 247, 250)
      doc.rect(0, 280, pageW, 17, 'F')
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text('Thank you for your business with Krave Microgreens!', pageW / 2, 288, { align: 'center' })

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
