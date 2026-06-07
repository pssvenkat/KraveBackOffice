'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { adjustStock, type InventoryFormState } from '@/app/actions/inventory'

type Props = {
  open: boolean
  onClose: () => void
  item: { id: string; name: string; quantity: number; unit: string } | null
}

const initialState: InventoryFormState = { errors: {}, message: null, success: false }

const TYPES = [
  { value: 'add', label: 'Add Stock', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', checked: 'peer-checked:border-green-500/60 peer-checked:bg-green-500/15' },
  { value: 'consume', label: 'Consume', icon: TrendingDown, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', checked: 'peer-checked:border-amber-500/60 peer-checked:bg-amber-500/15' },
  { value: 'adjust', label: 'Adjust', icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', checked: 'peer-checked:border-blue-500/60 peer-checked:bg-blue-500/15' },
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      id="btn-adjust-submit"
      type="submit"
      disabled={pending}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-green-500/20 transition-all"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? 'Saving…' : 'Update Stock'}
    </button>
  )
}

export default function AdjustStockModal({ open, onClose, item }: Props) {
  const [state, formAction] = useActionState(adjustStock, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) { onClose(); formRef.current?.reset() }
  }, [state.success, onClose])

  if (!open || !item) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Adjust Stock</h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-[220px] truncate">{item.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#1a2235] hover:bg-[#1e2d45] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="px-6 pb-6 space-y-4">
          <input type="hidden" name="item_id" value={item.id} />

          {/* Current stock badge */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0a0f1a] rounded-xl border border-[#1e2d45]">
            <span className="text-xs text-slate-500">Current stock</span>
            <span className="text-sm font-bold text-slate-200">
              {item.quantity} <span className="text-slate-500 font-normal">{item.unit}</span>
            </span>
          </div>

          {/* Transaction type */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(({ value, label, icon: Icon, color, checked }) => (
                <label key={value} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="transaction_type"
                    value={value}
                    defaultChecked={value === 'add'}
                    className="peer sr-only"
                  />
                  <div className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border border-[#1e2d45] bg-[#0a0f1a] transition-all ${checked}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-[10px] font-medium text-slate-400">{label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Quantity ({item.unit})
            </label>
            <input
              id="field-adjust-qty"
              name="quantity_delta"
              type="number"
              min="-99999"
              step="0.001"
              placeholder="0"
              className="w-full px-3.5 py-2.5 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/20 transition-all"
            />
            {state.errors?.quantity_delta && (
              <p className="mt-1 text-xs text-red-400">{state.errors.quantity_delta[0]}</p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Note <span className="text-slate-600 normal-case">(optional)</span>
            </label>
            <input
              id="field-adjust-note"
              name="note"
              type="text"
              placeholder="e.g. Received new batch"
              className="w-full px-3.5 py-2.5 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/20 transition-all"
            />
          </div>

          {state.message && !state.success && (
            <p className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              {state.message}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 bg-[#1a2235] hover:bg-[#1e2d45] text-slate-300 font-semibold text-sm rounded-xl border border-[#1e2d45] transition-all">
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  )
}
