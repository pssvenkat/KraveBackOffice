'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Schema ────────────────────────────────────────────────────────────────

const CustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
    .or(z.literal(''))
    .optional(),
  notes: z.string().max(500).optional(),
})

export type CustomerFormState = {
  errors?: {
    name?: string[]
    email?: string[]
    phone?: string[]
    address?: string[]
    city?: string[]
    gstin?: string[]
    notes?: string[]
  }
  message?: string | null
  success?: boolean
}

// ─── Create ────────────────────────────────────────────────────────────────

export async function createCustomer(
  prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Unauthorized', success: false }

  const validated = CustomerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email') || '',
    phone: formData.get('phone') || '',
    address: formData.get('address') || '',
    city: formData.get('city') || '',
    gstin: formData.get('gstin') || '',
    notes: formData.get('notes') || '',
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, success: false }
  }

  const { error } = await supabase.from('customers').insert({
    name: validated.data.name,
    email: validated.data.email || null,
    phone: validated.data.phone || null,
    address: validated.data.address || null,
    city: validated.data.city || null,
    gstin: validated.data.gstin || null,
    notes: validated.data.notes || null,
  })

  if (error) return { message: error.message, success: false }

  revalidatePath('/customers')
  return { message: 'Customer created successfully', success: true }
}

// ─── Update ────────────────────────────────────────────────────────────────

export async function updateCustomer(
  id: string,
  prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Unauthorized', success: false }

  const validated = CustomerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email') || '',
    phone: formData.get('phone') || '',
    address: formData.get('address') || '',
    city: formData.get('city') || '',
    gstin: formData.get('gstin') || '',
    notes: formData.get('notes') || '',
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, success: false }
  }

  const { error } = await supabase
    .from('customers')
    .update({
      name: validated.data.name,
      email: validated.data.email || null,
      phone: validated.data.phone || null,
      address: validated.data.address || null,
      city: validated.data.city || null,
      gstin: validated.data.gstin || null,
      notes: validated.data.notes || null,
    })
    .eq('id', id)

  if (error) return { message: error.message, success: false }

  revalidatePath('/customers')
  return { message: 'Customer updated successfully', success: true }
}

// ─── Delete (soft) ─────────────────────────────────────────────────────────

export async function deleteCustomer(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('customers')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/customers')
  return {}
}
