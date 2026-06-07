'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { createCustomer, updateCustomer, type CustomerFormState } from '@/app/actions/customers'

export type CustomerForEdit = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  gstin: string | null
  notes: string | null
}

type Props = {
  open: boolean
  onClose: () => void
  customer?: CustomerForEdit | null
}

const initialState: CustomerFormState = { errors: {}, message: null, success: false }

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      id="btn-customer-submit"
      type="submit"
      disabled={pending}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-green-500/20 transition-all"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? 'Saving…' : isEdit ? 'Update Customer' : 'Add Customer'}
    </button>
  )
}

function Field({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  defaultValue,
  error,
  required,
}: {
  label: string
  id: string
  name: string
  type?: string
  placeholder?: string
  defaultValue?: string | null
  error?: string[]
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ''}
        className={`w-full px-3.5 py-2.5 bg-[#0a0f1a] border rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-1 transition-all ${
          error?.length
            ? 'border-red-500/60 focus:border-red-500/70 focus:ring-red-500/20'
            : 'border-[#1e2d45] focus:border-green-500/70 focus:ring-green-500/20'
        }`}
      />
      {error?.length ? <p className="mt-1 text-xs text-red-400">{error[0]}</p> : null}
    </div>
  )
}

export default function CustomerModal({ open, onClose, customer }: Props) {
  const isEdit = !!customer

  const boundUpdate = customer
    ? updateCustomer.bind(null, customer.id)
    : createCustomer

  const [state, formAction] = useActionState(boundUpdate as typeof createCustomer, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  // Close on success
  useEffect(() => {
    if (state.success) {
      onClose()
      formRef.current?.reset()
    }
  }, [state.success, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl w-full max-w-lg shadow-2xl shadow-black/60 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {isEdit ? 'Edit Customer' : 'Add Customer'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit ? 'Update customer details' : 'Add a new customer to your list'}
            </p>
          </div>
          <button
            id="btn-modal-close"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1a2235] hover:bg-[#1e2d45] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} action={formAction} className="overflow-y-auto px-6 pb-6 flex-1">
          <div className="space-y-4">
            {/* Row 1: Name (full width) */}
            <Field
              id="field-name"
              label="Business / Customer Name"
              name="name"
              placeholder="e.g. Green Grocers Pvt Ltd"
              defaultValue={customer?.name}
              error={state.errors?.name}
              required
            />

            {/* Row 2: Phone + Email */}
            <div className="grid grid-cols-2 gap-3">
              <Field
                id="field-phone"
                label="Phone"
                name="phone"
                type="tel"
                placeholder="+91 98765 43210"
                defaultValue={customer?.phone}
                error={state.errors?.phone}
              />
              <Field
                id="field-email"
                label="Email"
                name="email"
                type="email"
                placeholder="buyer@example.com"
                defaultValue={customer?.email}
                error={state.errors?.email}
              />
            </div>

            {/* Row 3: Address */}
            <Field
              id="field-address"
              label="Address"
              name="address"
              placeholder="Street / Colony"
              defaultValue={customer?.address}
              error={state.errors?.address}
            />

            {/* Row 4: City + GSTIN */}
            <div className="grid grid-cols-2 gap-3">
              <Field
                id="field-city"
                label="City"
                name="city"
                placeholder="Chennai"
                defaultValue={customer?.city}
                error={state.errors?.city}
              />
              <Field
                id="field-gstin"
                label="GSTIN"
                name="gstin"
                placeholder="33AAAAA0000A1Z5"
                defaultValue={customer?.gstin}
                error={state.errors?.gstin}
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="field-notes" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Notes
              </label>
              <textarea
                id="field-notes"
                name="notes"
                rows={2}
                placeholder="Any internal notes…"
                defaultValue={customer?.notes ?? ''}
                className="w-full px-3.5 py-2.5 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/20 transition-all resize-none"
              />
            </div>

            {/* Server error */}
            {state.message && !state.success && (
              <p className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                {state.message}
              </p>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 mt-6">
            <button
              id="btn-customer-cancel"
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
