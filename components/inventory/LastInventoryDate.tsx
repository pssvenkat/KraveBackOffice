'use client'

import { useState, useTransition } from 'react'
import { CalendarDays, CheckCircle2, Pencil, X } from 'lucide-react'
import { setLastInventoryDate } from '@/app/actions/settings'

function formatDisplay(dateStr: string | null) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.floor((now.getTime() - d.getTime()) / 86400000)
}

export default function LastInventoryDate({ current }: { current: string | null }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(current ?? new Date().toISOString().slice(0, 10))
  const [saved, setSaved] = useState(current)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const days = daysSince(saved)
  const daysLabel =
    days === null ? null
    : days === 0 ? 'Today'
    : days === 1 ? 'Yesterday'
    : `${days} days ago`

  const urgencyColor =
    days === null ? 'text-slate-500'
    : days <= 7   ? 'text-green-400'
    : days <= 14  ? 'text-amber-400'
    : 'text-red-400'

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const res = await setLastInventoryDate(value)
      if (res.error) { setError(res.error); return }
      setSaved(value)
      setEditing(false)
    })
  }

  function handleToday() {
    const today = new Date().toISOString().slice(0, 10)
    setValue(today)
    setError(null)
    startTransition(async () => {
      const res = await setLastInventoryDate(today)
      if (res.error) { setError(res.error); return }
      setSaved(today)
      setEditing(false)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-[#111827] border border-[#1e2d45] rounded-xl">
      {/* Icon + Label */}
      <div className="flex items-center gap-2 text-slate-400 shrink-0">
        <CalendarDays className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">Last Stock Count</span>
      </div>

      {!editing ? (
        <>
          {/* Date display */}
          <div className="flex items-center gap-2">
            {saved ? (
              <>
                <span className="text-sm font-semibold text-slate-200">
                  {formatDisplay(saved)}
                </span>
                <span className={`text-xs font-medium ${urgencyColor}`}>
                  · {daysLabel}
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-500 italic">Not set</span>
            )}
          </div>

          {/* Edit button */}
          <button
            onClick={() => setEditing(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1a2235] hover:bg-[#1e2d45] text-slate-400 hover:text-slate-200 border border-[#1e2d45] transition-all"
          >
            <Pencil className="w-3 h-3" /> Update
          </button>
        </>
      ) : (
        <>
          {/* Date input */}
          <input
            type="date"
            value={value}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setValue(e.target.value)}
            className="px-3 py-1.5 bg-[#0a0f1a] border border-[#1e2d45] rounded-lg text-slate-100 text-sm focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/20 transition-all"
          />

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 disabled:opacity-60 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isPending ? 'Saving…' : 'Save'}
          </button>

          {/* Mark today */}
          <button
            onClick={handleToday}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1a2235] hover:bg-[#1e2d45] text-slate-300 border border-[#1e2d45] disabled:opacity-60 transition-all"
          >
            Mark Today
          </button>

          {/* Cancel */}
          <button
            onClick={() => { setEditing(false); setError(null) }}
            className="p-1.5 text-slate-600 hover:text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {error && <p className="text-xs text-red-400 w-full">{error}</p>}
        </>
      )}
    </div>
  )
}
