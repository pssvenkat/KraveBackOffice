'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, CheckCircle2, Building2, CreditCard, FileText } from 'lucide-react'
import { saveSettings, type SettingsFormState } from '@/app/actions/settings'

type Props = { settings: Record<string, string> }

const initialState: SettingsFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      id="btn-save-settings"
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-green-500/20 transition-all"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? 'Saving…' : 'Save Settings'}
    </button>
  )
}

function field(name: string, errors: Record<string, string[]> | undefined) {
  const hasErr = errors?.[name]?.length
  return `w-full px-3.5 py-2.5 bg-[#0a0f1a] border rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-1 transition-all ${
    hasErr ? 'border-red-500/60 focus:ring-red-500/20' : 'border-[#1e2d45] focus:border-green-500/70 focus:ring-green-500/20'
  }`
}

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode
}) {
  return (
    <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2.5 pb-2 border-b border-[#1e2d45]">
        <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-green-400" />
        </div>
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, name, settings, errors, placeholder, type = 'text', textarea = false }: {
  label: string; name: string; settings: Record<string, string>
  errors?: Record<string, string[]>; placeholder?: string; type?: string; textarea?: boolean
}) {
  const errMsg = errors?.[name]?.[0]
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
      {textarea ? (
        <textarea
          id={`field-${name}`}
          name={name}
          rows={3}
          defaultValue={settings[name] ?? ''}
          placeholder={placeholder}
          className={`${field(name, errors)} resize-none`}
        />
      ) : (
        <input
          id={`field-${name}`}
          name={name}
          type={type}
          defaultValue={settings[name] ?? ''}
          placeholder={placeholder}
          className={field(name, errors)}
        />
      )}
      {errMsg && <p className="mt-1 text-xs text-red-400">{errMsg}</p>}
    </div>
  )
}

export default function SettingsForm({ settings }: Props) {
  const [state, formAction] = useActionState(saveSettings, initialState)

  return (
    <form action={formAction} className="space-y-5">
      {/* Business Info */}
      <Section icon={Building2} title="Business Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Business Name *" name="business_name" settings={settings} errors={state.errors} placeholder="Krave Microgreens" />
          </div>
          <Field label="GSTIN" name="gstin" settings={settings} errors={state.errors} placeholder="29XXXXX1234Z1XX" />
          <Field label="Phone" name="phone" settings={settings} errors={state.errors} placeholder="+91 98765 43210" type="tel" />
          <Field label="Email" name="email" settings={settings} errors={state.errors} placeholder="hello@kravemicrogreens.com" type="email" />
          <div className="sm:col-span-2">
            <Field label="Address" name="address" settings={settings} errors={state.errors} placeholder="123, Green Street, Bangalore - 560001" textarea />
          </div>
        </div>
      </Section>

      {/* Bank Details */}
      <Section icon={CreditCard} title="Payment & Bank Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Bank Name" name="bank_name" settings={settings} errors={state.errors} placeholder="HDFC Bank" />
          <Field label="Account Number" name="account_number" settings={settings} errors={state.errors} placeholder="XXXX XXXX XXXX" />
          <Field label="IFSC Code" name="ifsc_code" settings={settings} errors={state.errors} placeholder="HDFC0001234" />
          <Field label="UPI ID" name="upi_id" settings={settings} errors={state.errors} placeholder="krave@upi" />
        </div>
      </Section>

      {/* Invoice Config */}
      <Section icon={FileText} title="Invoice Configuration">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Field label="Invoice Prefix" name="invoice_prefix" settings={settings} errors={state.errors} placeholder="e.g. KM-2026-" />
            <p className="text-xs text-slate-600 mt-1">
              Prefix is joined directly to the number — e.g. <span className="text-slate-500">KM-2026-</span> → <span className="text-slate-400">KM-2026-001</span>.
              Leave empty for plain numbers (<span className="text-slate-400">001</span>, <span className="text-slate-400">002</span>…)
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Default GST Rate
            </label>
            <div className="relative">
              <input
                id="field-default-gst-rate"
                name="default_gst_rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                defaultValue={settings.default_gst_rate ?? '5'}
                className={`${field('default_gst_rate', state.errors)} pr-8`}
                placeholder="5"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">%</span>
            </div>
            {state.errors?.default_gst_rate && (
              <p className="mt-1 text-xs text-red-400">{state.errors.default_gst_rate[0]}</p>
            )}
            <p className="text-xs text-slate-600 mt-1">Applied to new invoices when GST is enabled</p>
          </div>
          <div className="sm:col-span-2">
            <Field label="Default Invoice Notes" name="invoice_notes" settings={settings} errors={state.errors} placeholder="Thank you for your business! Payment due within 14 days." textarea />
          </div>
        </div>
      </Section>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        {state.success && (
          <p className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="w-4 h-4" /> {state.message}
          </p>
        )}
        {state.message && !state.success && (
          <p className="text-sm text-red-400">{state.message}</p>
        )}
        {!state.message && <div />}
        <SubmitButton />
      </div>
    </form>
  )
}
