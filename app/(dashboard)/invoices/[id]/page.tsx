import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/app/actions/settings'
import InvoiceDetail from '@/components/invoices/InvoiceDetail'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('id', id)
    .single()
  return { title: data?.invoice_number ?? 'Invoice' }
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: invoice, error }, settings] = await Promise.all([
    supabase
      .from('invoices')
      .select(`
        id, invoice_number, issue_date, due_date, status,
        subtotal, discount_type, discount_value, discount_amount,
        apply_gst, gst_rate, gst_amount, total, amount_paid, notes,
        customers(name, email, phone, address, city, gstin),
        invoice_items(id, description, unit, quantity, unit_price, line_total)
      `)
      .eq('id', id)
      .single(),
    getSettings(),
  ])

  if (error || !invoice) notFound()

  return <InvoiceDetail invoice={invoice as any} logoUrl={settings.logo_url ?? null} settings={settings} />
}
