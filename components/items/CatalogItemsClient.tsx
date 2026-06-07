'use client'

import { useState, useMemo, useTransition } from 'react'
import { Plus, Search, Pencil, Trash2, Package2, Loader2, X } from 'lucide-react'
import { deleteCatalogItem } from '@/app/actions/catalogItems'
import CatalogItemModal from './CatalogItemModal'

type CatalogItem = {
  id: string
  name: string
  description: string | null
  uom: string
  default_price: number
  hsn_code: string | null
}

const UOM_BADGE: Record<string, string> = {
  g: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  kg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pcs: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  bunch: 'bg-green-500/10 text-green-400 border-green-500/20',
  tray: 'bg-green-500/10 text-green-400 border-green-500/20',
  box: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  bag: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  packet: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  roll: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ml: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  litre: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  hr: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  service: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function CatalogItemsClient({ items }: { items: CatalogItem[] }) {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<CatalogItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() =>
    items.filter((i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
      i.uom.toLowerCase().includes(search.toLowerCase())
    ),
    [items, search]
  )

  function openAdd() { setEditItem(null); setModalOpen(true) }
  function openEdit(item: CatalogItem) { setEditItem(item); setModalOpen(true) }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteCatalogItem(id)
      setDeleteId(null)
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full pl-9 pr-3.5 py-2.5 bg-[#111827] border border-[#1e2d45] rounded-xl text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
          />
        </div>
        <button
          id="btn-add-catalog-item"
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-green-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> New Item
        </button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <Package2 className="w-3.5 h-3.5" />
        <span>{items.length} item{items.length !== 1 ? 's' : ''} in catalog</span>
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-14 flex flex-col items-center text-center">
          <Package2 className="w-12 h-12 text-slate-700 mb-4" />
          <p className="text-base font-semibold text-slate-400">
            {search ? 'No items match your search' : 'No items yet'}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {search
              ? `Try a different keyword`
              : 'Add products or services to reuse them in invoices'}
          </p>
          {!search && (
            <button
              onClick={openAdd}
              className="mt-5 flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Item
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2d45]">
                {['Name', 'UOM', 'Default Rate', 'HSN Code', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-[#1e2d45] last:border-0 hover:bg-[#1a2235] transition-colors group">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-slate-200">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-slate-600 mt-0.5 truncate max-w-xs">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full border ${UOM_BADGE[item.uom] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {item.uom}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-mono font-medium text-green-400">{fmt(item.default_price)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-mono text-slate-500">{item.hsn_code ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button
                        id={`btn-edit-${item.id}`}
                        onClick={() => openEdit(item)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#1a2235] hover:bg-green-500/15 text-slate-500 hover:text-green-400 border border-[#1e2d45] hover:border-green-500/20 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-delete-${item.id}`}
                        onClick={() => setDeleteId(item.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#1a2235] hover:bg-red-500/15 text-slate-500 hover:text-red-400 border border-[#1e2d45] hover:border-red-500/20 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit modal */}
      <CatalogItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editItem}
      />

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">Remove Item</h3>
            <p className="text-sm text-slate-400 mb-5">
              Remove <span className="font-semibold text-slate-200">{items.find((i) => i.id === deleteId)?.name}</span> from the catalog? Existing invoices are not affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isPending}
                className="flex-1 py-2.5 bg-[#1a2235] hover:bg-[#1e2d45] text-slate-300 font-semibold text-sm rounded-xl border border-[#1e2d45] transition-all"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-item"
                onClick={() => handleDelete(deleteId)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-semibold text-sm rounded-xl transition-all disabled:opacity-60"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
