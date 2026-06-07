import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CustomersClient from '@/components/customers/CustomersClient'

export const metadata: Metadata = { title: 'Customers' }

export default async function CustomersPage() {
  const supabase = await createClient()

  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, email, phone, address, city, gstin, notes, created_at')
    .eq('is_active', true)
    .order('name')

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Customers</h1>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-sm text-red-400">
          Failed to load customers: {error.message}
          {error.message.includes('relation') && (
            <p className="mt-2 text-xs text-red-500">
              The customers table doesn&apos;t exist yet. Please run the SQL from DATABASE_SCHEMA.md in your Supabase SQL Editor.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Customers</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your customer list — used across all invoices
        </p>
      </div>

      <CustomersClient customers={customers ?? []} />
    </div>
  )
}
