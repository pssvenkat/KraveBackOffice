'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, ChevronRight, ChevronDown } from 'lucide-react'
import { createInvoice, type InvoiceFormState, type LineItemInput } from '@/app/actions/invoices'

type Customer = { id: string; name: string; gstin: string | null }
type CatalogItem = { id: string; name: string; description: string | null; uom: string; default_price: number }

type Props = { customers: Customer[]; catalogItems: CatalogItem[] }

const initialState: InvoiceFormState = {}

const EMPTY_ITEM: LineItemInput = { description: '', unit: '', quantity: 1, unit_price: 0 }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      id="btn-invoice-submit"
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-green-500/20 transition-all"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
      {pending ? 'Creating…' : 'Create Invoice'}
    </button>
  )
}

function fieldClass(err?: boolean) {
  return `w-full px-3.5 py-2.5 bg-[#0a0f1a] border rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-1 transition-all ${
    err ? 'border-red-500/60 focus:ring-red-500/20' : 'border-[#1e2d45] focus:border-green-500/70 focus:ring-green-500/20'
  }`
}

function cellClass() {
  return 'px-2.5 py-2 bg-[#0a0f1a] border border-[#1e2d45] rounded-lg text-slate-100 placeholder:text-slate-700 text-sm focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all w-full'
}

