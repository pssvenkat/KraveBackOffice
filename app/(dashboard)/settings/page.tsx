import type { Metadata } from 'next'
import { getSettings } from '@/app/actions/settings'
import SettingsForm from '@/components/settings/SettingsForm'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Business info, bank details, and invoice configuration
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  )
}
