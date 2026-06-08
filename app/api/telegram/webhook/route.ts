import type { NextRequest } from 'next/server'
import type { TelegramUpdate } from '@/lib/telegram/bot'
import {
  cmdStart, cmdHelp, cmdStock, cmdOutstanding,
  cmdRevenue, cmdAddStock, cmdCustomers,
} from '@/lib/telegram/commands'

// Must set as Vercel env var and also pass to setWebhook as ?secret_token=
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? ''

export async function POST(request: NextRequest) {
  // Validate secret header (protects against random POSTs)
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

  // Extract command (remove @BotName suffix if present)
  const commandMatch = text.match(/^(\/\w+)(?:@\w+)?(?:\s+([\s\S]*))?$/)
  if (!commandMatch) return new Response('OK')

  const command = commandMatch[1].toLowerCase()
  const args = commandMatch[2] ?? ''

  try {
    switch (command) {
      case '/start':   await cmdStart(chatId, firstName); break
      case '/help':    await cmdHelp(chatId); break
      case '/stock':   await cmdStock(chatId); break
      case '/outstanding': await cmdOutstanding(chatId); break
      case '/revenue': await cmdRevenue(chatId); break
      case '/addstock': await cmdAddStock(chatId, args); break
      case '/customers': await cmdCustomers(chatId); break
      default:
        // Unknown command — silently ignore (Telegram best practice)
        break
    }
  } catch (err) {
    console.error('Telegram command error:', err)
  }

  // Always return 200 to Telegram to prevent retries
  return new Response('OK', { status: 200 })
}
