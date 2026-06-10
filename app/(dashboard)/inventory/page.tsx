import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import InventoryClient from '@/components/inventory/InventoryClient'
import LastInventoryDate from '@/components/inventory/LastInventoryDate'

export const metadata: Metadata = { title: 'Inventory' }

export default async function InventoryPage() {
  const supabase = await createClient()

  const [{ data: categories, error: catErr }, { data: items, error: itemErr }, { data: lastDateRow }] =
    await Promise.all([
      supabase
        .from('inventory_categories')
        .select('id, name, icon')
        .order('name'),
      supabase
        .from('inventory_items')
        .select('id, name, category_id, unit, quantity, reorder_level, cost_per_unit, tag, note, is_active, inventory_categories(name, icon)')
        .eq('is_active', true)
        .order('name'),
      createServiceClient()
        .from('app_settings')
        .select('value')
        .eq('key', 'last_inventory_date')
        .maybeSingle(),
    ])

  const lastInventoryDate: string | null = lastDateRow?.value ?? null

  const tablesMissing =
    catErr?.message.includes('relation') || itemErr?.message.includes('relation')

  if (tablesMissing) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Inventory</h1>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-sm text-amber-300 space-y-3">
          <p className="font-semibold">⚠️ Inventory tables not set up yet</p>
          <p className="text-amber-400/80">
            Run the <strong>Phase 2</strong> SQL from <code className="bg-[#0a0f1a] px-1.5 py-0.5 rounded text-xs">DATABASE_SCHEMA.md</code> in your{' '}
            <a href="https://supabase.com/dashboard/project/eostzwmrakhfbbehytaw/sql/new" target="_blank" rel="noreferrer" className="underline hover:text-amber-200">
              Supabase SQL Editor
            </a>.
          </p>
        </div>
      </div>
    )
  }

  if (catErr || itemErr) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Inventory</h1>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-sm text-red-400">
          {catErr?.message || itemErr?.message}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Inventory</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track seeds, trays, and packing materials — get alerted when stock runs low
        </p>
      </div>

      <LastInventoryDate current={lastInventoryDate} />

      <InventoryClient
        categories={categories ?? []}
        items={(items ?? []) as any}
      />
    </div>
  )
}
