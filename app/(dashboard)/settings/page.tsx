import type { Metadata } from 'next'
import { getSettings } from '@/app/actions/settings'
import SettingsForm from '@/components/settings/SettingsForm'
import LogoUpload from '@/components/settings/LogoUpload'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const settings = await getSettings()
  const tableReady = Object.keys(settings).length > 0

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Business info, logo, bank details, and invoice configuration
        </p>
      </div>

      {!tableReady && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 space-y-2">
          <p className="text-sm font-semibold text-amber-300">⚠️ Settings table not set up yet</p>
          <p className="text-xs text-amber-400/80">
            Run the <code className="bg-[#0a0f1a] px-1.5 py-0.5 rounded">app_settings</code> SQL
            block from <code className="bg-[#0a0f1a] px-1.5 py-0.5 rounded">DATABASE_SCHEMA.md</code>
            in your{' '}
            <a
              href="https://supabase.com/dashboard/project/eostzwmrakhfbbehytaw/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-300"
            >
              Supabase SQL Editor
            </a>
            , then refresh this page.
          </p>
        </div>
      )}

      {/* Logo upload — always shown even if other settings aren't ready */}
      <LogoUpload currentLogoUrl={settings.logo_url} />

      <SettingsForm settings={settings} />
    </div>
  )
}
