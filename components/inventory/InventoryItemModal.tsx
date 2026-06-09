'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import {
  createInventoryItem,
  updateInventoryItem,
  type InventoryFormState,
} from '@/app/actions/inventory'

export type Category = { id: string; name: string; icon: string }

export type ItemForEdit = {
  id: string
  name: string
  category_id: string
  unit: string
  quantity: number
  reorder_level: number
  cost_per_unit: number | null
  tag: string | null
}

type Props = {
  open: boolean
  onClose: () => void
  categories: Category[]
  item?: ItemForEdit | null
  defaultCategoryId?: string
}

const UNITS = ['g', 'kg', 'pcs', 'rolls', 'bags', 'packets', 'bunches']
const initialState: InventoryFormState = { errors: {}, message: null, success: false }

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      id="btn-inventory-submit"
      type="submit"
      disabled={pending}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-green-500/20 transition-all"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? 'Saving…' : isEdit ? 'Update Item' : 'Add Item'}
    </button>
  )
}

export default function InventoryItemModal({
  open, onClose, categories, item, defaultCategoryId,
}: Props) {
  const isEdit = !!item
  const boundAction = item
    ? updateInventoryItem.bind(null, item.id)
    : createInventoryItem
  const [state, formAction] = useActionState(boundAction as typeof createInventoryItem, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) { onClose(); formRef.current?.reset() }
  }, [state.success, onClose])

  if (!open) return null

  const err = state.errors ?? {}

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {isEdit ? 'Edit Item' : 'Add Inventory Item'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit ? 'Update item details' : 'Add seeds, trays, or packing materials'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#1a2235] hover:bg-[#1e2d45] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="overflow-y-auto px-6 pb-6 space-y-4 flex-1">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Category <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <label key={cat.id} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="category_id"
                    value={cat.id}
                    defaultChecked={
                      item ? item.category_id === cat.id : defaultCategoryId === cat.id
                    }
                    className="peer sr-only"
                    required
                  />
                  <div className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border border-[#1e2d45] bg-[#0a0f1a] peer-checked:border-green-500/60 peer-checked:bg-green-500/10 transition-all text-center">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-xs font-medium text-slate-400 peer-checked:text-green-400">{cat.name}</span>
                  </div>
                </label>
              ))}
            </div>
            {err.category_id && <p className="mt-1 text-xs text-red-400">{err.category_id[0]}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Item Name <span className="text-red-400">*</span>
            </label>
            <input
              id="field-item-name"
              name="name"
              placeholder="e.g. Sunflower Seeds"
              defaultValue={item?.name}
              className={`w-full px-3.5 py-2.5 bg-[#0a0f1a] border rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-1 transition-all ${err.name?.length ? 'border-red-500/60 focus:ring-red-500/20' : 'border-[#1e2d45] focus:border-green-500/70 focus:ring-green-500/20'}`}
            />
            {err.name && <p className="mt-1 text-xs text-red-400">{err.name[0]}</p>}
          </div>

          {/* Tag */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Tag <span className="text-slate-600 normal-case">optional — e.g. Boxes, Labels, Trays</span>
            </label>
            <input
              id="field-item-tag"
              name="tag"
              placeholder="e.g. Boxes"
              defaultValue={item?.tag ?? ''}
              maxLength={50}
              className="w-full px-3.5 py-2.5 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Unit <span className="text-red-400">*</span>
            </label>
            <select
              id="field-item-unit"
              name="unit"
              defaultValue={item?.unit ?? ''}
              className="w-full px-3.5 py-2.5 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/20 transition-all"
            >
              <option value="" disabled>Select unit…</option>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            {err.unit && <p className="mt-1 text-xs text-red-400">{err.unit[0]}</p>}
          </div>

          {/* Quantity + Reorder Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Current Stock
              </label>
              <input
                id="field-item-quantity"
                name="quantity"
                type="number"
                min="0"
                step="0.001"
                defaultValue={item?.quantity ?? 0}
                className="w-full px-3.5 py-2.5 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/20 transition-all"
              />
              {err.quantity && <p className="mt-1 text-xs text-red-400">{err.quantity[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Reorder Level
              </label>
              <input
                id="field-item-reorder"
                name="reorder_level"
                type="number"
                min="0"
                step="0.001"
                defaultValue={item?.reorder_level ?? 0}
                className="w-full px-3.5 py-2.5 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/20 transition-all"
              />
            </div>
          </div>

          {/* Cost per unit */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Cost per Unit (₹) <span className="text-slate-600 normal-case">optional</span>
            </label>
            <input
              id="field-item-cost"
              name="cost_per_unit"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              defaultValue={item?.cost_per_unit ?? ''}
              className="w-full px-3.5 py-2.5 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/20 transition-all"
            />
          </div>

          {/* Error */}
          {state.message && !state.success && (
            <p className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {state.message}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-[#1a2235] hover:bg-[#1e2d45] text-slate-300 font-semibold text-sm rounded-xl border border-[#1e2d45] transition-all"
            >
              Cancel
            </button>
            <SubmitButton isEdit={isEdit} />
          </div>
        </form>
      </div>
    </div>
  )
}
