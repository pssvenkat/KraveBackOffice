'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Send, CheckCircle2, Clock, CircleDot } from 'lucide-react'

type Invoice = {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string | null
  status: string
  total: number
  amount_paid: number
  customers: { name: string } | null
}

const STATUSES = ['all', 'draft', 'sent', 'partial', 'paid'] as const

const STATUS_ICON: Record<string, typeof FileText> = {
  draft: FileText,
  sent: Send,
  partial: CircleDot,
  paid: CheckCircle2,
}

const STATUS_STYLE: Record<string, string> = {
  draft:   'bg-slate-500/15 text-slate-400 border-slate-500/20',
  sent:    'bg-blue-500/15 text-blue-400 border-blue-500/20',
  paid:    'bg-green-500/15 text-green-400 border-green-500/20',
  partial: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
}

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export default function InvoicesClient({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter()
  const [activeStatus, setActiveStatus] = useState<typeof STATUSES[number]>('all')

  const filtered = useMemo(() =>
    activeStatus === 'all' ? invoices : invoices.filter((i) => i.status === activeStatus),
    [invoices, activeStatus]
  )

  // Summary KPIs
  const totalOutstanding = invoices
    .filter((i) => i.status === 'sent' || i.status === 'partial')
    .reduce((s, i) => s + (i.total - i.amount_paid), 0)
  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + i.total, 0)
  const draftCount = invoices.filter((i) => i.status === 'draft').length

  const isOverdue = (inv: Invoice) => {
    if (!inv.due_date || inv.status === 'paid') return false
    return new Date(inv.due_date) < new Date()
  }

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Outstanding', value: fmt(totalOutstanding), color: 'text-amber-400' },
          { label: 'Collected', value: fmt(totalPaid), color: 'text-green-400' },
          { label: 'Drafts', value: String(draftCount), color: 'text-slate-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111827] border border-[#1e2d45] rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{label}</p>
            <p className={`text-lg font-bold mt-1 font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              id={`tab-${s}`}
              onClick={() => setActiveStatus(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                activeStatus === s
                  ? 'bg-[#111827] text-slate-100 shadow-sm border border-[#1e2d45]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {s} {s !== 'all' && `(${invoices.filter((i) => i.status === s).length})`}
            </button>
          ))}
        </div>
        <button
          id="btn-new-invoice"
          onClick={() => router.push('/invoices/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-green-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-14 flex flex-col items-center justify-center text-center">
          <FileText className="w-12 h-12 text-slate-700 mb-4" />
          <p className="text-base font-semibold text-slate-400">No {activeStatus === 'all' ? '' : activeStatus + ' '}invoices</p>
          {activeStatus === 'all' && (
            <button
              onClick={() => router.push('/invoices/new')}
              className="mt-5 flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create First Invoice
            </button>
          )}
        </div>
      )}

      {/* List */}
      {filtered.length > 0 && (
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2d45]">
                  {['Invoice #', 'Customer', 'Date', 'Due', 'Amount', 'Status', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const overdue = isOverdue(inv)
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                      className="border-b border-[#1e2d45] last:border-0 hover:bg-[#1a2235] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-mono font-semibold text-slate-200">{inv.invoice_number}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-300">{inv.customers?.name ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-400">{fmtDate(inv.issue_date)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {inv.due_date ? (
                          <span className={`text-sm ${overdue ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
                            {fmtDate(inv.due_date)}
                          </span>
                        ) : <span className="text-slate-700 text-sm">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-mono font-medium text-slate-200">{fmt(inv.total)}</span>
                        {inv.amount_paid > 0 && inv.status !== 'paid' && (
                          <p className="text-xs text-amber-400 font-mono">
                            {fmt(inv.total - inv.amount_paid)} due
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full border capitalize ${STATUS_STYLE[inv.status] ?? ''}`}>
                          {inv.status}
                          {overdue && inv.status !== 'paid' && (
                            <Clock className="w-3 h-3" />
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-600 hover:text-green-400 transition-colors">View →</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
