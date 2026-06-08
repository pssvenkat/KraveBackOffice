import { createServiceClient } from '@/lib/supabase/service'
import { esc, sendMessage } from './bot'

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ── /start ────────────────────────────────────────────────────────────────────
export async function cmdStart(chatId: number, firstName: string) {
  await sendMessage(chatId,
    `🌱 <b>Welcome, ${esc(firstName)}!</b>\n` +
    `This is the <b>Krave Microgreens</b> Back Office bot.\n\n` +
    `<b>Available commands:</b>\n` +
    `/stock — Low stock alerts\n` +
    `/outstanding — Unpaid invoices\n` +
    `/revenue — This month's revenue\n` +
    `/addstock [item] [qty] — Add stock\n` +
    `/customers — Active customer count\n` +
    `/help — Show this menu`
  )
}

// ── /help ─────────────────────────────────────────────────────────────────────
export async function cmdHelp(chatId: number) {
  await sendMessage(chatId,
    `🤖 <b>Krave Bot Commands</b>\n\n` +
    `/stock — Items below reorder level\n` +
    `/outstanding — Sent + partial invoices\n` +
    `/revenue — Paid invoices this month\n` +
    `/addstock [name] [qty] — Add inventory\n` +
    `/customers — Active customer count\n` +
    `/help — This menu\n\n` +
    `<i>Use Chrome/Edge for voice commands on the web app.</i>`
  )
}

// ── /stock ────────────────────────────────────────────────────────────────────
export async function cmdStock(chatId: number) {
  const supabase = createServiceClient()

  const { data: allItems, error } = await supabase
    .from('inventory_items')
    .select('name, quantity, unit, reorder_level, inventory_categories(icon)')
    .eq('is_active', true)
    .order('quantity', { ascending: true })

  if (error) {
    console.error('cmdStock error:', error)
    await sendMessage(chatId, `❌ Error fetching inventory: ${esc(error.message)}`)
    return
  }

  const lowStock = (allItems ?? []).filter(
    (i: any) => i.reorder_level > 0 && i.quantity <= i.reorder_level
  )

  if (lowStock.length === 0) {
    await sendMessage(chatId, '✅ <b>All stock levels are OK!</b> Nothing below reorder level.')
    return
  }

  const lines = lowStock.slice(0, 15).map((i: any) => {
    const icon = (i.inventory_categories as any)?.icon ?? '📦'
    const status = i.quantity === 0 ? '🔴' : '🟡'
    return `${status} ${icon} <b>${esc(i.name)}</b> — ${i.quantity}${i.unit ?? ''} (min: ${i.reorder_level}${i.unit ?? ''})`
  })

  await sendMessage(chatId,
    `⚠️ <b>Low Stock Alert</b> (${lowStock.length} item${lowStock.length !== 1 ? 's' : ''})\n\n` +
    lines.join('\n')
  )
}

// ── /outstanding ──────────────────────────────────────────────────────────────
export async function cmdOutstanding(chatId: number) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number, total, amount_paid, due_date, customers(name)')
    .in('status', ['sent', 'partial'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10)

  if (error) {
    console.error('cmdOutstanding error:', error)
    await sendMessage(chatId, `❌ Error fetching receivables: ${esc(error.message)}`)
    return
  }

  if (!data || data.length === 0) {
    await sendMessage(chatId, '✅ <b>No outstanding invoices!</b> All invoices are settled.')
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
    return `${flag} <b>${esc(inv.invoice_number)}</b> | ${esc((inv.customers as any)?.name ?? '—')} | <b>${esc(fmt(outstanding))}</b> (due ${esc(dueTxt)})`
  })

  await sendMessage(chatId,
    `💰 <b>Outstanding Receivables</b>\n\n` +
    lines.join('\n') +
    `\n\n<b>Total: ${esc(fmt(totalOutstanding))}</b> across ${data.length} invoice${data.length !== 1 ? 's' : ''}`
  )
}

// ── /revenue ──────────────────────────────────────────────────────────────────
export async function cmdRevenue(chatId: number) {
  const supabase = createServiceClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  const { data, error } = await supabase
    .from('invoices')
    .select('total')
    .eq('status', 'paid')
    .gte('issue_date', monthStart)

  if (error) {
    console.error('cmdRevenue error:', error)
    await sendMessage(chatId, `❌ Error fetching revenue: ${esc(error.message)}`)
    return
  }

  const revenue = (data ?? []).reduce((s, i) => s + i.total, 0)
  const count = data?.length ?? 0

  await sendMessage(chatId,
    `📈 <b>Revenue — ${esc(monthName)}</b>\n\n` +
    `💵 <b>${esc(fmt(revenue))}</b>\n` +
    `📄 from ${count} paid invoice${count !== 1 ? 's' : ''}`
  )
}

// ── /addstock [item] [qty] ────────────────────────────────────────────────────
export async function cmdAddStock(chatId: number, args: string) {
  const tokens = args.trim().split(/\s+/)
  if (tokens.length < 2) {
    await sendMessage(chatId,
      '❌ Usage: <code>/addstock [item name] [quantity]</code>\n\n' +
      'Example: <code>/addstock bok choy 500</code>'
    )
    return
  }

  const qtyStr = tokens[tokens.length - 1]
  const qty = parseFloat(qtyStr)
  if (isNaN(qty) || qty <= 0) {
    await sendMessage(chatId, `❌ Invalid quantity: <b>${esc(qtyStr)}</b>\nUse a positive number.`)
    return
  }

  const itemName = tokens.slice(0, -1).join(' ')
  const supabase = createServiceClient()

  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('id, name, quantity, unit')
    .eq('is_active', true)
    .ilike('name', `%${itemName}%`)
    .limit(3)

  if (error) {
    await sendMessage(chatId, `❌ Error searching items: ${esc(error.message)}`)
    return
  }

  if (!items || items.length === 0) {
    await sendMessage(chatId, `❌ No item found matching <b>${esc(itemName)}</b>.\nCheck spelling with /stock.`)
    return
  }

  if (items.length > 1) {
    const names = items.map((i: any) => `• ${esc(i.name)}`).join('\n')
    await sendMessage(chatId,
      `⚠️ Multiple matches for <b>${esc(itemName)}</b>:\n${names}\n\n<i>Be more specific.</i>`
    )
    return
  }

  const item = items[0] as any
  const newQty = item.quantity + qty

  const { error: updateErr } = await supabase
    .from('inventory_items')
    .update({ quantity: newQty })
    .eq('id', item.id)

  if (updateErr) {
    await sendMessage(chatId, `❌ Failed to update stock: ${esc(updateErr.message)}`)
    return
  }

  // Log transaction (best effort)
  await supabase.from('inventory_transactions').insert({
    item_id: item.id,
    transaction_type: 'add',
    quantity_delta: qty,
    quantity_after: newQty,
    note: 'Added via Telegram bot',
    source: 'telegram',
  })

  await sendMessage(chatId,
    `✅ <b>Stock updated!</b>\n\n` +
    `📦 <b>${esc(item.name)}</b>\n` +
    `+${qty}${item.unit ?? ''} added\n` +
    `New stock: <b>${newQty}${item.unit ?? ''}</b>`
  )
}

// ── /customers ────────────────────────────────────────────────────────────────
export async function cmdCustomers(chatId: number) {
  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  if (error) {
    await sendMessage(chatId, `❌ Error fetching customers: ${esc(error.message)}`)
    return
  }

  await sendMessage(chatId,
    `👥 <b>${count ?? 0}</b> active customer${(count ?? 0) !== 1 ? 's' : ''} in Krave Microgreens.`
  )
}
