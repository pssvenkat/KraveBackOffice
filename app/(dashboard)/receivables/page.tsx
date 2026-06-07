import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ReceivablesClient from '@/components/receivables/ReceivablesClient'

export const metadata: Metadata = { title: 'Receivables' }

export default async function ReceivablesPage() {
  const supabase = await createClient()

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, issue_date, due_date, status, total, amount_paid, customers(name)')
    .in('status', ['sent', 'partial'])
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error?.message.includes('relation')) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Receivables</h1>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-sm text-amber-300 space-y-2">
          <p className="font-semibold">⚠️ Tables not set up yet</p>
          <p className="text-amber-400/80">Run Phase 3 SQL (invoices + invoice_items) and Phase 4 SQL (payments) from <code className="bg-[#0a0f1a] px-1.5 py-0.5 rounded text-xs">DATABASE_SCHEMA.md</code>.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Receivables</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track outstanding payments with aging — record full or partial receipts
        </p>
      </div>
      <ReceivablesClient invoices={(invoices ?? []) as any} />
    </div>
  )
}
