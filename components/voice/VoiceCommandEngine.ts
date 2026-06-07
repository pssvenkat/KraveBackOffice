export type CommandResult = {
  matched: boolean
  action: 'navigate' | 'toast' | 'none'
  destination?: string
  message: string
  label: string
}

type RouteCommand = {
  patterns: RegExp[]
  destination: string
  label: string
  description: string
}

const ROUTE_COMMANDS: RouteCommand[] = [
  {
    patterns: [/\b(dashboard|home|overview)\b/],
    destination: '/dashboard',
    label: 'Dashboard',
    description: 'Go to Dashboard',
  },
  {
    patterns: [/\b(customer[s]?|clients?)\b/],
    destination: '/customers',
    label: 'Customers',
    description: 'Go to Customers',
  },
  {
    patterns: [/\b(inventor(y|ies)|stock|item[s]?)\b/],
    destination: '/inventory',
    label: 'Inventory',
    description: 'Go to Inventory',
  },
  {
    patterns: [/\b(catalog|products?|services?|price[s]? list)\b/],
    destination: '/items',
    label: 'Items Catalog',
    description: 'Go to Items Catalog',
  },
  {
    patterns: [/\bnew invoice\b/, /\bcreate invoice\b/, /\badd invoice\b/],
    destination: '/invoices/new',
    label: 'New Invoice',
    description: 'Create a new invoice',
  },
  {
    patterns: [/\binvoice[s]?\b/],
    destination: '/invoices',
    label: 'Invoices',
    description: 'Go to Invoices',
  },
  {
    patterns: [/\b(receivable[s]?|outstanding|payment[s]? due|unpaid)\b/],
    destination: '/receivables',
    label: 'Receivables',
    description: 'Go to Receivables',
  },
  {
    patterns: [/\b(setting[s]?|preference[s]?|configuration)\b/],
    destination: '/settings',
    label: 'Settings',
    description: 'Go to Settings',
  },
  {
    patterns: [/\b(voice|command[s]?|help)\b/],
    destination: '/voice',
    label: 'Voice Commands',
    description: 'Show voice command help',
  },
  {
    patterns: [/\b(low stock|reorder|running low|stock alert)\b/],
    destination: '/inventory',
    label: 'Low Stock',
    description: 'Check low stock items',
  },
]

export function parseVoiceCommand(transcript: string): CommandResult {
  const text = transcript.toLowerCase().trim()

  // Check route navigation commands
  for (const cmd of ROUTE_COMMANDS) {
    if (cmd.patterns.some((p) => p.test(text))) {
      return {
        matched: true,
        action: 'navigate',
        destination: cmd.destination,
        message: `Going to ${cmd.label}…`,
        label: cmd.label,
      }
    }
  }

  // Unmatched
  return {
    matched: false,
    action: 'none',
    message: `Not recognised: "${transcript}"`,
    label: 'Unknown',
  }
}

// Export for the help page
export const ALL_COMMANDS = [
  {
    category: 'Navigation',
    examples: [
      { phrase: '"go to dashboard"', result: 'Opens Dashboard' },
      { phrase: '"customers"', result: 'Opens Customers' },
      { phrase: '"inventory" / "stock"', result: 'Opens Inventory' },
      { phrase: '"catalog" / "products"', result: 'Opens Items Catalog' },
      { phrase: '"invoices"', result: 'Opens Invoices' },
      { phrase: '"new invoice"', result: 'Opens New Invoice form' },
      { phrase: '"receivables" / "outstanding"', result: 'Opens Receivables' },
      { phrase: '"settings"', result: 'Opens Settings' },
    ],
  },
  {
    category: 'Quick Actions',
    examples: [
      { phrase: '"low stock"', result: 'Opens Inventory (stock alerts)' },
      { phrase: '"unpaid" / "payment due"', result: 'Opens Receivables' },
      { phrase: '"create invoice"', result: 'Opens New Invoice form' },
      { phrase: '"help" / "commands"', result: 'Opens this page' },
    ],
  },
]
