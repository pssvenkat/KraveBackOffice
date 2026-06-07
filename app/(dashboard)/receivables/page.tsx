import type { Metadata } from 'next'
import { CreditCard } from 'lucide-react'

export const metadata: Metadata = { title: 'Receivables' }

export default function ReceivablesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Receivables</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track outstanding payments and overdue invoices</p>
      </div>
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <CreditCard className="w-12 h-12 text-slate-700 mb-4" />
        <p className="text-base font-semibold text-slate-400">No outstanding receivables</p>
        <p className="text-sm text-slate-600 mt-1">Coming in Phase 4 — Receivables & Payments</p>
      </div>
    </div>
  )
}
