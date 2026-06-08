import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import VoiceButton from '@/components/voice/VoiceButton'
import MobileSidebar from '@/components/layout/MobileSidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar — drawer, hamburger in header */}
      <MobileSidebar>
        <Sidebar />
      </MobileSidebar>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[#1e2d45] bg-[#111827]/50 backdrop-blur-sm flex items-center px-4 sm:px-6 shrink-0 sticky top-0 z-10">
          {/* Spacer — MobileSidebar renders the hamburger before this via its own button */}
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <VoiceButton />
            <div className="w-px h-5 bg-[#1e2d45]" />
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-slate-300 leading-tight">{user.email}</p>
              <p className="text-xs text-slate-600">Administrator</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-green-500/20">
              {user.email?.[0].toUpperCase() ?? 'K'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
