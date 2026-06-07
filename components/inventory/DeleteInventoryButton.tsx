'use client'

import { useState, useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteInventoryItem } from '@/app/actions/inventory'

type Props = { itemId: string; itemName: string }

export default function DeleteInventoryButton({ itemId, itemName }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteInventoryItem(itemId)
      if (result.error) setError(result.error)
      else setShowConfirm(false)
    })
  }

  return (
    <>
      <button
        id={`btn-delete-inv-${itemId}`}
        onClick={() => setShowConfirm(true)}
        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        title="Remove item"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false) }}
        >
          <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">Remove Item</h3>
            <p className="text-sm text-slate-400 mb-1">
              Remove <span className="font-semibold text-slate-200">{itemName}</span> from inventory?
            </p>
            <p className="text-xs text-slate-600 mb-5">
              Soft delete — transaction history is preserved.
            </p>
            {error && (
              <p className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 py-2.5 px-4 bg-[#1a2235] hover:bg-[#1e2d45] text-slate-300 font-semibold text-sm rounded-xl border border-[#1e2d45] transition-all"
              >
                Cancel
              </button>
              <button
                id="btn-delete-inv-confirm"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-semibold text-sm rounded-xl transition-all disabled:opacity-60"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
