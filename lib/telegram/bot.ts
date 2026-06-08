const BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

/** Escape HTML entities for Telegram HTML parse_mode */
export function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export async function sendMessage(chatId: number, text: string): Promise<void> {
  const res = await fetch(`${BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`Telegram sendMessage failed [${res.status}]:`, body)
  }
}

export type TelegramUpdate = {
  update_id: number
  message?: {
    message_id: number
    from?: { id: number; first_name: string; username?: string }
    chat: { id: number; type: string }
    text?: string
    date: number
  }
}
