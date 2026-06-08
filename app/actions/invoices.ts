'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────

export type InvoiceFormState = {
  errors?: Record<string, string[]>
  message?: string | null
  success?: boolean
  invoiceId?: string
}

export type LineItemInput = {
  description: string
  unit: string
  quantity: number
  unit_price: number
}

// ─── Schema ───────────────────────────────────────────────────────────────

const InvoiceSchema = z.object({
  customer_id: z.string().uuid('Select a customer'),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().optional(),
  apply_gst: z.boolean().default(false),
  notes: z.string().max(500).optional(),
  items: z.string().min(1, 'Add at least one line item'),
})

// ─── Invoice number generator ─────────────────────────────────────────────

async function nextInvoiceNumber(supabase: Awaited<ReturnType<typeof createClient>>) {
  const year = new Date().getFullYear()
  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `KM-${year}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  let seq = 1
  if (data?.invoice_number) {
    const parts = data.invoice_number.split('-')
    seq = parseInt(parts[2] ?? '0') + 1
  }
  return `KM-${year}-${String(seq).padStart(3, '0')}`
}

// ─── Create Invoice ───────────────────────────────────────────────────────

export async function createInvoice(
  prevState: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Unauthorized', success: false }

  const applyGst = formData.get('apply_gst') === 'on'
  const validated = InvoiceSchema.safeParse({
    customer_id: formData.get('customer_id'),
    issue_date: formData.get('issue_date'),
    due_date: formData.get('due_date') || undefined,
    apply_gst: applyGst,
    notes: formData.get('notes') || undefined,
    items: formData.get('items'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, success: false }
  }

  let lineItems: LineItemInput[]
  try {
    lineItems = JSON.parse(validated.data.items)
    if (!Array.isArray(lineItems) || lineItems.length === 0)
      return { errors: { items: ['Add at least one line item'] }, success: false }
  } catch {
    return { errors: { items: ['Invalid line items'] }, success: false }
  }

  // Compute totals
  const subtotal = lineItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
  const gstRate = 5
  const gstAmount = applyGst ? Math.round(subtotal * gstRate) / 100 : 0
  const total = subtotal + gstAmount

  const invoiceNumber = await nextInvoiceNumber(supabase)

  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      customer_id: validated.data.customer_id,
      issue_date: validated.data.issue_date,
      due_date: validated.data.due_date || null,
      apply_gst: applyGst,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      subtotal,
      total,
      notes: validated.data.notes || null,
      status: 'draft',
    })
    .select('id')
    .single()

  if (invErr || !invoice) return { message: invErr?.message ?? 'Failed to create invoice', success: false }

  const { error: itemsErr } = await supabase.from('invoice_items').insert(
    lineItems.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      unit: item.unit || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))
  )

  if (itemsErr) {
    // Rollback invoice on items failure
    await supabase.from('invoices').delete().eq('id', invoice.id)
    return { message: itemsErr.message, success: false }
  }

  revalidatePath('/invoices')
  redirect(`/invoices/${invoice.id}`)
}

// ─── Update Invoice Status ────────────────────────────────────────────────


export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'draft' | 'sent' | 'paid' | 'partial'
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', invoiceId)

  if (error) return { error: error.message }

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
  return {}
}

// ─── Delete Invoice ───────────────────────────────────────────────────────

export async function deleteInvoice(invoiceId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return { error: 'Unauthorized' }

  const { data: inv, error: fetchErr } = await supabase
    .from('invoices')
    .select('status')
    .eq('id', invoiceId)
    .single()

  if (fetchErr || !inv) return { error: 'Invoice not found' }
  if (inv.status !== 'draft') return { error: 'Only draft invoices can be deleted' }

  await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)
  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)

  if (error) return { error: error.message }

  revalidatePath('/invoices')
  return {}
}
