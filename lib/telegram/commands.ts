import { createClient } from '@/lib/supabase/server'
import { esc, sendMessage } from './bot'

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ── /start ────────────────────────────────────────────────────────────────────
export async function cmdStart(chatId: number, firstName: string) {
  const name = esc(firstName)
  await sendMessage(chatId,
    `🌱 *Welcome, ${name}\\!*\n` +
    `This is the *Krave Microgreens* Back Office bot\\.\n\n` +
    `*Available commands:*\n` +
    `/stock \\— Low stock alerts\n` +
    `/outstanding \\— Unpaid invoices\n` +
    `/revenue \\— This month\\'s revenue\n` +
    `/addstock \\[item\\] \\[qty\\] \\— Add stock\n` +
    `/customers \\— Active customer count\n` +
    `/help \\— Show this menu`
  )
}

// ── /help ─────────────────────────────────────────────────────────────────────
export async function cmdHelp(chatId: number) {
  await sendMessage(chatId,
    `🤖 *Krave Bot Commands*\n\n` +
    `/stock \\— Items below reorder level\n` +
    `/outstanding \\— Sent \\+ partial invoices\n` +
    `/revenue \\— Paid invoices this month\n` +
    `/addstock \\[name\\] \\[qty\\] \\— Add inventory\n` +
    `/customers \\— Active customer count\n` +
    `/help \\— This menu\n\n` +
    `_Use Chrome\\/Edge for voice commands on the web app\\._`
  )
}

// ── /stock ────────────────────────────────────────────────────────────────────
export async function cmdStock(chatId: number) {
  const supabase = await createClient()

  // Fetch all active items and filter client-side (PostgREST can't compare two columns)
  const { data: allItems, error: err2 } = await supabase
    .from('inventory_items')
    .select('name, quantity, uom, reorder_level, inventory_categories(icon)')
    .eq('is_active', true)
    .order('quantity', { ascending: true })

  const lowStock = (allItems ?? []).filter((i: any) => i.reorder_level > 0 && i.quantity <= i.reorder_level)

  if (err2) {
    await sendMessage(chatId, '❌ Error fetching inventory\\.')
    return
  }

  if (lowStock.length === 0) {
    await sendMessage(chatId, '✅ *All stock levels are OK\\!* Nothing below reorder level\\.')
    return
  }

  const lines = lowStock.slice(0, 15).map((i: any) => {
    const icon = (i.inventory_categories as any)?.icon ?? '📦'
    const name = esc(i.name)
    const qty = esc(String(i.quantity))
    const uom = esc(i.uom ?? '')
    const reorder = esc(String(i.reorder_level))
    const status = i.quantity === 0 ? '🔴' : '🟡'
    return `${status} *${name}* \\— ${qty}${uom} \\(min: ${reorder}${uom}\\)`
  })

  const count = esc(String(lowStock.length))
  await sendMessage(chatId,
    `⚠️ *Low Stock Alert* \\(${count} item${lowStock.length !== 1 ? 's' : ''}\\)\n\n` +
    lines.join('\n')
  )
}

// ── /outstanding ──────────────────────────────────────────────────────────────
export async function cmdOutstanding(chatId: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number, total, amount_paid, due_date, customers(name)')
    .in('status', ['sent', 'partial'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10)

  if (error) {
    await sendMessage(chatId, '❌ Error fetching receivables\\.')
    return
  }

  if (!data || data.length === 0) {
    await sendMessage(chatId, '✅ *No outstanding invoices\\!* All invoices are paid\\.')
    return
  }

  const totalOutstanding = data.reduce((s, i) => s + (i.total - i.amount_paid), 0)
  const today = new Date()

  const lines = data.map((inv: any) => {
    const num = esc(inv.invoice_number)
    const customer = esc((inv.customers as any)?.name ?? '—')
    const outstanding = esc(fmt(inv.total - inv.amount_paid))
    const dueDate = inv.due_date ? new Date(inv.due_date) : null
    const overdue = dueDate && dueDate < today
    const dueTxt = dueDate
      ? esc(dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }))
      : 'no due date'
    const flag = overdue ? '🔴' : '🟡'
    return `${flag} ${num} \\| ${customer} \\| *${outstanding}* \\(due ${dueTxt}\\)`
  })

  const total = esc(fmt(totalOutstanding))
  const cnt = esc(String(data.length))
  await sendMessage(chatId,
    `💰 *Outstanding Receivables*\n\n` +
    lines.join('\n') +
    `\n\n*Total: ${total}* across ${cnt} invoice${data.length !== 1 ? 's' : ''}`
  )
}

