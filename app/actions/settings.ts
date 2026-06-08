'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type SettingsFormState = {
  errors?: Record<string, string[]>
  message?: string | null
  success?: boolean
}

const SettingsSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(100),
  gstin: z.string().max(15).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  bank_name: z.string().max(100).optional(),
  account_number: z.string().max(30).optional(),
  ifsc_code: z.string().max(15).optional(),
  upi_id: z.string().max(60).optional(),
  invoice_prefix: z.string().max(10).optional(),
  invoice_notes: z.string().max(500).optional(),
})

export async function saveSettings(
  prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Unauthorized', success: false }

  const raw = {
    business_name: formData.get('business_name'),
    gstin: formData.get('gstin') || undefined,
    address: formData.get('address') || undefined,
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || '',
    bank_name: formData.get('bank_name') || undefined,
    account_number: formData.get('account_number') || undefined,
    ifsc_code: formData.get('ifsc_code') || undefined,
    upi_id: formData.get('upi_id') || undefined,
    invoice_prefix: formData.get('invoice_prefix') || undefined,
    invoice_notes: formData.get('invoice_notes') || undefined,
  }

  const validated = SettingsSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, success: false }
  }

  // Upsert each setting as key-value row
  const entries = Object.entries(validated.data).map(([key, value]) => ({
    key,
    value: value ?? '',
  }))

  for (const entry of entries) {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: entry.key, value: entry.value }, { onConflict: 'key' })
    if (error) return { message: `Failed to save ${entry.key}: ${error.message}`, success: false }
  }

  revalidatePath('/settings')
  return { message: 'Settings saved successfully', success: true }
}

export async function getSettings(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data } = await supabase.from('app_settings').select('key, value')
  if (!data) return {}
  return Object.fromEntries(data.map(({ key, value }) => [key, value]))
}
