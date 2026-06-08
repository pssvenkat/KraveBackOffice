import type { NextRequest } from 'next/server'
import type { TelegramUpdate } from '@/lib/telegram/bot'
import { getSession } from '@/lib/telegram/session'
import {
  cmdStart, cmdHelp, cmdStock, cmdOutstanding,
  cmdRevenue, cmdAddStock, cmdCancel, cmdCustomers,
  handleAddStockItem, handleAddStockQty,
} from '@/lib/telegram/commands'

const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? ''

export async function POST(request: NextRequest) {
  // Validate secret header
  if (SECRET) {
    const header = request.headers.get('x-telegram-bot-api-secret-token')
    if (header !== SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  let update: TelegramUpdate
  try {
    update = await request.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const msg = update.message
  if (!msg?.text) return new Response('OK')

  const chatId = msg.chat.id
  const text = msg.text.trim()
  const firstName = msg.from?.first_name ?? 'there'

  try {
    // Check if it's a command
    const commandMatch = text.match(/^(\/\w+)(?:@\w+)?(?:\s+([\s\S]*))?$/)
    const command = commandMatch ? commandMatch[1].toLowerCase() : null

    // /cancel always works regardless of session state
    if (command === '/cancel') {
      await cmdCancel(chatId)
      return new Response('OK')
    }

    // If it's a known command, route to handler (clears any active session)
    if (command) {
      switch (command) {
        case '/start':      await cmdStart(chatId, firstName); break
        case '/help':       await cmdHelp(chatId); break
        case '/stock':      await cmdStock(chatId); break
        case '/outstanding': await cmdOutstanding(chatId); break
        case '/revenue':    await cmdRevenue(chatId); break
        case '/addstock':   await cmdAddStock(chatId); break
        case '/customers':  await cmdCustomers(chatId); break
        default:
          // Unknown command — check if there's a session before ignoring
          break
      }
      return new Response('OK')
    }

    // Not a command — check session state for multi-step flows
    const session = await getSession(chatId)

    if (session.state === 'addstock_item') {
      await handleAddStockItem(chatId, text, session.items)
    } else if (session.state === 'addstock_qty') {
      await handleAddStockQty(
        chatId, text,
        session.itemId, session.itemName, session.currentQty, session.unit
      )
    }
    // idle state + non-command text: silently ignore (Telegram best practice)

  } catch (err) {
    console.error('Telegram webhook error:', err)
  }

  return new Response('OK', { status: 200 })
}
