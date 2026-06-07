'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

type DataPoint = { month: string; revenue: number }

const fmt = (n: number) =>
  n >= 1000
    ? `₹${(n / 1000).toFixed(1)}k`
    : `₹${n.toLocaleString('en-IN')}`

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a2235] border border-[#2a3a55] rounded-xl px-3.5 py-2.5 shadow-xl">
      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
      <p className="text-base font-bold text-green-400 font-mono">
        ₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

export default function RevenueChart({ data }: { data: DataPoint[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const currentMonth = new Date().toLocaleString('en-IN', { month: 'short', year: '2-digit' })

  if (data.every((d) => d.revenue === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-44 text-center">
        <p className="text-sm text-slate-600">No paid invoices in the last 6 months</p>
        <p className="text-xs text-slate-700 mt-1">Revenue will appear here once invoices are marked paid</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fill: '#475569', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }} />
        <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.month}
              fill={
                entry.month === currentMonth
                  ? 'url(#barGradientActive)'
                  : entry.revenue === maxRevenue
                  ? 'url(#barGradientPeak)'
                  : 'url(#barGradient)'
              }
            />
          ))}
        </Bar>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.15} />
          </linearGradient>
          <linearGradient id="barGradientPeak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
          </linearGradient>
          <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity={1} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.6} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  )
}
