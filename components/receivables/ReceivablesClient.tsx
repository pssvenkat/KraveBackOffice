'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Clock, AlertTriangle, CheckCircle2, IndianRupee,
  TrendingUp, Users, ExternalLink
} from 'lucide-react'
import RecordPaymentModal from './RecordPaymentModal'

type ReceivableInvoice = {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string | null
  status: string
  total: number
  amount_paid: number
  customers: { name: string } | null
}

type AgingBucket = 'current' | '1-30' | '31-60' | '60+'

function getAgingBucket(dueDate: string | null): AgingBucket {
  if (!dueDate) return 'current'
  const days = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000)
  if (days <= 0) return 'current'
  if (days <= 30) return '1-30'
  if (days <= 60) return '31-60'
  return '60+'
}

function getDaysOverdue(dueDate: string | null): number {
  if (!dueDate) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000))
}

const BUCKET_CONFIG: Record<AgingBucket, { label: string; color: string; bg: string; border: string }> = {
  'current': { label: 'Current',  color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  '1-30':    { label: '1–30 days', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  '31-60':   { label: '31–60 days', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  '60+':     { label: '60+ days',  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
}

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const FILTERS = ['all', 'current', '1-30', '31-60', '60+'] as const

export default function ReceivablesClient({ invoices }: { invoices: ReceivableInvoice[] }) {
  const router = useRouter()
  const [activeBucket, setActiveBucket] = useState<typeof FILTERS[number]>('all')
  const [paymentInvoice, setPaymentInvoice] = useState<{
    id: string; invoice_number: string; customer_name: string; total: number; amount_paid: number
  } | null>(null)

  // Enrich with aging
  const enriched = useMemo(() =>
    invoices.map((inv) => ({
      ...inv,
      outstanding: inv.total - inv.amount_paid,
      bucket: getAgingBucket(inv.due_date),
      daysOverdue: getDaysOverdue(inv.due_date),
    })),
    [invoices]
  )

  const filtered = useMemo(() =>
    activeBucket === 'all' ? enriched : enriched.filter((i) => i.bucket === activeBucket),
    [enriched, activeBucket]
  )

  // Aging summary KPIs
  const bucketTotals = useMemo(() => {
    const totals: Record<AgingBucket, number> = { 'current': 0, '1-30': 0, '31-60': 0, '60+': 0 }
    enriched.forEach((i) => { totals[i.bucket] += i.outstanding })
    return totals
  }, [enriched])

  const totalOutstanding = enriched.reduce((s, i) => s + i.outstanding, 0)
  const customerCount = new Set(enriched.map((i) => i.customers?.name)).size

  return (
    <>
      {/* Top KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#111827] border border-[#1e2d45] rounded-xl px-4 py-3 sm:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Total Outstanding</p>
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono">{fmt(totalOutstanding)}</p>
          <p className="text-xs text-slate-600 mt-0.5">{enriched.length} invoice{enriched.length !== 1 ? 's' : ''} · {customerCount} customer{customerCount !== 1 ? 's' : ''}</p>
        </div>
        {(Object.entries(BUCKET_CONFIG) as [AgingBucket, typeof BUCKET_CONFIG[AgingBucket]][]).map(([bucket, cfg]) => (
          <div
            key={bucket}
            className={`bg-[#111827] border rounded-xl px-4 py-3 cursor-pointer transition-all hover:border-opacity-60 ${
              activeBucket === bucket ? `${cfg.border} ${cfg.bg}` : 'border-[#1e2d45]'
            }`}
            onClick={() => setActiveBucket(activeBucket === bucket ? 'all' : bucket)}
          >
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{cfg.label}</p>
            <p className={`text-base font-bold font-mono mt-1 ${cfg.color}`}>{fmt(bucketTotals[bucket])}</p>
            <p className="text-xs text-slate-700">{enriched.filter((i) => i.bucket === bucket).length} inv.</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            id={`tab-aging-${f}`}
            onClick={() => setActiveBucket(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
              activeBucket === f
                ? 'bg-[#111827] text-slate-100 shadow-sm border border-[#1e2d45]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {f === 'all' ? 'All' : BUCKET_CONFIG[f as AgingBucket]?.label ?? f}
            {f !== 'all' && (
              <span className="ml-1 text-slate-600">({enriched.filter((i) => i.bucket === f).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-14 flex flex-col items-center text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mb-4" />
          <p className="text-base font-semibold text-slate-400">
            {activeBucket === 'all' ? 'No outstanding receivables' : `No ${BUCKET_CONFIG[activeBucket as AgingBucket]?.label ?? ''} invoices`}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {activeBucket === 'all' ? 'All invoices are paid up 🎉' : 'Nothing in this aging bucket'}
          </p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2d45]">
                  {['Invoice', 'Customer', 'Due Date', 'Total', 'Paid', 'Outstanding', 'Aging', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const cfg = BUCKET_CONFIG[inv.bucket]
                  return (
                    <tr key={inv.id} className="border-b border-[#1e2d45] last:border-0 hover:bg-[#1a2235] transition-colors group">
                      {/* Invoice # */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                          className="flex items-center gap-1.5 text-sm font-mono font-semibold text-slate-200 hover:text-green-400 transition-colors"
                        >
                          {inv.invoice_number}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-300">{inv.customers?.name ?? '—'}</span>
                      </td>

                      {/* Due date */}
                      <td className="px-4 py-3.5">
                        {inv.due_date ? (
                          <div>
                            <p className={`text-sm ${inv.daysOverdue > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                              {fmtDate(inv.due_date)}
                            </p>
                            {inv.daysOverdue > 0 && (
                              <p className="text-xs text-red-500">{inv.daysOverdue}d overdue</p>
                            )}
                          </div>
                        ) : <span className="text-slate-700 text-sm">—</span>}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-mono text-slate-300">{fmt(inv.total)}</span>
                      </td>

                      {/* Paid */}
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-mono ${inv.amount_paid > 0 ? 'text-green-400' : 'text-slate-700'}`}>
                          {inv.amount_paid > 0 ? fmt(inv.amount_paid) : '—'}
                        </span>
                      </td>

                      {/* Outstanding */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-mono font-semibold text-amber-400">{fmt(inv.outstanding)}</span>
                      </td>

                      {/* Aging badge */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                          {inv.daysOverdue > 0 && <AlertTriangle className="w-2.5 h-2.5" />}
                          {cfg.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5">
                        <button
                          id={`btn-record-payment-${inv.id}`}
                          onClick={() => setPaymentInvoice({
                            id: inv.id,
                            invoice_number: inv.invoice_number,
                            customer_name: inv.customers?.name ?? '',
                            total: inv.total,
                            amount_paid: inv.amount_paid,
                          })}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-colors opacity-0 group-hover:opacity-100 whitespace-nowrap"
                        >
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* Footer total */}
              <tfoot>
                <tr className="border-t border-[#1e2d45] bg-[#0d1525]">
                  <td colSpan={5} className="px-4 py-2.5 text-xs text-slate-600">
                    {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-mono font-bold text-amber-400">
                    {fmt(filtered.reduce((s, i) => s + i.outstanding, 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <RecordPaymentModal
        open={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        invoice={paymentInvoice}
      />
    </>
  )
}
