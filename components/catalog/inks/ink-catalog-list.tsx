'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InkCatalogCard } from './ink-catalog-card'
import { InkCatalogForm } from './ink-catalog-form'
import { getInkCatalog, type InkCatalogItem } from '@/actions/ink-catalog.actions'
import type { Provider } from '@/actions/providers.actions'

const STOCK_FILTERS = [
  { value: '',       label: 'Todos' },
  { value: 'ok',    label: 'OK' },
  { value: 'low',   label: 'Stock bajo' },
  { value: 'empty', label: 'Sin stock' },
]

const DEFAULT_PAGE_SIZE = 8

type DrawerState = {
  open: boolean
  mode: 'create' | 'view' | 'edit'
  item: InkCatalogItem | null
}

type Props = {
  items: InkCatalogItem[]
  providers: Provider[]
  canEdit: boolean
}

export function InkCatalogList({ items: initialItems, providers, canEdit }: Props) {
  const [search, setSearch]           = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [page, setPage]               = useState(1)
  const [pageSize, setPageSize]       = useState(DEFAULT_PAGE_SIZE)
  const [pageSizeInput, setPageSizeInput] = useState(String(DEFAULT_PAGE_SIZE))
  const [drawer, setDrawer]           = useState<DrawerState>({ open: false, mode: 'create', item: null })

  const { data: items = initialItems } = useQuery({
    queryKey: ['ink-catalog'],
    queryFn: () => getInkCatalog(),
    initialData: initialItems,
    refetchInterval: 30_000,
  })

  const filtered = items.filter(item => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      (item.color_code ?? '').toLowerCase().includes(q)

    const curr = item.current_stock_kg ?? 0
    const min  = item.min_stock_kg
    const matchStock =
      !stockFilter ||
      (stockFilter === 'empty' && curr === 0) ||
      (stockFilter === 'low'   && curr > 0 && curr < min) ||
      (stockFilter === 'ok'    && curr >= min)

    return matchSearch && matchStock
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => { setPage(1) }, [search, stockFilter, pageSize])

  const openCreate  = () => setDrawer({ open: true, mode: 'create', item: null })
  const openView    = (item: InkCatalogItem) => setDrawer({ open: true, mode: 'view',   item })
  const openEdit    = (item: InkCatalogItem) => setDrawer({ open: true, mode: 'edit',   item })
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
      <div className="sticky top-16 z-30 bg-background border-b border-border/50 -mx-8 px-8 py-3 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tinta..."
            className="h-8 w-56 border border-border bg-card pl-8 pr-7 text-xs outline-none focus:border-foreground/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Stock filter */}
        <div className="flex border border-border">
          {STOCK_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStockFilter(f.value)}
              className={cn(
                'px-3 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors',
                stockFilter === f.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground border-l border-border first:border-l-0',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Page size */}
        <div className="flex items-center gap-1.5 border border-border px-2.5 h-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Por página</span>
          <input
            type="number"
            min={1}
            max={100}
            value={pageSizeInput}
            onChange={handlePageSizeChange}
            onBlur={handlePageSizeBlur}
            className="w-9 bg-transparent text-[11px] font-mono text-center outline-none text-foreground"
          />
        </div>

        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 h-8 px-4 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            <Plus className="size-3.5" />
            Nueva tinta
          </button>
        )}
      </div>

      {/* Count + pagination info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {filtered.length} tinta{filtered.length !== 1 ? 's' : ''}
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
              className="size-7 flex items-center justify-center border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                  <span key={`e-${i}`} className="w-7 text-center text-[10px] text-muted-foreground">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={`size-7 text-[10px] font-bold border transition-colors ${
                      safePage === n
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {n}
                  </button>
                )
              )}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="size-7 flex items-center justify-center border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map(item => (
            <InkCatalogCard
              key={item.id}
              item={item}
              providers={providers}
              canEdit={canEdit}
              onView={openView}
              onEdit={openEdit}
            />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-border p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {search || stockFilter ? 'Sin resultados para la búsqueda' : 'Aún no hay tintas en el catálogo'}
          </p>
        </div>
      )}

      <InkCatalogForm
        open={drawer.open}
        mode={drawer.mode}
        item={drawer.item}
        canEdit={canEdit}
        providers={providers}
        onClose={closeDrawer}
      />
    </>
  )
}
