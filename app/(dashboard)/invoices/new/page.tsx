import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import InvoiceForm from '@/components/invoices/InvoiceForm'

export const metadata: Metadata = { title: 'New Invoice' }

export default async function NewInvoicePage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, gstin')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">New Invoice</h1>
        <p className="text-sm text-slate-500 mt-0.5">Create a new invoice with line items and optional 5% GST</p>
      </div>
      <InvoiceForm customers={customers ?? []} />
    </div>
  )
}
