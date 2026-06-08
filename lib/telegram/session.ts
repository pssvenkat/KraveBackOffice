import { createServiceClient } from '@/lib/supabase/service'

// ── Session types ─────────────────────────────────────────────────────────────
export type SessionIdle = { state: 'idle' }

export type SessionAddStockItem = {
  state: 'addstock_item'
  items: Array<{ id: string; name: string; quantity: number; unit: string | null }>
}

export type SessionAddStockQty = {
  state: 'addstock_qty'
  itemId: string
  itemName: string
  currentQty: number
  unit: string | null
}

export type BotSession = SessionIdle | SessionAddStockItem | SessionAddStockQty

// ── CRUD ──────────────────────────────────────────────────────────────────────
export async function getSession(chatId: number): Promise<BotSession> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('telegram_sessions')
      .select('state, context')
      .eq('chat_id', chatId)
      .maybeSingle()

    if (!data) return { state: 'idle' }
    return { state: data.state, ...(data.context ?? {}) } as BotSession
  } catch {
    return { state: 'idle' }
  }
}

export async function setSession(chatId: number, session: BotSession): Promise<void> {
  try {
    const supabase = createServiceClient()
    const { state, ...context } = session as Record<string, unknown>
    await supabase.from('telegram_sessions').upsert(
      { chat_id: chatId, state, context, updated_at: new Date().toISOString() },
      { onConflict: 'chat_id' }
    )
  } catch { /* best effort */ }
}

export async function clearSession(chatId: number): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase.from('telegram_sessions').delete().eq('chat_id', chatId)
  } catch { /* best effort */ }
}
