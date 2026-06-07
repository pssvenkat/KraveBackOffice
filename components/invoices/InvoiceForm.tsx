'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, ChevronRight } from 'lucide-react'
import { createInvoice, type InvoiceFormState, type LineItemInput } from '@/app/actions/invoices'

type Customer = { id: string; name: string; gstin: string | null }

type Props = { customers: Customer[] }

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

export default function InvoiceForm({ customers }: Props) {
  const [state, formAction] = useActionState(createInvoice, initialState)
  const router = useRouter()

  const [items, setItems] = useState<LineItemInput[]>([{ ...EMPTY_ITEM }])
  const [applyGst, setApplyGst] = useState(false)

  // Computed totals
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const gstAmount = applyGst ? subtotal * 0.05 : 0
  const total = subtotal + gstAmount

  function addItem() { setItems((prev) => [...prev, { ...EMPTY_ITEM }]) }
  function removeItem(idx: number) {
    setItems((prev) => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx))
  }
  function updateItem(idx: number, field: keyof LineItemInput, value: string | number) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const today = new Date().toISOString().split('T')[0]
  const defaultDue = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden serialised line items */}
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Main form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Customer + Dates */}
          <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200">Invoice Details</h2>

            {/* Customer */}
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
              {state.errors?.customer_id && (
                <p className="mt-1 text-xs text-red-400">{state.errors.customer_id[0]}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                  Issue Date <span className="text-red-400">*</span>
                </label>
                <input
                  id="field-issue-date"
                  name="issue_date"
                  type="date"
                  defaultValue={today}
                  className={fieldClass(!!state.errors?.issue_date)}
                />
                {state.errors?.issue_date && (
                  <p className="mt-1 text-xs text-red-400">{state.errors.issue_date[0]}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                  Due Date
                </label>
                <input
                  id="field-due-date"
                  name="due_date"
                  type="date"
                  defaultValue={defaultDue}
                  className={fieldClass()}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Notes <span className="text-slate-600 normal-case">(optional)</span>
              </label>
              <textarea
                id="field-notes"
                name="notes"
                rows={2}
                placeholder="Thank you for your business!"
                className={`${fieldClass()} resize-none`}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Line Items</h2>
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
              {['Description', 'Unit', 'Qty', 'Rate (₹)', 'Total'].map((h, i) => (
                <div
                  key={h}
                  className={`text-[10px] font-semibold text-slate-600 uppercase tracking-widest ${
                    i === 0 ? 'col-span-4' : i === 1 ? 'col-span-2' : i === 4 ? 'col-span-2 text-right' : 'col-span-2'
                  }`}
                >
                  {h}
                </div>
              ))}
              <div className="col-span-1" />
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  {/* Description */}
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder="Item description"
                    className="col-span-4 px-3 py-2 bg-[#0a0f1a] border border-[#1e2d45] rounded-lg text-slate-100 placeholder:text-slate-700 text-sm focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
                  />
                  {/* Unit */}
                  <input
                    value={item.unit}
                    onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                    placeholder="kg"
                    className="col-span-2 px-3 py-2 bg-[#0a0f1a] border border-[#1e2d45] rounded-lg text-slate-100 placeholder:text-slate-700 text-sm focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
                  />
                  {/* Qty */}
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="col-span-2 px-3 py-2 bg-[#0a0f1a] border border-[#1e2d45] rounded-lg text-slate-100 text-sm focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
                  />
                  {/* Rate */}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="col-span-2 px-3 py-2 bg-[#0a0f1a] border border-[#1e2d45] rounded-lg text-slate-100 text-sm focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
                  />
                  {/* Total */}
                  <div className="col-span-2 text-right text-sm font-medium text-slate-300">
                    ₹{fmt(item.quantity * item.unit_price)}
                  </div>
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="col-span-1 flex justify-center p-1 rounded text-slate-700 hover:text-red-400 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {state.errors?.items && (
              <p className="text-xs text-red-400">{state.errors.items[0]}</p>
            )}
          </div>
        </div>

        {/* RIGHT — Summary */}
        <div className="space-y-4">
          <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 space-y-4 sticky top-20">
            <h2 className="text-sm font-semibold text-slate-200">Summary</h2>

            {/* GST toggle */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm font-medium text-slate-300">Apply GST</p>
                <p className="text-xs text-slate-600">5% GST on subtotal</p>
              </div>
              <div className="relative">
                <input
                  id="toggle-gst"
                  name="apply_gst"
                  type="checkbox"
                  checked={applyGst}
                  onChange={(e) => setApplyGst(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 rounded-full border border-[#1e2d45] bg-[#0a0f1a] peer-checked:bg-green-500/30 peer-checked:border-green-500/50 transition-all" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-slate-600 peer-checked:bg-green-400 peer-checked:translate-x-5 transition-all shadow" />
              </div>
            </label>

            {/* Totals breakdown */}
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

            {/* Error */}
            {state.message && !state.success && (
              <p className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                {state.message}
              </p>
            )}

            {/* Actions */}
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
    </form>
  )
}
