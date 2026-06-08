import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import InvoiceForm from '@/components/invoices/InvoiceForm'

export const metadata: Metadata = { title: 'New Invoice' }

export default async function NewInvoicePage() {
  const supabase = await createClient()

  const [{ data: customers }, catalogResult] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, gstin')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('catalog_items')
      .select('id, name, description, uom, default_price')
      .eq('is_active', true)
      .order('name'),
  ])

  // catalog_items may not exist yet — fall back to empty list gracefully
  const catalogItems = catalogResult.error ? [] : (catalogResult.data ?? [])

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">New Invoice</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {catalogItems.length > 0
            ? 'Select items from your catalog to auto-fill UOM and rate'
            : 'Add line items manually — set up Items Catalog for auto-fill'}
        </p>
      </div>
      <InvoiceForm customers={customers ?? []} catalogItems={catalogItems} />
    </div>
  )
}
