'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const ItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  category_id: z.string().uuid('Category is required'),
  unit: z.enum(['g', 'kg', 'pcs', 'rolls', 'bags', 'packets', 'bunches'] as const),
  quantity: z.coerce.number().min(0, 'Quantity must be 0 or more'),
  reorder_level: z.coerce.number().min(0, 'Reorder level must be 0 or more'),
  cost_per_unit: z.coerce.number().min(0).optional(),
})

const AdjustSchema = z.object({
  item_id: z.string().uuid(),
  transaction_type: z.enum(['add', 'consume', 'adjust']),
  quantity_delta: z.coerce.number().refine((v) => v !== 0, 'Quantity cannot be zero'),
  note: z.string().max(200).optional(),
})

export type InventoryFormState = {
  errors?: Record<string, string[]>
  message?: string | null
  success?: boolean
}

export async function createInventoryItem(
  prevState: InventoryFormState,
  formData: FormData
): Promise<InventoryFormState> {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { message: 'Unauthorized', success: false }

    const validated = ItemSchema.safeParse({
      name: formData.get('name'),
      category_id: formData.get('category_id'),
      unit: formData.get('unit'),
      quantity: formData.get('quantity') || 0,
      reorder_level: formData.get('reorder_level') || 0,
      cost_per_unit: formData.get('cost_per_unit') || undefined,
    })

    if (!validated.success) {
      return { errors: validated.error.flatten().fieldErrors, success: false }
    }

    const { error } = await supabase.from('inventory_items').insert({
      ...validated.data,
      cost_per_unit: validated.data.cost_per_unit ?? null,
    })

    if (error) return { message: error.message, success: false }

    revalidatePath('/inventory')
    return { message: 'Item added', success: true }
  } catch (err: unknown) {
    console.error('createInventoryItem error:', err)
    return { message: err instanceof Error ? err.message : 'Unexpected error', success: false }
  }
}

export async function updateInventoryItem(
  id: string,
  prevState: InventoryFormState,
  formData: FormData
): Promise<InventoryFormState> {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { message: 'Unauthorized', success: false }

    const validated = ItemSchema.safeParse({
      name: formData.get('name'),
      category_id: formData.get('category_id'),
      unit: formData.get('unit'),
      quantity: formData.get('quantity') || 0,
      reorder_level: formData.get('reorder_level') || 0,
      cost_per_unit: formData.get('cost_per_unit') || undefined,
    })

    if (!validated.success) {
      return { errors: validated.error.flatten().fieldErrors, success: false }
    }

    const { error } = await supabase
      .from('inventory_items')
      .update({ ...validated.data, cost_per_unit: validated.data.cost_per_unit ?? null })
      .eq('id', id)

    if (error) return { message: error.message, success: false }

    revalidatePath('/inventory')
    return { message: 'Item updated', success: true }
  } catch (err: unknown) {
    console.error('updateInventoryItem error:', err)
    return { message: err instanceof Error ? err.message : 'Unexpected error', success: false }
  }
}

export async function deleteInventoryItem(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('inventory_items')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/inventory')
    return {}
  } catch (err: unknown) {
    console.error('deleteInventoryItem error:', err)
    return { error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

export async function adjustStock(
  prevState: InventoryFormState,
  formData: FormData
): Promise<InventoryFormState> {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { message: 'Unauthorized', success: false }

    const rawType = formData.get('transaction_type') as string
    const rawQty = parseFloat((formData.get('quantity_delta') as string) || '0')

    let delta = rawQty
    if (rawType === 'consume') delta = -Math.abs(rawQty)
    if (rawType === 'adjust') delta = rawQty

    const validated = AdjustSchema.safeParse({
      item_id: formData.get('item_id'),
      transaction_type: rawType,
      quantity_delta: delta,
      note: formData.get('note') || '',
    })

    if (!validated.success) {
      return { errors: validated.error.flatten().fieldErrors, success: false }
    }

    const { data: item, error: fetchErr } = await supabase
      .from('inventory_items')
      .select('quantity')
      .eq('id', validated.data.item_id)
      .single()

    if (fetchErr || !item) return { message: 'Item not found', success: false }

    const newQty = Math.max(0, item.quantity + validated.data.quantity_delta)

    const { error: updateErr } = await supabase
      .from('inventory_items')
      .update({ quantity: newQty })
      .eq('id', validated.data.item_id)

    if (updateErr) return { message: updateErr.message, success: false }

    await supabase.from('inventory_transactions').insert({
      item_id: validated.data.item_id,
      transaction_type: validated.data.transaction_type,
      quantity_delta: validated.data.quantity_delta,
      quantity_after: newQty,
      note: validated.data.note || null,
      source: 'manual',
    })

    revalidatePath('/inventory')
    return { message: 'Stock updated', success: true }
  } catch (err: unknown) {
    console.error('adjustStock error:', err)
    return { message: err instanceof Error ? err.message : 'Unexpected error', success: false }
  }
}
