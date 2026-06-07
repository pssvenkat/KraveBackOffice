import type { Metadata } from 'next'
import { TrendingUp, Package, FileText, CreditCard, AlertTriangle, ArrowUpRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent = 'green',
}: {
  title: string
  value: string
  sub: string
  icon: React.ElementType
  accent?: 'green' | 'blue' | 'amber' | 'red'
}) {
  const colors = {
    green: 'from-green-500/20 to-emerald-500/10 border-green-500/20 text-green-400',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20 text-blue-400',
    amber: 'from-amber-500/20 to-yellow-500/10 border-amber-500/20 text-amber-400',
    red: 'from-red-500/20 to-rose-500/10 border-red-500/20 text-red-400',
  }
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${colors[accent]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-100 leading-tight">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${colors[accent]} bg-opacity-30`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Welcome back — here&apos;s your business at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Revenue (Month)"
          value="₹0"
          sub="No invoices yet"
          icon={TrendingUp}
          accent="green"
        />
        <KpiCard
          title="Outstanding"
          value="₹0"
          sub="Total receivables"
          icon={CreditCard}
          accent="blue"
        />
        <KpiCard
          title="Overdue"
          value="0"
          sub="Invoices past due"
          icon={AlertTriangle}
          accent="amber"
        />
        <KpiCard
          title="Inventory Items"
          value="0"
          sub="Tracked items"
          icon={Package}
          accent="green"
        />
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock */}
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Low Stock Alerts</h2>
            <a href="/inventory" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Package className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500">No inventory yet</p>
            <p className="text-xs text-slate-600 mt-1">Add items in the Inventory module</p>
            <a
              href="/inventory"
              id="btn-add-inventory"
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-colors"
            >
              Go to Inventory →
            </a>
          </div>
        </div>

        {/* Recent invoices */}
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Recent Invoices</h2>
            <a href="/invoices" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileText className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500">No invoices yet</p>
            <p className="text-xs text-slate-600 mt-1">Create your first invoice to get started</p>
            <a
              href="/invoices/new"
              id="btn-new-invoice"
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-colors"
            >
              Create Invoice →
            </a>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-green-400 mb-3">🚀 Getting Started</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { step: '1', title: 'Add Customers', desc: 'Build your customer list first', href: '/customers' },
            { step: '2', title: 'Set Up Inventory', desc: 'Track seeds, trays, and packaging', href: '/inventory' },
            { step: '3', title: 'Create Invoice', desc: 'Generate your first GST invoice', href: '/invoices/new' },
          ].map(({ step, title, desc, href }) => (
            <a
              key={step}
              href={href}
              className="flex items-start gap-3 p-3 rounded-xl bg-[#111827]/60 hover:bg-[#111827] border border-[#1e2d45] transition-all group"
            >
              <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-xs font-bold text-green-400 shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200 group-hover:text-green-300 transition-colors">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
