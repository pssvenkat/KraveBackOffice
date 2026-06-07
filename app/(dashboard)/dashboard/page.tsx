import type { Metadata } from 'next'
import Link from 'next/link'
import {
  TrendingUp, Package, FileText, CreditCard,
  AlertTriangle, ArrowUpRight, Users, CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import RevenueChart from '@/components/dashboard/RevenueChart'

export const metadata: Metadata = { title: 'Dashboard' }

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const STATUS_DOT: Record<string, string> = {
  draft:   'bg-slate-500',
  sent:    'bg-blue-400',
  paid:    'bg-green-400',
  partial: 'bg-amber-400',
}

function KpiCard({
  title, value, sub, icon: Icon, accent = 'green',
}: {
  title: string; value: string; sub: string
  icon: React.ElementType; accent?: 'green' | 'blue' | 'amber' | 'red' | 'purple'
}) {
  const colors = {
    green:  'from-green-500/15 to-emerald-500/5 border-green-500/20 text-green-400',
    blue:   'from-blue-500/15 to-cyan-500/5 border-blue-500/20 text-blue-400',
    amber:  'from-amber-500/15 to-yellow-500/5 border-amber-500/20 text-amber-400',
    red:    'from-red-500/15 to-rose-500/5 border-red-500/20 text-red-400',
    purple: 'from-purple-500/15 to-violet-500/5 border-purple-500/20 text-purple-400',
  }
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${colors[accent]}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">{title}</p>
          <p className="text-2xl font-bold text-slate-100 leading-tight truncate">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border bg-gradient-to-br ${colors[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  // Run all queries in parallel
  const [
    { data: monthInvoices },
    { data: outstandingInvoices },
    { data: customerCount },
    { data: lowStockItems },
    { data: recentInvoices },
    { data: monthlyData },
  ] = await Promise.all([
    // Revenue this month (paid invoices)
    supabase
      .from('invoices')
      .select('total')
      .eq('status', 'paid')
      .gte('issue_date', monthStart),

    // Outstanding (sent + partial)
    supabase
      .from('invoices')
      .select('total, amount_paid, due_date, status')
      .in('status', ['sent', 'partial']),

    // Active customers
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),

    // Low stock items
    supabase
      .from('inventory_items')
      .select('id, name, quantity, reorder_level, inventory_categories(name, icon)')
      .eq('is_active', true)
      .filter('quantity', 'lte', 'reorder_level'),

    // Recent invoices (last 5)
    supabase
      .from('invoices')
      .select('id, invoice_number, status, total, customers(name)')
      .order('created_at', { ascending: false })
      .limit(5),

    // Monthly revenue for chart (last 6 months)
    supabase
      .from('invoices')
      .select('issue_date, total, status')
      .eq('status', 'paid')
      .gte('issue_date', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]),
  ])

  // Compute KPI values
  const monthRevenue = (monthInvoices ?? []).reduce((s, i) => s + i.total, 0)
  const totalOutstanding = (outstandingInvoices ?? []).reduce((s, i) => s + (i.total - i.amount_paid), 0)
  const overdueCount = (outstandingInvoices ?? []).filter(
    (i) => i.due_date && new Date(i.due_date) < new Date(today)
  ).length
  const activeCusts = (customerCount as any)?.count ?? 0

  // Low stock: quantity <= reorder_level (and reorder > 0)
  const lowStock = (lowStockItems ?? []).filter((i: any) => i.reorder_level > 0 || i.quantity === 0)

  // Build monthly chart data
  const months: { month: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
    const revenue = (monthlyData ?? [])
      .filter((inv) => {
        const invDate = new Date(inv.issue_date)
        return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear()
      })
      .reduce((s, inv) => s + inv.total, 0)
    months.push({ month: label, revenue })
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Krave Microgreens — business at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Revenue This Month"
          value={fmt(monthRevenue)}
          sub={`${(monthInvoices ?? []).length} paid invoice${(monthInvoices ?? []).length !== 1 ? 's' : ''}`}
          icon={TrendingUp}
          accent="green"
        />
        <KpiCard
          title="Outstanding"
          value={fmt(totalOutstanding)}
          sub={`${(outstandingInvoices ?? []).length} invoice${(outstandingInvoices ?? []).length !== 1 ? 's' : ''}`}
          icon={CreditCard}
          accent="amber"
        />
        <KpiCard
          title="Overdue"
          value={String(overdueCount)}
          sub={overdueCount === 0 ? 'All on time 🎉' : `invoice${overdueCount !== 1 ? 's' : ''} past due`}
          icon={AlertTriangle}
          accent={overdueCount > 0 ? 'red' : 'green'}
        />
        <KpiCard
          title="Customers"
          value={String(activeCusts)}
          sub="Active customers"
          icon={Users}
          accent="blue"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Revenue — Last 6 Months</h2>
            <p className="text-xs text-slate-600 mt-0.5">Paid invoices only</p>
          </div>
          <Link href="/invoices" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
            All invoices <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <RevenueChart data={months} />
      </div>

      {/* Two-column: Low stock + Recent invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Low Stock Alerts */}
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">
              Low Stock
              {lowStock.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-full">{lowStock.length}</span>
              )}
            </h2>
            <Link href="/inventory" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
              Inventory <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-700 mb-2" />
              <p className="text-sm font-medium text-slate-500">All stock levels OK</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 6).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between px-3 py-2.5 bg-[#0d1525] rounded-xl border border-[#1e2d45]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{(item.inventory_categories as any)?.icon ?? '📦'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{item.name}</p>
                      <p className="text-xs text-slate-600">{(item.inventory_categories as any)?.name}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-sm font-bold font-mono ${item.quantity === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                      {item.quantity}
                    </p>
                    <p className="text-xs text-slate-600">of {item.reorder_level} min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Recent Invoices</h2>
            <Link href="/invoices" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {(recentInvoices ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="w-10 h-10 text-slate-700 mb-2" />
              <p className="text-sm font-medium text-slate-500">No invoices yet</p>
              <Link href="/invoices/new" className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-colors">
                Create First Invoice →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {(recentInvoices ?? []).map((inv: any) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between px-3 py-2.5 bg-[#0d1525] rounded-xl border border-[#1e2d45] hover:border-green-500/20 hover:bg-green-500/5 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[inv.status] ?? 'bg-slate-600'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-mono font-semibold text-slate-200 group-hover:text-green-300 transition-colors">{inv.invoice_number}</p>
                      <p className="text-xs text-slate-500 truncate">{(inv.customers as any)?.name ?? '—'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-mono font-medium text-slate-300">{fmt(inv.total)}</p>
                    <p className="text-xs capitalize text-slate-600">{inv.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
