'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Close on Escape
  useEffect(() => {
    if (!sidebarOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [sidebarOpen])

  return (
    <>
      {/* Mobile hamburger button — only visible on small screens */}
      <button
        id="btn-mobile-menu"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-[#1a2235] hover:bg-[#1e2d45] border border-[#1e2d45] text-slate-400 hover:text-slate-200 transition-all"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Close button inside overlay */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="fixed top-4 right-4 z-50 lg:hidden w-9 h-9 rounded-xl bg-[#1a2235] border border-[#1e2d45] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Sidebar slot — rendered by layout, shown/hidden on mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-40 lg:relative lg:z-auto lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {children}
      </div>
    </>
  )
}
