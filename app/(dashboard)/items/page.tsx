import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CatalogItemsClient from '@/components/items/CatalogItemsClient'

export const metadata: Metadata = { title: 'Items Catalog' }

export default async function ItemsPage() {
  const supabase = await createClient()

  const { data: items, error } = await supabase
    .from('catalog_items')
    .select('id, name, description, uom, default_price, hsn_code')
    .eq('is_active', true)
    .order('name')

  // Table missing or any other DB error — show setup banner, don't crash
  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Items Catalog</h1>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 space-y-2">
          <p className="text-sm font-semibold text-amber-300">⚠️ Items table not set up yet</p>
          <p className="text-xs text-amber-400/80">
            Run the <code className="bg-[#0a0f1a] px-1.5 py-0.5 rounded">catalog_items</code> SQL
            from <code className="bg-[#0a0f1a] px-1.5 py-0.5 rounded">DATABASE_SCHEMA.md</code> in your{' '}
            <a
              href="https://supabase.com/dashboard/project/eostzwmrakhfbbehytaw/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-300"
            >
              Supabase SQL Editor →
            </a>
          </p>
          <p className="text-xs text-slate-600 font-mono mt-2">DB error: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Items Catalog</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your products &amp; services — select them in invoices to auto-fill UOM and price
        </p>
      </div>
      <CatalogItemsClient items={items ?? []} />
    </div>
  )
}
