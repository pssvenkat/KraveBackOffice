'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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
  discount_type: z.enum(['none', 'pct', 'flat']).default('none'),
  discount_value: z.coerce.number().min(0).default(0),
  notes: z.string().max(500).optional(),
  items: z.string().min(1, 'Add at least one line item'),
})

// ─── Invoice number generator ─────────────────────────────────────────────

async function nextInvoiceNumber(supabase: Awaited<ReturnType<typeof createClient>>) {
  // Read prefix from settings (empty string = no prefix)
  const { data: prefixRow } = await createServiceClient()
    .from('app_settings')
    .select('value')
    .eq('key', 'invoice_prefix')
    .maybeSingle()
  const prefix = (prefixRow?.value ?? '').trim()

  let seq = 0

  if (prefix) {
    // Find highest invoice number that starts with this prefix
    const { data } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `${prefix}%`)
      .order('invoice_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data?.invoice_number) {
      const numPart = data.invoice_number.slice(prefix.length)
      const n = parseInt(numPart, 10)
      if (!isNaN(n)) seq = n
    }
  } else {
    // No prefix — look for purely numeric invoice numbers
    const { data: rows } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(200)

    for (const row of rows ?? []) {
      if (/^\d+$/.test(row.invoice_number)) {
        const n = parseInt(row.invoice_number, 10)
        if (!isNaN(n) && n > seq) seq = n
      }
    }
  }

  return `${prefix}${String(seq + 1).padStart(3, '0')}`
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
    discount_type: formData.get('discount_type') || 'none',
    discount_value: formData.get('discount_value') || 0,
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
  const { discount_type, discount_value } = validated.data
  const discountAmount =
    discount_type === 'pct' ? Math.min(subtotal, (subtotal * discount_value) / 100)
    : discount_type === 'flat' ? Math.min(subtotal, discount_value)
    : 0
  const netAmount = subtotal - discountAmount
  const gstRate = 5
  const gstAmount = applyGst ? Math.round(netAmount * gstRate) / 100 : 0
  const total = netAmount + gstAmount

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
      discount_type: validated.data.discount_type,
      discount_value: validated.data.discount_value,
      discount_amount: discountAmount,
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