export default function InvoiceForm({ customers, catalogItems }: Props) {
  const [state, formAction] = useActionState(createInvoice, initialState)
  const router = useRouter()
  const [items, setItems] = useState<LineItemInput[]>([{ ...EMPTY_ITEM }])
  const [applyGst, setApplyGst] = useState(false)
  // Track which row has the catalog dropdown open
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  // Track catalog search per row
  const [catalogSearch, setCatalogSearch] = useState<Record<number, string>>({})

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const gstAmount = applyGst ? subtotal * 0.05 : 0
  const total = subtotal + gstAmount

  function addItem() { setItems((p) => [...p, { ...EMPTY_ITEM }]) }
  function removeItem(idx: number) { setItems((p) => p.length === 1 ? p : p.filter((_, i) => i !== idx)) }
  function updateItem(idx: number, field: keyof LineItemInput, value: string | number) {
    setItems((p) => p.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }

  /** When a catalog item is selected — auto-fill description, UOM, and price */
  function selectCatalogItem(rowIdx: number, cat: CatalogItem) {
    setItems((p) => p.map((it, i) => i === rowIdx
      ? { ...it, description: cat.name, unit: cat.uom, unit_price: cat.default_price }
      : it
    ))
    setOpenDropdown(null)
    setCatalogSearch((s) => ({ ...s, [rowIdx]: '' }))
  }

  const today = new Date().toISOString().split('T')[0]
  const defaultDue = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Customer + Dates + Notes */}
          <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200">Invoice Details</h2>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Customer <span className="text-red-400">*</span>
              </label>
              <select
                id="sel-customer"
                name="customer_id"
                defaultValue=""
                className={fieldClass(!!state.errors?.customer_id)}
              >
                <option value="" disabled>Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {state.errors?.customer_id && <p className="mt-1 text-xs text-red-400">{state.errors.customer_id[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                  Issue Date <span className="text-red-400">*</span>
                </label>
                <input id="field-issue-date" name="issue_date" type="date" defaultValue={today} className={fieldClass(!!state.errors?.issue_date)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Due Date</label>
                <input id="field-due-date" name="due_date" type="date" defaultValue={defaultDue} className={fieldClass()} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Notes <span className="text-slate-600 normal-case">(optional)</span>
              </label>
              <textarea id="field-notes" name="notes" rows={2} placeholder="Thank you for your business!" className={`${fieldClass()} resize-none`} />
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Line Items</h2>
                {catalogItems.length > 0 && (
                  <p className="text-xs text-slate-600 mt-0.5">Click "Select" to pick from your items catalog</p>
                )}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 px-1">
              {[
                { label: 'Item / Description', span: 'col-span-4' },
                { label: 'UOM',  span: 'col-span-2' },
                { label: 'Qty',  span: 'col-span-2' },
                { label: 'Rate ₹', span: 'col-span-2' },
                { label: 'Total', span: 'col-span-2 text-right' },
              ].map(({ label, span }) => (
                <div key={label} className={`text-[10px] font-semibold text-slate-600 uppercase tracking-widest ${span}`}>{label}</div>
              ))}
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {items.map((item, idx) => {
                const search = catalogSearch[idx] ?? ''
                const filteredCatalog = catalogItems.filter((c) =>
                  c.name.toLowerCase().includes(search.toLowerCase())
                )

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="grid grid-cols-12 gap-2 items-center">

                      {/* Description + catalog selector */}
                      <div className="col-span-4 relative">
                        <input
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          placeholder="Description"
                          className={cellClass()}
                        />
                        {/* Catalog picker button — shown when catalog has items */}
                        {catalogItems.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdown(openDropdown === idx ? null : idx)
                              setCatalogSearch((s) => ({ ...s, [idx]: '' }))
                            }}
                            className="mt-1 w-full flex items-center justify-between px-2.5 py-1 rounded-lg border border-[#1e2d45] bg-[#0a0f1a] hover:border-green-500/40 text-xs text-slate-600 hover:text-green-400 transition-all"
                          >
                            <span>Select from catalog</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === idx ? 'rotate-180' : ''}`} />
                          </button>
                        )}

                        {/* Catalog dropdown */}
                        {openDropdown === idx && (
                          <div className="absolute top-full left-0 z-30 mt-1 w-72 bg-[#111827] border border-[#1e2d45] rounded-xl shadow-2xl overflow-hidden">
                            <div className="p-2 border-b border-[#1e2d45]">
                              <input
                                autoFocus
                                value={search}
                                onChange={(e) => setCatalogSearch((s) => ({ ...s, [idx]: e.target.value }))}
                                placeholder="Search items…"
                                className="w-full px-2.5 py-1.5 bg-[#0a0f1a] border border-[#1e2d45] rounded-lg text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-green-500/50"
                              />
                            </div>
                            <div className="max-h-52 overflow-y-auto">
                              {filteredCatalog.length === 0 ? (
                                <p className="px-3 py-3 text-xs text-slate-600 text-center">No items found</p>
                              ) : (
                                filteredCatalog.map((cat) => (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => selectCatalogItem(idx, cat)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-green-500/10 hover:text-green-300 transition-colors text-left group"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-slate-200 group-hover:text-green-300">{cat.name}</p>
                                      {cat.description && <p className="text-xs text-slate-600 truncate max-w-[180px]">{cat.description}</p>}
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                      <p className="text-xs font-mono text-green-400">₹{fmt(cat.default_price)}</p>
                                      <span className="text-[10px] font-bold text-slate-500 border border-[#1e2d45] rounded px-1">{cat.uom}</span>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* UOM — auto-filled, editable */}
                      <input
                        value={item.unit}
                        onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                        placeholder="uom"
                        className="col-span-2 px-2.5 py-2 bg-[#0a0f1a] border border-[#1e2d45] rounded-lg text-slate-100 placeholder:text-slate-700 text-sm focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
                      />

                      {/* Qty */}
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="col-span-2 px-2.5 py-2 bg-[#0a0f1a] border border-[#1e2d45] rounded-lg text-slate-100 text-sm focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
                      />

                      {/* Rate */}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="col-span-2 px-2.5 py-2 bg-[#0a0f1a] border border-[#1e2d45] rounded-lg text-slate-100 text-sm focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
                      />

                      {/* Line total */}
                      <div className="col-span-1 text-right text-sm font-medium text-slate-300">
                        ₹{fmt(item.quantity * item.unit_price)}
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="col-span-1 flex justify-center p-1 text-slate-700 hover:text-red-400 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {state.errors?.items && <p className="text-xs text-red-400">{state.errors.items[0]}</p>}
          </div>
        </div>

        {/* ── RIGHT — Summary ── */}
        <div className="space-y-4">
          <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 space-y-4 sticky top-20">
            <h2 className="text-sm font-semibold text-slate-200">Summary</h2>

            {/* GST toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-300">Apply GST</p>
                <p className="text-xs text-slate-600">5% GST on subtotal</p>
              </div>
              <div className="relative">
                <input id="toggle-gst" name="apply_gst" type="checkbox" checked={applyGst} onChange={(e) => setApplyGst(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 rounded-full border border-[#1e2d45] bg-[#0a0f1a] peer-checked:bg-green-500/30 peer-checked:border-green-500/50 transition-all" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-slate-600 peer-checked:bg-green-400 peer-checked:translate-x-5 transition-all shadow" />
              </div>
            </label>

            {/* Totals */}
            <div className="space-y-2 pt-2 border-t border-[#1e2d45]">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono">₹{fmt(subtotal)}</span>
              </div>
              {applyGst && (
                <div className="flex justify-between text-sm text-slate-400">
                  <span>GST (5%)</span>
                  <span className="font-mono">₹{fmt(gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-100 pt-2 border-t border-[#1e2d45]">
                <span>Total</span>
                <span className="font-mono text-green-400">₹{fmt(total)}</span>
              </div>
            </div>

            {state.message && !state.success && (
              <p className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{state.message}</p>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <SubmitButton />
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full py-2.5 bg-[#1a2235] hover:bg-[#1e2d45] text-slate-400 text-sm font-semibold rounded-xl border border-[#1e2d45] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Close dropdowns on outside click */}
      {openDropdown !== null && (
        <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
      )}
    </form>
  )
}
