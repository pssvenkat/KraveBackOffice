import type { Metadata } from 'next'
import { Package, Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Inventory' }

export default function InventoryPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track seeds, trays, and packing materials</p>
        </div>
        <button
          id="btn-add-item"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-green-500/25 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <Package className="w-12 h-12 text-slate-700 mb-4" />
        <p className="text-base font-semibold text-slate-400">No inventory items yet</p>
        <p className="text-sm text-slate-600 mt-1">Coming in Phase 2 — Inventory Management</p>
      </div>
    </div>
  )
}
