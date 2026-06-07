'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, Pencil, Users, Phone, Mail, MapPin, BadgeCheck } from 'lucide-react'
import CustomerModal, { type CustomerForEdit } from '@/components/customers/CustomerModal'
import DeleteCustomerButton from '@/components/customers/DeleteCustomerButton'

type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  gstin: string | null
  notes: string | null
  created_at: string
}

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<CustomerForEdit | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.city?.toLowerCase().includes(q)
    )
  }, [customers, search])

  function openAdd() {
    setEditCustomer(null)
    setModalOpen(true)
  }

  function openEdit(c: Customer) {
    setEditCustomer(c)
    setModalOpen(true)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="input-customer-search"
            type="text"
            placeholder="Search by name, phone, email, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-[#1e2d45] rounded-xl text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/20 transition-all"
          />
        </div>
        <button
          id="btn-add-customer"
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-green-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-600">
        {filtered.length} {filtered.length === 1 ? 'customer' : 'customers'}
        {search && ` matching "${search}"`}
      </p>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-14 flex flex-col items-center justify-center text-center">
          <Users className="w-12 h-12 text-slate-700 mb-4" />
          {search ? (
            <>
              <p className="text-base font-semibold text-slate-400">No results found</p>
              <p className="text-sm text-slate-600 mt-1">Try a different search term</p>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-slate-400">No customers yet</p>
              <p className="text-sm text-slate-600 mt-1">Add your first customer to get started</p>
              <button
                onClick={openAdd}
                className="mt-5 flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Customer
              </button>
            </>
          )}
        </div>
      )}

      {/* Table (desktop) */}
      {filtered.length > 0 && (
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2d45]">
                  {['Customer', 'Contact', 'Location', 'GSTIN', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[#1e2d45] last:border-0 hover:bg-[#1a2235] transition-colors group"
                  >
                    {/* Name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 flex items-center justify-center text-xs font-bold text-green-400 shrink-0">
                          {c.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{c.name}</p>
                          {c.notes && (
                            <p className="text-xs text-slate-600 truncate max-w-[180px]">{c.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Phone className="w-3 h-3 text-slate-600 shrink-0" />
                            {c.phone}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Mail className="w-3 h-3 text-slate-600 shrink-0" />
                            <span className="truncate max-w-[160px]">{c.email}</span>
                          </div>
                        )}
                        {!c.phone && !c.email && <span className="text-xs text-slate-700">—</span>}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3.5">
                      {c.city || c.address ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {[c.city, c.address].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-700">—</span>
                      )}
                    </td>

                    {/* GSTIN */}
                    <td className="px-4 py-3.5">
                      {c.gstin ? (
                        <div className="flex items-center gap-1.5">
                          <BadgeCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          <span className="text-xs font-mono text-slate-400">{c.gstin}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-700">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          id={`btn-edit-customer-${c.id}`}
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-500/10 transition-all"
                          title="Edit customer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <DeleteCustomerButton customerId={c.id} customerName={c.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <CustomerModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditCustomer(null) }}
        customer={editCustomer}
      />
    </>
  )
}
