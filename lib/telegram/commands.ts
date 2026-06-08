import { createServiceClient } from '@/lib/supabase/service'
import { esc, sendMessage } from './bot'
import { getSession, setSession, clearSession, type SessionAddStockItem, type SessionAddStockQty } from './session'

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ── /start ────────────────────────────────────────────────────────────────────
export async function cmdStart(chatId: number, firstName: string) {
  await clearSession(chatId)
  await sendMessage(chatId,
    `🌱 <b>Welcome, ${esc(firstName)}!</b>\n` +
    `This is the <b>Krave Microgreens</b> Back Office bot.\n\n` +
    `<b>Commands:</b>\n` +
    `/stock — All stock levels + low alerts\n` +
    `/outstanding — Unpaid invoices\n` +
    `/revenue — Paid vs outstanding this month\n` +
    `/addstock — Add stock (guided)\n` +
    `/customers — Active customer count\n` +
    `/help — Show this menu`
  )
}

// ── /help ─────────────────────────────────────────────────────────────────────
export async function cmdHelp(chatId: number) {
  await clearSession(chatId)
  await sendMessage(chatId,
    `🤖 <b>Krave Bot Commands</b>\n\n` +
    `/stock — All items with quantities + low stock alerts\n` +
    `/outstanding — Sent + partial invoices\n` +
    `/revenue — Paid vs outstanding breakdown\n` +
    `/addstock — Guided stock addition (select item → enter qty)\n` +
    `/customers — Active customer count\n` +
    `/help — This menu\n\n` +
    `<i>Tip: Use Chrome/Edge for voice commands on the web app.</i>`
  )
}

// ── /stock — ALL items + low stock highlighted ────────────────────────────────
export async function cmdStock(chatId: number) {
  await clearSession(chatId)
  const supabase = createServiceClient()

  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('name, quantity, unit, reorder_level, inventory_categories(name, icon)')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('cmdStock error:', error)
    await sendMessage(chatId, `❌ Error fetching inventory: ${esc(error.message)}`)
    return
  }

  if (!items || items.length === 0) {
    await sendMessage(chatId, '📦 No inventory items found. Add items on the web app first.')
    return
  }

  // Split into low-stock and OK
  const lowStock = items.filter((i: any) => i.reorder_level > 0 && i.quantity <= i.reorder_level)
  const outOfStock = items.filter((i: any) => i.quantity === 0)
  const ok = items.filter((i: any) => !(i.reorder_level > 0 && i.quantity <= i.reorder_level) && i.quantity > 0)

  const itemLine = (i: any) => {
    const icon = (i.inventory_categories as any)?.icon ?? '📦'
    const u = i.unit ?? ''
    let status = '✅'
    if (i.quantity === 0) status = '🔴'
    else if (i.reorder_level > 0 && i.quantity <= i.reorder_level) status = '🟡'
    const minTxt = i.reorder_level > 0 ? ` <i>(min: ${i.reorder_level}${u})</i>` : ''
    return `${status} ${icon} <b>${esc(i.name)}</b>: ${i.quantity}${u}${minTxt}`
  }

  let msg = `📦 <b>Inventory Stock Levels</b> (${items.length} items)\n`

  if (outOfStock.length > 0 || lowStock.length > 0) {
    msg += `\n⚠️ <b>Needs Attention (${outOfStock.length + lowStock.filter((i: any) => i.quantity > 0).length})</b>\n`
    msg += [...outOfStock, ...lowStock.filter((i: any) => i.quantity > 0)].map(itemLine).join('\n')
  }

  if (ok.length > 0) {
    msg += `\n\n✅ <b>OK Stock (${ok.length})</b>\n`
    msg += ok.map(itemLine).join('\n')
  }

  await sendMessage(chatId, msg)
}

// ── /outstanding ──────────────────────────────────────────────────────────────
export async function cmdOutstanding(chatId: number) {
  await clearSession(chatId)
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number, total, amount_paid, due_date, customers(name)')
    .in('status', ['sent', 'partial'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10)

  if (error) {
    await sendMessage(chatId, `❌ Error: ${esc(error.message)}`)
    return
  }

  if (!data || data.length === 0) {
    await sendMessage(chatId, '✅ <b>No outstanding invoices!</b> All settled.')
    return
  }

  const today = new Date()
  const totalOutstanding = data.reduce((s, i) => s + (i.total - (i.amount_paid ?? 0)), 0)

  const lines = data.map((inv: any) => {
    const outstanding = inv.total - (inv.amount_paid ?? 0)
    const dueDate = inv.due_date ? new Date(inv.due_date) : null
    const overdue = dueDate && dueDate < today
    const dueTxt = dueDate
      ? dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      : 'no due date'
    const flag = overdue ? '🔴' : '🟡'
    return `${flag} <b>${esc(inv.invoice_number)}</b> — ${esc((inv.customers as any)?.name ?? '—')}\n   <b>${esc(fmt(outstanding))}</b> due ${esc(dueTxt)}`
  })

  await sendMessage(chatId,
    `💰 <b>Outstanding Receivables</b>\n\n` +
    lines.join('\n\n') +
    `\n\n<b>Total Due: ${esc(fmt(totalOutstanding))}</b> across ${data.length} invoice${data.length !== 1 ? 's' : ''}`
  )
}

// ── /revenue — paid vs outstanding ───────────────────────────────────────────
export async function cmdRevenue(chatId: number) {
  await clearSession(chatId)
  const supabase = createServiceClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  const [paidRes, unpaidRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('total')
      .eq('status', 'paid')
      .gte('issue_date', monthStart),
    supabase
      .from('invoices')
      .select('total, amount_paid')
      .in('status', ['sent', 'partial', 'draft'])
      .gte('issue_date', monthStart),
  ])

  const paid = (paidRes.data ?? []).reduce((s, i) => s + i.total, 0)
  const paidCount = paidRes.data?.length ?? 0

  const unpaidAmount = (unpaidRes.data ?? []).reduce(
    (s, i) => s + (i.total - (i.amount_paid ?? 0)), 0
  )
  const unpaidCount = unpaidRes.data?.length ?? 0

  const totalBilled = paid + unpaidAmount
  const paidPct = totalBilled > 0 ? Math.round((paid / totalBilled) * 100) : 0

  const bar = '█'.repeat(Math.round(paidPct / 10)) + '░'.repeat(10 - Math.round(paidPct / 10))

  await sendMessage(chatId,
    `📈 <b>Revenue — ${esc(monthName)}</b>\n\n` +
    `✅ <b>Paid:</b> ${esc(fmt(paid))} <i>(${paidCount} invoice${paidCount !== 1 ? 's' : ''})</i>\n` +
    `⏳ <b>Unpaid:</b> ${esc(fmt(unpaidAmount))} <i>(${unpaidCount} invoice${unpaidCount !== 1 ? 's' : ''})</i>\n` +
    `📊 <b>Total Billed:</b> ${esc(fmt(totalBilled))}\n\n` +
    `<code>${bar} ${paidPct}% collected</code>`
  )
}

