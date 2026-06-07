import type { Metadata } from 'next'
import { Mic } from 'lucide-react'

export const metadata: Metadata = { title: 'Voice Commands' }

export default function VoicePage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Voice Commands</h1>
        <p className="text-sm text-slate-500 mt-0.5">Update inventory hands-free using your voice</p>
      </div>
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center mb-4">
          <Mic className="w-8 h-8 text-green-400" />
        </div>
        <p className="text-base font-semibold text-slate-400">Voice control coming soon</p>
        <p className="text-sm text-slate-600 mt-1">Phase 6 — Web Speech API + Telegram Bot</p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left w-full max-w-md">
          {[
            '"Add 500 grams sunflower seeds"',
            '"Use 10 trays"',
            '"Show low stock"',
            '"Mark invoice 001 as paid"',
          ].map((cmd) => (
            <div key={cmd} className="px-3 py-2 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl">
              <p className="text-xs text-green-400 font-mono">{cmd}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
