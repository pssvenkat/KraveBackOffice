'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, MicOff, Zap, HelpCircle } from 'lucide-react'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { parseVoiceCommand, ALL_COMMANDS } from '@/components/voice/VoiceCommandEngine'

type HistoryEntry = {
  id: string
  transcript: string
  result: string
  matched: boolean
  time: Date
}

const fmtTime = (d: Date) =>
  d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export default function VoiceCommandCenter() {
  const router = useRouter()
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const handleResult = useCallback((transcript: string) => {
    const result = parseVoiceCommand(transcript)
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      transcript,
      result: result.message,
      matched: result.matched,
      time: new Date(),
    }
    setHistory((prev) => [entry, ...prev].slice(0, 20))
    if (result.action === 'navigate' && result.destination) {
      setTimeout(() => router.push(result.destination!), 600)
    }
  }, [router])

  const { status, interimText, startListening, stopListening } = useVoiceRecognition(handleResult)

  const isListening = status === 'listening'
  const isUnsupported = status === 'unsupported'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hero mic section */}
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-8 flex flex-col items-center text-center">
        {/* Mic button */}
        <div className="relative mb-5">
          {/* Outer pulse rings */}
          {isListening && (
            <>
              <span className="absolute inset-[-12px] rounded-full border border-red-500/20 animate-ping" />
              <span className="absolute inset-[-24px] rounded-full border border-red-500/10 animate-ping" style={{ animationDelay: '0.3s' }} />
            </>
          )}
          <button
            id="btn-voice-center-mic"
            onClick={isUnsupported ? undefined : startListening}
            disabled={isUnsupported}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              isUnsupported
                ? 'bg-slate-800 border border-slate-700 cursor-not-allowed'
                : isListening
                ? 'bg-red-500 shadow-red-500/40 scale-110'
                : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30 hover:scale-105 hover:shadow-green-500/50'
            }`}
          >
            {isListening
              ? <MicOff className="w-9 h-9 text-white" />
              : <Mic className="w-9 h-9 text-white" />
            }
          </button>
        </div>

        {/* Status text */}
        <div className="h-10 flex flex-col items-center justify-center">
          {isUnsupported ? (
            <p className="text-sm text-amber-400 font-medium">⚠️ Voice not supported — use Chrome or Edge</p>
          ) : isListening ? (
            <>
              <p className="text-sm font-semibold text-red-400 animate-pulse">🎤 Listening…</p>
              {interimText && (
                <p className="text-xs text-slate-400 mt-1 font-mono italic">"{interimText}"</p>
              )}
            </>
          ) : status === 'processing' ? (
            <p className="text-sm font-semibold text-amber-400">⚡ Processing…</p>
          ) : (
            <>
              <p className="text-base font-semibold text-slate-300">Tap the mic to speak</p>
              <p className="text-xs text-slate-600 mt-0.5">Chrome &amp; Edge supported · en-IN</p>
            </>
          )}
        </div>

        {isListening && (
          <button
            onClick={stopListening}
            className="mt-4 px-4 py-1.5 text-xs font-semibold text-slate-400 border border-[#1e2d45] rounded-xl hover:border-red-500/30 hover:text-red-400 transition-all"
          >
            Cancel
          </button>
        )}
      </div>

      {/* History + Commands side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Command history */}
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">Command History</h2>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="ml-auto text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Mic className="w-8 h-8 text-slate-700 mb-2" />
              <p className="text-sm text-slate-600">No commands yet</p>
              <p className="text-xs text-slate-700 mt-1">Tap the mic and speak a command</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className={`px-3 py-2.5 rounded-xl border ${
                    entry.matched
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-[#0d1525] border-[#1e2d45]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-mono text-slate-300 italic">"{entry.transcript}"</p>
                    <span className="text-[10px] text-slate-600 shrink-0">{fmtTime(entry.time)}</span>
                  </div>
                  <p className={`text-xs mt-1 ${entry.matched ? 'text-green-400' : 'text-slate-500'}`}>
                    {entry.matched ? '✓' : '✗'} {entry.result}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Command reference */}
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">Available Commands</h2>
          </div>
          <div className="space-y-4">
            {ALL_COMMANDS.map(({ category, examples }) => (
              <div key={category}>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">{category}</p>
                <div className="space-y-1.5">
                  {examples.map(({ phrase, result }) => (
                    <div key={phrase} className="flex items-start gap-2">
                      <span className="text-xs font-mono text-green-400 shrink-0">{phrase}</span>
                      <span className="text-xs text-slate-600">→ {result}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Browser tip */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-500/5 border border-blue-500/15 rounded-xl text-xs text-slate-500">
        <span className="text-blue-400 text-lg leading-none">💡</span>
        <p>
          Voice control uses the <strong className="text-slate-400">Web Speech API</strong> — works best in <strong className="text-slate-400">Google Chrome</strong> or <strong className="text-slate-400">Microsoft Edge</strong>. You can also use the <Mic className="w-3 h-3 inline text-green-400 mx-0.5" /> button in the top-right header from any page.
        </p>
      </div>
    </div>
  )
}