// ── /addstock step 1 — show item list ────────────────────────────────────────
export async function cmdAddStock(chatId: number) {
  const supabase = createServiceClient()
  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('id, name, quantity, unit')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error || !items || items.length === 0) {
    await sendMessage(chatId, error
      ? `❌ Error fetching items: ${esc(error.message)}`
      : '📦 No inventory items found. Add items on the web app first.'
    )
    return
  }

  const lines = items.map((i: any, idx: number) =>
    `${idx + 1}. <b>${esc(i.name)}</b> — ${i.quantity}${i.unit ?? ''}`
  )

  await setSession(chatId, { state: 'addstock_item', items })
  await sendMessage(chatId,
    `📦 <b>Select an item to add stock:</b>\n\n` +
    lines.join('\n') +
    `\n\n<i>Reply with the item number (e.g. <b>2</b>)\nor /cancel to exit</i>`
  )
}

// ── /addstock step 2 — pick item, ask qty ────────────────────────────────────
export async function handleAddStockItem(chatId: number, text: string, items: SessionAddStockItem['items']) {
  const num = parseInt(text.trim())
  if (isNaN(num) || num < 1 || num > items.length) {
    await sendMessage(chatId,
      `❌ Please reply with a number between <b>1</b> and <b>${items.length}</b>.\n` +
      `Or /cancel to exit.`
    )
    return
  }

  const item = items[num - 1]
  await setSession(chatId, {
    state: 'addstock_qty',
    itemId: item.id,
    itemName: item.name,
    currentQty: item.quantity,
    unit: item.unit,
  })

  await sendMessage(chatId,
    `📦 <b>${esc(item.name)}</b>\n` +
    `Current stock: <b>${item.quantity}${item.unit ?? ''}</b>\n\n` +
    `How much to add?\n<i>Reply with a number (e.g. <b>500</b>)\nor /cancel to exit</i>`
  )
}

// ── /addstock step 3 — enter qty, update stock ───────────────────────────────
export async function handleAddStockQty(
  chatId: number, text: string,
  itemId: string, itemName: string, currentQty: number, unit: string | null
) {
  const qty = parseFloat(text.trim())
  if (isNaN(qty) || qty <= 0) {
    await sendMessage(chatId, `❌ Enter a valid positive number.\nOr /cancel to exit.`)
    return
  }

  const supabase = createServiceClient()
  const newQty = currentQty + qty

  const { error } = await supabase
    .from('inventory_items')
    .update({ quantity: newQty })
    .eq('id', itemId)

  if (error) {
    await sendMessage(chatId, `❌ Failed to update: ${esc(error.message)}`)
    return
  }

  // Log transaction (best effort)
  await supabase.from('inventory_transactions').insert({
    item_id: itemId,
    transaction_type: 'add',
    quantity_delta: qty,
    quantity_after: newQty,
    note: 'Added via Telegram bot',
    source: 'telegram',
  })

  await clearSession(chatId)
  await sendMessage(chatId,
    `✅ <b>Stock updated!</b>\n\n` +
    `📦 <b>${esc(itemName)}</b>\n` +
    `Added: +${qty}${unit ?? ''}\n` +
    `New stock: <b>${newQty}${unit ?? ''}</b>`
  )
}

// ── /cancel ───────────────────────────────────────────────────────────────────
export async function cmdCancel(chatId: number) {
  await clearSession(chatId)
  await sendMessage(chatId, '❌ Cancelled. Send /help to see available commands.')
}

// ── /customers ────────────────────────────────────────────────────────────────
export async function cmdCustomers(chatId: number) {
  await clearSession(chatId)
  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  if (error) {
    await sendMessage(chatId, `❌ Error: ${esc(error.message)}`)
    return
  }
  await sendMessage(chatId,
    `👥 <b>${count ?? 0}</b> active customer${(count ?? 0) !== 1 ? 's' : ''} in Krave Microgreens.`
  )
}
