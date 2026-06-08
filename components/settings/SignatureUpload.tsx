'use client'

import { useRef, useState, useTransition } from 'react'
import { PenLine, Upload, X, CheckCircle2, Loader2 } from 'lucide-react'
import { uploadSignature } from '@/app/actions/settings'

export default function SignatureUpload({ currentSignatureUrl }: { currentSignatureUrl?: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ url?: string; error?: string } | null>(null)
  const [sigUrl, setSigUrl] = useState(currentSignatureUrl)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  function handleUpload() {
    if (!file) return
    const formData = new FormData()
    formData.set('signature', file)
    startTransition(async () => {
      const res = await uploadSignature(formData)
      setResult(res)
      if (res.url) {
        setSigUrl(res.url)
        setPreview(null)
        setFile(null)
        if (fileRef.current) fileRef.current.value = ''
      }
    })
  }

  function clearSelection() {
    setFile(null)
    setPreview(null)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const displayUrl = preview ?? sigUrl

  return (
    <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-[#1e2d45]">
        <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <PenLine className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Authorized Signature</h2>
          <p className="text-xs text-slate-600">Shown above "Authorized Signatory" in PDF invoices</p>
        </div>
      </div>

      <div className="flex items-start gap-5">
        {/* Signature preview box — wider than tall, like a real signature */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-40 h-16 rounded-xl bg-[#0a0f1a] border-2 border-dashed border-[#1e2d45] hover:border-green-500/40 flex items-center justify-center cursor-pointer transition-all group overflow-hidden shrink-0"
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Signature"
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <PenLine className="w-6 h-6 text-slate-700 group-hover:text-slate-500 transition-colors" />
              <span className="text-[10px] text-slate-600">Click to upload</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload className="w-4 h-4 text-white" />
          </div>
        </button>

        {/* Controls */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-300">
              {sigUrl && !preview ? '✓ Signature uploaded' : 'Upload signature image'}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">PNG or WebP with transparent background recommended</p>
            <p className="text-xs text-slate-600">Max 2MB · Landscape orientation works best</p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#1a2235] hover:bg-[#1e2d45] text-slate-300 border border-[#1e2d45] transition-all"
            >
              {sigUrl ? 'Change Signature' : 'Choose File'}
            </button>

            {file && (
              <>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 disabled:opacity-60 transition-all"
                >
                  {isPending
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Upload className="w-3.5 h-3.5" />
                  }
                  {isPending ? 'Uploading…' : 'Upload'}
                </button>
                {!isPending && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="p-2 text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>

          {file && !isPending && (
            <p className="text-xs text-slate-500 truncate max-w-[200px]">📎 {file.name}</p>
          )}

          {result?.error && (
            <p className="text-xs text-red-400">❌ {result.error}</p>
          )}
          {result?.url && (
            <p className="flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Signature saved — will appear on next PDF download
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
