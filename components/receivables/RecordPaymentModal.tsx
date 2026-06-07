'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2, IndianRupee } from 'lucide-react'
import { recordPayment, type PaymentFormState } from '@/app/actions/payments'

type Props = {
  open: boolean
  onClose: () => void
  invoice: {
    id: string
    invoice_number: string
    customer_name: string
    total: number
    amount_paid: number
  } | null
}

const METHODS = [
  { value: 'upi',           label: 'UPI' },
  { value: 'cash',          label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'other',         label: 'Other' },
]

const initialState: PaymentFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      id="btn-payment-submit"
      type="submit"
      disabled={pending}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-green-500/20 transition-all"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? 'Saving…' : 'Record Payment'}
    </button>
  )
}

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function RecordPaymentModal({ open, onClose, invoice }: Props) {
  const [state, formAction] = useActionState(recordPayment, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) { onClose(); formRef.current?.reset() }
  }, [state.success, onClose])

  if (!open || !invoice) return null

  const outstanding = invoice.total - invoice.amount_paid
  const today = new Date().toISOString().split('T')[0]

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Record Payment</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">
              {invoice.invoice_number} · {invoice.customer_name}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#1a2235] hover:bg-[#1e2d45] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form ref={formRef} action={formAction} className="px-6 pb-6 space-y-4">
          <input type="hidden" name="invoice_id" value={invoice.id} />

          {/* Outstanding */}
          <div className="flex items-center justify-between px-3.5 py-3 bg-[#0a0f1a] rounded-xl border border-[#1e2d45]">
            <span className="text-xs text-slate-500">Outstanding</span>
            <span className="text-base font-bold text-amber-400 font-mono">₹{fmt(outstanding)}</span>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Amount Received (₹) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                id="field-payment-amount"
                name="amount"
                type="number"
                min="0.01"
                max={outstanding}
                step="0.01"
                defaultValue={outstanding.toFixed(2)}
                className={`w-full pl-9 pr-3.5 py-2.5 bg-[#0a0f1a] border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-1 transition-all ${
                  state.errors?.amount
                    ? 'border-red-500/60 focus:ring-red-500/20'
                    : 'border-[#1e2d45] focus:border-green-500/70 focus:ring-green-500/20'
                }`}
              />
            </div>
            {state.errors?.amount && <p className="mt-1 text-xs text-red-400">{state.errors.amount[0]}</p>}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Payment Date <span className="text-red-400">*</span>
            </label>
            <input
              id="field-payment-date"
              name="payment_date"
              type="date"
              defaultValue={today}
              className="w-full px-3.5 py-2.5 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl text-slate-100 text-sm focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/20 transition-all"
            />
            {state.errors?.payment_date && <p className="mt-1 text-xs text-red-400">{state.errors.payment_date[0]}</p>}
          </div>

          {/* Method */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
              Method <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map(({ value, label }) => (
                <label key={value} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="payment_method"
                    value={value}
                    defaultChecked={value === 'upi'}
                    className="peer sr-only"
                  />
                  <div className="flex items-center justify-center py-2 px-1 rounded-xl border border-[#1e2d45] bg-[#0a0f1a] peer-checked:border-green-500/60 peer-checked:bg-green-500/10 transition-all">
                    <span className="text-xs font-medium text-slate-400 peer-checked:text-green-400">{label}</span>
                  </div>
                </label>
              ))}
            </div>
            {state.errors?.payment_method && <p className="mt-1 text-xs text-red-400">{state.errors.payment_method[0]}</p>}
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Reference <span className="text-slate-600 normal-case">(UTR / Cheque no.)</span>
            </label>
            <input
              id="field-payment-ref"
              name="reference"
              type="text"
              placeholder="e.g. UPI ref 123456"
              className="w-full px-3.5 py-2.5 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/20 transition-all"
            />
          </div>

          {state.message && !state.success && (
            <p className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              {state.message}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-[#1a2235] hover:bg-[#1e2d45] text-slate-300 font-semibold text-sm rounded-xl border border-[#1e2d45] transition-all">
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  )
}
