import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import VoiceButton from '@/components/voice/VoiceButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar */}
        <header className="h-14 border-b border-[#1e2d45] bg-[#111827]/50 backdrop-blur-sm flex items-center px-6 shrink-0 sticky top-0 z-10">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {/* Voice mic button — client component, hidden if browser unsupported */}
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

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

