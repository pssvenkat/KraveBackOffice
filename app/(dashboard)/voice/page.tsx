import type { Metadata } from 'next'
import VoiceCommandCenter from '@/components/voice/VoiceCommandCenter'

export const metadata: Metadata = { title: 'Voice Commands' }

export default function VoicePage() {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Voice Commands</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Navigate and act hands-free — also available via the 🎤 button in the header
        </p>
      </div>
      <VoiceCommandCenter />
    </div>
  )
}
