import type { Metadata } from 'next'
import { Settings } from 'lucide-react'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Business information and preferences</p>
      </div>
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <Settings className="w-12 h-12 text-slate-700 mb-4" />
        <p className="text-base font-semibold text-slate-400">Settings panel</p>
        <p className="text-sm text-slate-600 mt-1">Business name, GSTIN, bank details, invoice prefix — coming in Phase 8</p>
      </div>
    </div>
  )
}
