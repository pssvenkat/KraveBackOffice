'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type CatalogItemFormState = {
  errors?: Record<string, string[]>
  message?: string | null
  success?: boolean
}

const UNITS = [
  'g', 'kg', 'pcs', 'bunch', 'tray', 'box', 'bag',
  'packet', 'roll', 'ml', 'litre', 'hr', 'service',
] as const

const ItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().max(300).optional(),
  uom: z.enum(UNITS),
  default_price: z.coerce.number().min(0, 'Price must be 0 or more'),
  hsn_code: z.string().max(10).optional(),
})

// ─── Create ───────────────────────────────────────────────────────────────────
export async function createCatalogItem(
  prevState: CatalogItemFormState,
  formData: FormData
): Promise<CatalogItemFormState> {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { message: 'Unauthorized', success: false }

    const raw = {
      name: formData.get('name'),
      description: formData.get('description') || undefined,
      uom: formData.get('uom'),
      default_price: formData.get('default_price'),
      hsn_code: formData.get('hsn_code') || undefined,
    }

    const validated = ItemSchema.safeParse(raw)
    if (!validated.success) {
      return { errors: validated.error.flatten().fieldErrors, success: false }
    }

    const { error } = await supabase.from('catalog_items').insert({
      name: validated.data.name,
      description: validated.data.description || null,
      uom: validated.data.uom,
      default_price: validated.data.default_price,
      hsn_code: validated.data.hsn_code || null,
    })

    if (error) {
      if (error.code === '23505') return { errors: { name: ['An item with this name already exists'] }, success: false }
      return { message: error.message, success: false }
    }

    revalidatePath('/items')
    return { success: true }
  } catch (err: unknown) {
    console.error('createCatalogItem error:', err)
    return { message: err instanceof Error ? err.message : 'Unexpected error. Please try again.', success: false }
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────
export async function updateCatalogItem(
  id: string,
  prevState: CatalogItemFormState,
  formData: FormData
): Promise<CatalogItemFormState> {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { message: 'Unauthorized', success: false }

    const raw = {
      name: formData.get('name'),
      description: formData.get('description') || undefined,
      uom: formData.get('uom'),
      default_price: formData.get('default_price'),
      hsn_code: formData.get('hsn_code') || undefined,
    }

    const validated = ItemSchema.safeParse(raw)
    if (!validated.success) {
      return { errors: validated.error.flatten().fieldErrors, success: false }
    }

    const { error } = await supabase
      .from('catalog_items')
      .update({
        name: validated.data.name,
        description: validated.data.description || null,
        uom: validated.data.uom,
        default_price: validated.data.default_price,
        hsn_code: validated.data.hsn_code || null,
      })
      .eq('id', id)

    if (error) {
      if (error.code === '23505') return { errors: { name: ['An item with this name already exists'] }, success: false }
      return { message: error.message, success: false }
    }

    revalidatePath('/items')
    return { success: true }
  } catch (err: unknown) {
    console.error('updateCatalogItem error:', err)
    return { message: err instanceof Error ? err.message : 'Unexpected error. Please try again.', success: false }
  }
}

// ─── Soft Delete ──────────────────────────────────────────────────────────────
export async function deleteCatalogItem(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('catalog_items')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/items')
    return {}
  } catch (err: unknown) {
    console.error('deleteCatalogItem error:', err)
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

export { UNITS }