// ── /revenue ──────────────────────────────────────────────────────────────────
export async function cmdRevenue(chatId: number) {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthName = esc(now.toLocaleString('en-IN', { month: 'long', year: 'numeric' }))

  const { data, error } = await supabase
    .from('invoices')
    .select('total')
    .eq('status', 'paid')
    .gte('issue_date', monthStart)

  if (error) {
    await sendMessage(chatId, '❌ Error fetching revenue\\.')
    return
  }

  const revenue = (data ?? []).reduce((s, i) => s + i.total, 0)
  const count = data?.length ?? 0
  const revTxt = esc(fmt(revenue))
  const cntTxt = esc(String(count))

  await sendMessage(chatId,
    `📈 *Revenue \\— ${monthName}*\n\n` +
    `💵 *${revTxt}*\n` +
    `📄 from ${cntTxt} paid invoice${count !== 1 ? 's' : ''}`
  )
}

// ── /addstock [item] [qty] ────────────────────────────────────────────────────
export async function cmdAddStock(chatId: number, args: string) {
  // Parse: last token = qty (number), rest = item name
  const tokens = args.trim().split(/\s+/)
  if (tokens.length < 2) {
    await sendMessage(chatId,
      '❌ Usage: `/addstock \\[item name\\] \\[quantity\\]`\n\n' +
      'Example: `/addstock sunflower 500`'
    )
    return
  }

  const qtyStr = tokens[tokens.length - 1]
  const qty = parseFloat(qtyStr)
  if (isNaN(qty) || qty <= 0) {
    await sendMessage(chatId, `❌ Invalid quantity: *${esc(qtyStr)}*\nUse a positive number\\.`)
    return
  }

  const itemName = tokens.slice(0, -1).join(' ')
  const supabase = await createClient()

  // Find item by partial name match
  const { data: items } = await supabase
    .from('inventory_items')
    .select('id, name, quantity, uom')
    .eq('is_active', true)
    .ilike('name', `%${itemName}%`)
    .limit(3)

  if (!items || items.length === 0) {
    await sendMessage(chatId, `❌ No item found matching *${esc(itemName)}*\\.`)
    return
  }

  if (items.length > 1) {
    const names = items.map((i: any) => `• ${esc(i.name)}`).join('\n')
    await sendMessage(chatId,
      `⚠️ Multiple matches for *${esc(itemName)}*:\n${names}\n\n_Be more specific\\._`
    )
    return
  }

  const item = items[0] as any
  const newQty = item.quantity + qty

  // Update quantity
  const { error: updateErr } = await supabase
    .from('inventory_items')
    .update({ quantity: newQty })
    .eq('id', item.id)

  if (updateErr) {
    await sendMessage(chatId, '❌ Failed to update stock\\.')
    return
  }

  // Log transaction
  await supabase.from('inventory_transactions').insert({
    item_id: item.id,
    type: 'in',
    quantity: qty,
    notes: 'Added via Telegram bot',
  })

  const name = esc(item.name)
  const uom = esc(item.uom ?? '')
  const addedTxt = esc(String(qty))
  const newTxt = esc(String(newQty))

  await sendMessage(chatId,
    `✅ *Stock updated\\!*\n\n` +
    `📦 *${name}*\n` +
    `\\+${addedTxt}${uom} added\n` +
    `New stock: *${newTxt}${uom}*`
  )
}

// ── /customers ────────────────────────────────────────────────────────────────
export async function cmdCustomers(chatId: number) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  const cntTxt = esc(String(count ?? 0))
  await sendMessage(chatId, `👥 *${cntTxt}* active customer${(count ?? 0) !== 1 ? 's' : ''} in Krave Microgreens\\.`)
}
