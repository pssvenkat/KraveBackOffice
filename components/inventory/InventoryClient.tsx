'use client'

import { useState, useMemo } from 'react'
import {
  Plus, Pencil, SlidersHorizontal, Search, Package,
  TrendingDown, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react'
import InventoryItemModal, { type Category, type ItemForEdit } from './InventoryItemModal'
import AdjustStockModal from './AdjustStockModal'
import DeleteInventoryButton from './DeleteInventoryButton'

export type InventoryItem = {
  id: string
  name: string
  category_id: string
  unit: string
  quantity: number
  reorder_level: number
  cost_per_unit: number | null
  is_active: boolean
  inventory_categories: { name: string; icon: string }
}

type StockStatus = 'ok' | 'low' | 'critical'

function getStatus(qty: number, reorder: number): StockStatus {
  if (reorder === 0) return qty > 0 ? 'ok' : 'critical'
  if (qty === 0) return 'critical'
  if (qty <= reorder) return 'low'
  return 'ok'
}

const STATUS_CONFIG: Record<StockStatus, { label: string; icon: typeof CheckCircle2; classes: string; dot: string }> = {
  ok:       { label: 'OK',       icon: CheckCircle2, classes: 'bg-green-500/10 text-green-400 border-green-500/20', dot: 'bg-green-400' },
  low:      { label: 'Low',      icon: AlertTriangle, classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  critical: { label: 'Critical', icon: XCircle,      classes: 'bg-red-500/10 text-red-400 border-red-500/20',   dot: 'bg-red-400' },
}

function StatusBadge({ qty, reorder }: { qty: number; reorder: number }) {
  const status = getStatus(qty, reorder)
  const { label, classes, dot } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full border ${classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

type AdjustTarget = { id: string; name: string; quantity: number; unit: string }

export default function InventoryClient({
  items,
  categories,
}: {
  items: InventoryItem[]
  categories: Category[]
}) {
  const [activeTab, setActiveTab] = useState(categories[0]?.id ?? '')
  const [search, setSearch] = useState('')
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<ItemForEdit | null>(null)
  const [adjustTarget, setAdjustTarget] = useState<AdjustTarget | null>(null)

  const tabItems = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(
      (i) =>
        i.category_id === activeTab &&
        (!q || i.name.toLowerCase().includes(q))
    )
  }, [items, activeTab, search])

  // Summary counts
  const lowCount = items.filter((i) => {
    const s = getStatus(i.quantity, i.reorder_level)
    return s === 'low' || s === 'critical'
  }).length

  function openAdd() { setEditItem(null); setItemModalOpen(true) }
  function openEdit(item: InventoryItem) {
    setEditItem({
      id: item.id,
      name: item.name,
      category_id: item.category_id,
      unit: item.unit,
      quantity: item.quantity,
      reorder_level: item.reorder_level,
      cost_per_unit: item.cost_per_unit,
    })
    setItemModalOpen(true)
  }

  const activeCat = categories.find((c) => c.id === activeTab)

  return (
    <>
      {/* Alert strip */}
      {lowCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{lowCount} item{lowCount > 1 ? 's' : ''}</span> at or below reorder level
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="input-inventory-search"
            type="text"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-[#1e2d45] rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/20 transition-all"
          />
        </div>
        <button
          id="btn-add-inventory"
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-green-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 bg-[#0a0f1a] border border-[#1e2d45] rounded-xl p-1">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id)
          const catLow = catItems.filter((i) => getStatus(i.quantity, i.reorder_level) !== 'ok').length
          return (
            <button
              key={cat.id}
              id={`tab-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setActiveTab(cat.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === cat.id
                  ? 'bg-[#111827] text-slate-100 shadow-sm border border-[#1e2d45]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="hidden sm:inline">{cat.name}</span>
              <span className="sm:hidden">{cat.name.split(' ')[0]}</span>
              {catLow > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] flex items-center justify-center font-bold">
                  {catLow}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Table */}
      {tabItems.length === 0 ? (
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-14 flex flex-col items-center justify-center text-center">
          <Package className="w-12 h-12 text-slate-700 mb-4" />
          {search ? (
            <>
              <p className="text-base font-semibold text-slate-400">No items match &ldquo;{search}&rdquo;</p>
              <p className="text-sm text-slate-600 mt-1">Try a different search</p>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-slate-400">
                No {activeCat?.name.toLowerCase()} added yet
              </p>
              <p className="text-sm text-slate-600 mt-1">Track your {activeCat?.name.toLowerCase()} stock</p>
              <button
                onClick={openAdd}
                className="mt-5 flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Item
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2d45]">
                  {['Item', 'Stock', 'Reorder At', 'Cost/Unit', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabItems.map((item) => (
                  <tr key={item.id} className="border-b border-[#1e2d45] last:border-0 hover:bg-[#1a2235] transition-colors group">
                    {/* Item name */}
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-slate-200">{item.name}</p>
                      <p className="text-xs text-slate-600">{item.unit}</p>
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3.5">
                      <p className={`text-sm font-bold ${
                        getStatus(item.quantity, item.reorder_level) === 'ok'
                          ? 'text-slate-200'
                          : getStatus(item.quantity, item.reorder_level) === 'low'
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}>
                        {item.quantity.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-slate-600">{item.unit}</p>
                    </td>

                    {/* Reorder level */}
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-slate-400">
                        {item.reorder_level > 0
                          ? `${item.reorder_level.toLocaleString('en-IN')} ${item.unit}`
                          : <span className="text-slate-700">—</span>}
                      </p>
                    </td>

                    {/* Cost */}
                    <td className="px-4 py-3.5">
                      {item.cost_per_unit != null ? (
                        <p className="text-sm text-slate-400">
                          ₹{item.cost_per_unit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-700">—</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3.5">
                      <StatusBadge qty={item.quantity} reorder={item.reorder_level} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          id={`btn-adjust-${item.id}`}
                          onClick={() => setAdjustTarget({ id: item.id, name: item.name, quantity: item.quantity, unit: item.unit })}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                          title="Adjust stock"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-edit-inv-${item.id}`}
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-500/10 transition-all"
                          title="Edit item"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <DeleteInventoryButton itemId={item.id} itemName={item.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Footer summary */}
              <tfoot>
                <tr className="border-t border-[#1e2d45] bg-[#0d1525]">
                  <td className="px-4 py-2.5 text-xs text-slate-600">
                    {tabItems.length} item{tabItems.length !== 1 ? 's' : ''}
                  </td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <InventoryItemModal
        open={itemModalOpen}
        onClose={() => { setItemModalOpen(false); setEditItem(null) }}
        categories={categories}
        item={editItem}
        defaultCategoryId={activeTab}
      />
      <AdjustStockModal
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        item={adjustTarget}
      />
    </>
  )
}
