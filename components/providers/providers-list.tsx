'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProviderCard } from './provider-card'
import { ProviderForm } from './provider-form'
import { getProviders, type Provider } from '@/actions/providers.actions'

const TYPE_FILTERS = [
  { value: '',               label: 'Todos' },
  { value: 'INK_SUPPLIER',   label: 'Tintas' },
  { value: 'PAPER_SUPPLIER', label: 'Papel' },
  { value: 'BOTH',           label: 'Ambos' },
]

const DEFAULT_PAGE_SIZE = 8

type DrawerState = {
  open: boolean
  mode: 'create' | 'view' | 'edit'
  provider: Provider | null
}

type Props = {
  providers: Provider[]
  canEdit: boolean
}

export function ProvidersList({ providers: initialProviders, canEdit }: Props) {
  const [search, setSearch]       = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(DEFAULT_PAGE_SIZE)
  const [pageSizeInput, setPageSizeInput] = useState(String(DEFAULT_PAGE_SIZE))
  const [drawer, setDrawer]       = useState<DrawerState>({ open: false, mode: 'create', provider: null })

  const { data: providers = initialProviders } = useQuery({
    queryKey: ['providers'],
    queryFn: () => getProviders(),
    initialData: initialProviders,
    refetchInterval: 30_000,
  })

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [search, typeFilter, pageSize])

  const openCreate  = () => setDrawer({ open: true, mode: 'create', provider: null })
  const openView    = (p: Provider) => setDrawer({ open: true, mode: 'view', provider: p })
  const openEdit    = (p: Provider) => setDrawer({ open: true, mode: 'edit', provider: p })
  const closeDrawer = () => setDrawer(d => ({ ...d, open: false }))

  function handlePageSizeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPageSizeInput(e.target.value)
    const n = parseInt(e.target.value)
    if (!isNaN(n) && n >= 1 && n <= 100) setPageSize(n)
  }

  function handlePageSizeBlur() {
    const n = parseInt(pageSizeInput)
    const clamped = isNaN(n) || n < 1 ? pageSize : Math.min(100, n)
    setPageSize(clamped)
    setPageSizeInput(String(clamped))
  }

  return (
    <>
      {/* Toolbar */}
      <div className="sticky top-16 z-30 bg-[#F5F2EA] border-b border-[#1A1A1A]/10 -mx-8 px-8 py-3 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative" id="providers-search">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#1A1A1A]/40 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar proveedor..."
            className="h-8 w-56 border border-[#1A1A1A]/20 bg-[#fdf9f0] pl-8 pr-7 text-xs outline-none focus:border-[#1A1A1A]/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5f5e59] hover:text-[#1A1A1A]">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <div className="flex border border-[#1A1A1A]/20" id="providers-type-filter">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                'px-3 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors',
                typeFilter === f.value
                  ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                  : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A] border-l border-[#1A1A1A]/20 first:border-l-0',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Page size */}
        <div className="flex items-center gap-1.5 border border-[#1A1A1A]/20 px-2.5 h-8" id="providers-page-size">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] whitespace-nowrap">Por página</span>
          <input
            type="number"
            min={1}
            max={100}
            value={pageSizeInput}
            onChange={handlePageSizeChange}
            onBlur={handlePageSizeBlur}
            className="w-9 bg-transparent text-[11px] font-mono text-center outline-none text-[#1A1A1A]"
          />
        </div>

        <span id="providers-new-btn">
          {canEdit && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 h-8 px-4 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              <Plus className="size-3.5" />
              Nuevo proveedor
            </button>
          )}
        </span>
      </div>

      {/* Count + pagination info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
          {filtered.length} proveedor{filtered.length !== 1 ? 'es' : ''}
          {filtered.length > pageSize && (
            <span className="ml-1 font-normal normal-case tracking-normal">
              — mostrando {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}
            </span>
          )}
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="size-7 flex items-center justify-center border border-[#1A1A1A]/20 hover:bg-[#E5E1D8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
              .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                acc.push(n)
                return acc
              }, [])
              .map((n, i) =>
                n === '…' ? (
                  <span key={`ellipsis-${i}`} className="w-7 text-center text-[10px] text-[#5f5e59]">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={`size-7 text-[10px] font-bold border transition-colors ${
                      safePage === n
                        ? 'bg-[#1A1A1A] text-[#F5F2EA] border-[#1A1A1A]'
                        : 'border-[#1A1A1A]/20 hover:bg-[#E5E1D8]'
                    }`}
                  >
                    {n}
                  </button>
                )
              )}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="size-7 flex items-center justify-center border border-[#1A1A1A]/20 hover:bg-[#E5E1D8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="providers-grid">
          {paginated.map(p => (
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
