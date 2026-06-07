'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, MicOff, X } from 'lucide-react'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { parseVoiceCommand, type CommandResult } from './VoiceCommandEngine'

type Toast = { id: string; message: string; success: boolean }

export default function VoiceButton() {
  const router = useRouter()
  const [toast, setToast] = useState<Toast | null>(null)
  const [lastTranscript, setLastTranscript] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  function showToast(message: string, success: boolean) {
    const id = Math.random().toString(36).slice(2)
    setToast({ id, message, success })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 3500)
  }

  const handleResult = useCallback((transcript: string) => {
    setLastTranscript(transcript)
    const result: CommandResult = parseVoiceCommand(transcript)

    if (result.action === 'navigate' && result.destination) {
      showToast(result.message, true)
      setTimeout(() => router.push(result.destination!), 400)
    } else {
      showToast(result.message, false)
    }
  }, [router])

  const { status, interimText, startListening, stopListening } = useVoiceRecognition(handleResult)

  // Don't render on server or if unsupported
  if (!mounted) return null
  if (status === 'unsupported') return null

  const isListening = status === 'listening'
  const isProcessing = status === 'processing'

  return (
    <>
      {/* Floating mic button */}
      <div className="relative flex items-center gap-2">

        {/* Interim transcript bubble */}
        {isListening && interimText && (
          <div className="absolute right-full mr-3 whitespace-nowrap px-3 py-1.5 bg-[#1a2235] border border-green-500/30 rounded-xl text-xs text-green-300 shadow-lg animate-in fade-in slide-in-from-right-2 duration-200">
            <span className="font-mono">{interimText}</span>
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#1a2235] border-r border-t border-green-500/30 rotate-45" />
          </div>
        )}

        <button
          id="btn-voice-mic"
          onClick={startListening}
          title={isListening ? 'Click to stop' : 'Start voice command (Chrome/Edge)'}
          className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 shadow-red-500/40'
              : isProcessing
              ? 'bg-amber-500 shadow-amber-500/30 cursor-wait'
              : 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 shadow-green-500/10'
          }`}
        >
          {/* Pulse rings when listening */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
              <span className="absolute inset-[-6px] rounded-full border border-red-500/30 animate-ping animation-delay-150" />
            </>
          )}
          {isListening
            ? <MicOff className="w-4 h-4 text-white relative z-10" />
            : <Mic className={`w-4 h-4 relative z-10 ${isProcessing ? 'text-amber-200' : 'text-green-400'}`} />
          }
        </button>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-sm font-medium transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in ${
            toast.success
              ? 'bg-green-500/20 border-green-500/30 text-green-300 shadow-green-500/10'
              : 'bg-[#1a2235] border-[#1e2d45] text-slate-300 shadow-black/30'
          }`}
        >
          <Mic className={`w-4 h-4 shrink-0 ${toast.success ? 'text-green-400' : 'text-slate-500'}`} />
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-1 text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  )
}
