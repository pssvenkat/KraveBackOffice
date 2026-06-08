'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

export default function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close on navigation
  useEffect(() => { setOpen(false) }, [pathname])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open])

  return (
    <>
      {/* Hamburger — only on small screens, fixed to header position */}
      <button
        id="btn-mobile-menu"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="lg:hidden fixed top-3 left-4 z-20 flex items-center justify-center w-8 h-8 rounded-lg bg-[#1a2235] hover:bg-[#1e2d45] border border-[#1e2d45] text-slate-400 hover:text-slate-200 transition-all"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sliding sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative h-full">
          {children}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-[-40px] w-8 h-8 rounded-lg bg-[#111827] border border-[#1e2d45] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}
