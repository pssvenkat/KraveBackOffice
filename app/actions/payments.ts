'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type PaymentFormState = {
  errors?: Record<string, string[]>
  message?: string | null
  success?: boolean
}

const PaymentSchema = z.object({
  invoice_id: z.string().uuid('Invalid invoice'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  payment_method: z.enum(['cash', 'upi', 'bank_transfer', 'cheque', 'other'] as const),
  reference: z.string().max(100).optional(),
  payment_date: z.string().min(1, 'Payment date is required'),
  notes: z.string().max(300).optional(),
})

export async function recordPayment(
  prevState: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { message: 'Unauthorized', success: false }

    const validated = PaymentSchema.safeParse({
      invoice_id: formData.get('invoice_id'),
      amount: formData.get('amount'),
      payment_method: formData.get('payment_method'),
      reference: formData.get('reference') || undefined,
      payment_date: formData.get('payment_date'),
      notes: formData.get('notes') || undefined,
    })

    if (!validated.success) {
      return { errors: validated.error.flatten().fieldErrors, success: false }
    }

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('total, amount_paid, status')
      .eq('id', validated.data.invoice_id)
      .single()

    if (invErr || !invoice) return { message: 'Invoice not found', success: false }
    if (invoice.status === 'paid') return { message: 'Invoice is already fully paid', success: false }

    const outstanding = invoice.total - invoice.amount_paid
    if (validated.data.amount > outstanding + 0.01) {
      return { errors: { amount: [`Max payable is ₹${outstanding.toFixed(2)}`] }, success: false }
    }

    const { error: payErr } = await supabase.from('payments').insert({
      invoice_id: validated.data.invoice_id,
      amount: validated.data.amount,
      payment_method: validated.data.payment_method,
      reference: validated.data.reference || null,
      payment_date: validated.data.payment_date,
      notes: validated.data.notes || null,
    })

    if (payErr) return { message: payErr.message, success: false }

    const newAmountPaid = invoice.amount_paid + validated.data.amount
    const newStatus = newAmountPaid >= invoice.total - 0.01 ? 'paid' : 'partial'

    const { error: updateErr } = await supabase
      .from('invoices')
      .update({ amount_paid: newAmountPaid, status: newStatus })
      .eq('id', validated.data.invoice_id)

    if (updateErr) return { message: updateErr.message, success: false }

    revalidatePath('/receivables')
    revalidatePath('/invoices')
    revalidatePath(`/invoices/${validated.data.invoice_id}`)
    return { message: 'Payment recorded', success: true }
  } catch (err: unknown) {
    console.error('recordPayment error:', err)
    return { message: err instanceof Error ? err.message : 'Unexpected error', success: false }
  }
}
