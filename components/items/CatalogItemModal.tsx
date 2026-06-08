'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import {
  createCatalogItem, updateCatalogItem,
  type CatalogItemFormState,
} from '@/app/actions/catalogItems'

type CatalogItem = {
  id: string
  name: string
  description: string | null
  uom: string
  default_price: number
  hsn_code: string | null
}

type Props = {
  open: boolean
  onClose: () => void
  item?: CatalogItem | null
}

const initialState: CatalogItemFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      id="btn-catalog-item-save"
      type="submit"
      disabled={pending}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-green-500/20 transition-all"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? 'Saving…' : 'Save Item'}
    </button>
  )
}

function fieldCls(err?: boolean) {
  return `w-full px-3.5 py-2.5 bg-[#0a0f1a] border rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-1 transition-all ${
    err ? 'border-red-500/60 focus:ring-red-500/20' : 'border-[#1e2d45] focus:border-green-500/70 focus:ring-green-500/20'
  }`
}

const UOM_GROUPS = [
  { label: 'Weight',   items: ['g', 'kg'] },
  { label: 'Quantity', items: ['pcs', 'bunch', 'tray', 'box', 'bag', 'packet', 'roll'] },
  { label: 'Volume',   items: ['ml', 'litre'] },
  { label: 'Service',  items: ['hr', 'service'] },
]

// ── Create form (separate component so useActionState is stable) ──────────────
function CreateForm({ onClose, defaultUom = 'pcs' }: { onClose: () => void; defaultUom?: string }) {
  const [state, formAction] = useActionState(createCatalogItem, initialState)

  useEffect(() => {
    if (state.success) onClose()
  }, [state.success, onClose])

  return <ItemForm state={state} formAction={formAction} onClose={onClose} defaultUom={defaultUom} />
}

// ── Edit form (separate component, action is stable per item) ─────────────────
function EditForm({ item, onClose }: { item: CatalogItem; onClose: () => void }) {
  // Stabilise the bound action via ref — EditForm remounts on item.id change (key prop)
  const actionRef = useRef(updateCatalogItem.bind(null, item.id))
  const [state, formAction] = useActionState(actionRef.current, initialState)

  useEffect(() => {
    if (state.success) onClose()
  }, [state.success, onClose])

  return <ItemForm state={state} formAction={formAction} onClose={onClose} item={item} defaultUom={item.uom} />
}

// ── Shared form body ──────────────────────────────────────────────────────────
function ItemForm({
  state, formAction, onClose, item, defaultUom,
}: {
  state: CatalogItemFormState
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formAction: any
  onClose: () => void
  item?: CatalogItem
  defaultUom: string
}) {
  return (
    <form action={formAction} className="px-6 pb-6 space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
          Item Name <span className="text-red-400">*</span>
        </label>
        <input
          id="field-item-name"
          name="name"
          type="text"
          defaultValue={item?.name ?? ''}
          placeholder="e.g. Sunflower Microgreens"
          className={fieldCls(!!state.errors?.name)}
          autoFocus
        />
        {state.errors?.name && <p className="mt-1 text-xs text-red-400">{state.errors.name[0]}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
          Description <span className="text-slate-600 normal-case">(optional)</span>
        </label>
        <textarea
          id="field-item-desc"
          name="description"
          rows={2}
          defaultValue={item?.description ?? ''}
          placeholder="Brief description for invoice line items"
          className={`${fieldCls()} resize-none`}
        />
      </div>

      {/* UOM */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
          Unit of Measure (UOM) <span className="text-red-400">*</span>
        </label>
        <div className="space-y-2">
          {UOM_GROUPS.map(({ label, items }) => (
            <div key={label}>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest mb-1.5 px-0.5">{label}</p>
              <div className="flex flex-wrap gap-2">
                {items.map((u) => (
                  <label key={u} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="uom"
                      value={u}
                      defaultChecked={defaultUom === u}
                      className="peer sr-only"
                    />
                    <div className="px-3 py-1.5 rounded-lg border border-[#1e2d45] bg-[#0a0f1a] text-xs font-semibold text-slate-500 peer-checked:border-green-500/60 peer-checked:bg-green-500/10 peer-checked:text-green-400 hover:text-slate-300 transition-all cursor-pointer">
                      {u}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        {state.errors?.uom && <p className="mt-1 text-xs text-red-400">{state.errors.uom[0]}</p>}
      </div>

      {/* Price + HSN */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            Default Rate (₹) <span className="text-red-400">*</span>
          </label>
          <input
            id="field-item-price"
            name="default_price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={item?.default_price ?? 0}
            className={fieldCls(!!state.errors?.default_price)}
          />
          {state.errors?.default_price && <p className="mt-1 text-xs text-red-400">{state.errors.default_price[0]}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            HSN Code <span className="text-slate-600 normal-case">(opt.)</span>
          </label>
          <input
            id="field-item-hsn"
            name="hsn_code"
            type="text"
            defaultValue={item?.hsn_code ?? ''}
            placeholder="e.g. 0709"
            className={fieldCls()}
          />
        </div>
      </div>

      {state.message && !state.success && (
        <p className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{state.message}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 bg-[#1a2235] hover:bg-[#1e2d45] text-slate-300 font-semibold text-sm rounded-xl border border-[#1e2d45] transition-all"
        >
          Cancel
        </button>
        <SubmitButton />
      </div>
    </form>
  )
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
export default function CatalogItemModal({ open, onClose, item }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold text-slate-100">
            {item ? 'Edit Item' : 'New Item'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1a2235] hover:bg-[#1e2d45] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Render create or edit form with a key so state resets on switch */}
        {item
          ? <EditForm key={item.id} item={item} onClose={onClose} />
          : <CreateForm key="create" onClose={onClose} />
        }
      </div>
    </div>
  )
}
