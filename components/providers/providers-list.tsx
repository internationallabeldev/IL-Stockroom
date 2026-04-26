'use client'

import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { ProviderCard } from './provider-card'
import { ProviderForm } from './provider-form'
import { type Provider } from '@/actions/providers.actions'

const TYPE_FILTERS = [
  { value: '',               label: 'Todos' },
  { value: 'INK_SUPPLIER',   label: 'Tintas' },
  { value: 'PAPER_SUPPLIER', label: 'Papel' },
  { value: 'BOTH',           label: 'Ambos' },
]

type DrawerState = {
  open: boolean
  mode: 'create' | 'view' | 'edit'
  provider: Provider | null
}

type Props = {
  providers: Provider[]
  canEdit: boolean
}

export function ProvidersList({ providers, canEdit }: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, mode: 'create', provider: null })

  const filtered = providers.filter(p => {
    const matchType = !typeFilter || p.provider_type === typeFilter
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.contact_person ?? '').toLowerCase().includes(q)
    return matchType && matchSearch
  })

  const openCreate = () => setDrawer({ open: true, mode: 'create', provider: null })
  const openView   = (p: Provider) => setDrawer({ open: true, mode: 'view', provider: p })
  const openEdit   = (p: Provider) => setDrawer({ open: true, mode: 'edit', provider: p })
  const closeDrawer = () => setDrawer(d => ({ ...d, open: false }))

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#1A1A1A]/40" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar proveedor..."
            className="h-9 w-64 border border-[#1A1A1A]/20 bg-[#fdf9f0] pl-8 pr-3 text-xs outline-none focus:border-[#1A1A1A]/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex border border-[#1A1A1A]/20">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  typeFilter === f.value
                    ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                    : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {canEdit && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              <Plus className="size-3.5" />
              Nuevo proveedor
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-4">
        {filtered.length} proveedor{filtered.length !== 1 ? 'es' : ''}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <ProviderCard
              key={p.id}
              provider={p}
              canEdit={canEdit}
              onView={openView}
              onEdit={openEdit}
            />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-[#1A1A1A]/20 p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
            {search || typeFilter ? 'Sin resultados para la búsqueda' : 'Aún no hay proveedores'}
          </p>
        </div>
      )}

      <ProviderForm
        open={drawer.open}
        mode={drawer.mode}
        provider={drawer.provider}
        canEdit={canEdit}
        onClose={closeDrawer}
      />
    </>
  )
}
