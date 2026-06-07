import { useCallback, useEffect, useRef, useState } from 'react'

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'unsupported'

export type TranscriptEntry = {
  id: string
  text: string
  timestamp: Date
  matched: boolean
  result?: string
}

export function useVoiceRecognition(onResult: (transcript: string) => void) {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [interimText, setInterimText] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setStatus('unsupported')
      return
    }

    const rec = new SpeechRecognition()
    rec.lang = 'en-IN'
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => {
      setStatus('listening')
      setInterimText('')
    }

    rec.onresult = (e: any) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript
        if (e.results[i].isFinal) final += text
        else interim += text
      }
      setInterimText(interim || final)
      if (final) {
        setStatus('processing')
        onResultRef.current(final.trim().toLowerCase())
        setInterimText('')
      }
    }

    rec.onend = () => setStatus('idle')
    rec.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') console.error('Speech error:', e.error)
      setStatus('idle')
      setInterimText('')
    }

    recognitionRef.current = rec
  }, [])

  const startListening = useCallback(() => {
    if (status === 'listening') {
      recognitionRef.current?.stop()
      return
    }
    try {
      recognitionRef.current?.start()
    } catch { /* already started */ }
  }, [status])

  const stopListening = useCallback(() => {
    recognitionRef.current?.abort()
    setStatus('idle')
    setInterimText('')
  }, [])

  return { status, interimText, startListening, stopListening }
}
