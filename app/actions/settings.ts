'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('app_settings').select('key, value')
    if (error || !data) return {}
    return Object.fromEntries(data.map(({ key, value }) => [key, value]))
  } catch {
    return {}
  }
}

// ── Logo Upload ──────────────────────────────────────────────────────────────

export async function uploadLogo(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = createServiceClient()

    const file = formData.get('logo') as File
    if (!file || file.size === 0) return { error: 'No file selected' }
    if (!file.type.startsWith('image/')) return { error: 'Must be an image file' }
    if (file.size > 2 * 1024 * 1024) return { error: 'Image must be under 2MB' }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    if (!['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext))
      return { error: 'Allowed formats: PNG, JPG, WebP, SVG' }

    const buffer = await file.arrayBuffer()

    // Create bucket if it doesn't exist yet
    await supabase.storage.createBucket('logos', { public: true }).catch(() => {})

    // Always store as logo.<ext> — overwrite on update (upsert)
    const { error: uploadErr } = await supabase.storage
      .from('logos')
      .upload(`logo.${ext}`, buffer, { contentType: file.type, upsert: true })

    if (uploadErr) return { error: uploadErr.message }

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(`logo.${ext}`)

    // Append cache-buster so browsers pick up the new image
    const url = `${publicUrl}?v=${Date.now()}`

    // Persist URL in settings
    await supabase
      .from('app_settings')
      .upsert({ key: 'logo_url', value: url }, { onConflict: 'key' })

    revalidatePath('/', 'layout')
    revalidatePath('/settings')
    return { url }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' }
  }
}

// ── Signature Upload ─────────────────────────────────────────────────────────

export async function uploadSignature(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = createServiceClient()

    const file = formData.get('signature') as File
    if (!file || file.size === 0) return { error: 'No file selected' }
    if (!file.type.startsWith('image/')) return { error: 'Must be an image file' }
    if (file.size > 2 * 1024 * 1024) return { error: 'Image must be under 2MB' }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext))
      return { error: 'Allowed formats: PNG, JPG, WebP' }

    const buffer = await file.arrayBuffer()

    await supabase.storage.createBucket('signatures', { public: true }).catch(() => {})

    const { error: uploadErr } = await supabase.storage
      .from('signatures')
      .upload(`signature.${ext}`, buffer, { contentType: file.type, upsert: true })

    if (uploadErr) return { error: uploadErr.message }

    const { data: { publicUrl } } = supabase.storage
      .from('signatures')
      .getPublicUrl(`signature.${ext}`)

    const url = `${publicUrl}?v=${Date.now()}`

    await supabase
      .from('app_settings')
      .upsert({ key: 'signature_url', value: url }, { onConflict: 'key' })

    revalidatePath('/settings')
    return { url }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' }
  }
}
