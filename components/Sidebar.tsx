'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  CreditCard,
  Settings,
  Leaf,
  LogOut,
  ChevronRight,
  Mic,
} from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/receivables', label: 'Receivables', icon: CreditCard },
]

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#111827] border-r border-[#1e2d45] shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1e2d45]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25 shrink-0">
          <Leaf className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-100 truncate leading-tight">Krave Microgreens</p>
          <p className="text-xs text-slate-500 truncate">Back Office</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Main Menu</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            id={`nav-${label.toLowerCase()}`}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
              isActive(href)
                ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2235]'
            )}
          >
            <Icon className={clsx('w-4 h-4 shrink-0 transition-colors', isActive(href) ? 'text-green-400' : 'text-slate-500 group-hover:text-slate-300')} />
            <span className="flex-1">{label}</span>
            {isActive(href) && <ChevronRight className="w-3.5 h-3.5 text-green-500/60" />}
          </Link>
        ))}

        {/* Voice command shortcut */}
        <div className="pt-4">
          <p className="px-2 mb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Voice Control</p>
          <Link
            href="/voice"
            id="nav-voice"
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
              pathname === '/voice'
                ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2235]'
            )}
          >
            <Mic className={clsx('w-4 h-4 shrink-0', pathname === '/voice' ? 'text-green-400' : 'text-slate-500 group-hover:text-slate-300')} />
            <span className="flex-1">Voice Commands</span>
          </Link>
        </div>
      </nav>

      {/* Bottom: Settings + Logout */}
      <div className="px-3 py-4 border-t border-[#1e2d45] space-y-0.5">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            id={`nav-${label.toLowerCase()}`}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
              isActive(href)
                ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2235]'
            )}
          >
            <Icon className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-slate-300" />
            {label}
          </Link>
        ))}
        <button
          id="btn-signout"
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-red-400 transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
