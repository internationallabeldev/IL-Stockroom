'use client'

import { useState, useEffect } from 'react'
import { useSearchSeed } from '@/hooks/use-search-seed'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, ChevronLeft, ChevronRight, X, Activity, AlertTriangle, PackageX, Weight, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InkCatalogCard } from './ink-catalog-card'
import { InkCatalogForm } from './ink-catalog-form'
import { getInkCatalog, type InkCatalogItem } from '@/actions/ink-catalog.actions'
import type { Provider } from '@/actions/providers.actions'
import { DataRefresh } from '@/components/shared/data-refresh'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'hace un momento'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

function InkStatsBar({ items }: { items: InkCatalogItem[] }) {
  const active = items.filter(i => i.enabled).length
  const lowStock = items.filter(i => {
    const curr = i.current_stock_kg ?? 0
    return curr > 0 && curr < i.min_stock_kg
  }).length
  const noStock = items.filter(i => (i.current_stock_kg ?? 0) === 0 && i.enabled).length
  const totalKg = items.reduce((sum, i) => sum + (i.current_stock_kg ?? 0), 0)
  const lastUpdated = items
    .map(i => i.updated_at)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1)

  const stats = [
    {
      icon: Activity,
      label: 'Tintas activas',
      value: active,
      accent: null,
    },
    {
      icon: AlertTriangle,
      label: 'Bajo stock',
      value: lowStock,
      accent: lowStock > 0 ? 'amber' : null,
    },
    {
      icon: PackageX,
      label: 'Sin stock',
      value: noStock,
      accent: noStock > 0 ? 'red' : null,
    },
    {
      icon: Weight,
      label: 'Stock total',
      value: `${totalKg.toLocaleString('es', { maximumFractionDigits: 1 })} kg`,
      accent: null,
    },
    {
      icon: Clock,
      label: 'Último movimiento',
      value: lastUpdated ? relativeTime(lastUpdated) : '—',
      accent: null,
    },
  ] as const

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
      {stats.map(({ icon: Icon, label, value, accent }, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <span className="text-border/60 select-none hidden sm:inline">·</span>}
          <Icon
            className={cn(
              'size-3 shrink-0',
              accent === 'red'
                ? 'text-red-500'
                : accent === 'amber'
                  ? 'text-amber-400'
                  : 'text-muted-foreground/50',
            )}
          />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
            {label}
          </span>
          <span
            className={cn(
              'text-[11px] font-bold tabular-nums',
              accent === 'red'
                ? 'text-red-500'
                : accent === 'amber'
                  ? 'text-amber-400'
                  : 'text-foreground/80',
            )}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

const STOCK_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'ok', label: 'OK' },
  { value: 'low', label: 'Stock bajo' },
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
  const [search, setSearch] = useSearchSeed()
  const [stockFilter, setStockFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [pageSizeInput, setPageSizeInput] = useState(String(DEFAULT_PAGE_SIZE))
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, mode: 'create', item: null })

  const { data: items = initialItems, refetch, isFetching, dataUpdatedAt } = useQuery({
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
    const min = item.min_stock_kg
    const matchStock =
      !stockFilter ||
      (stockFilter === 'empty' && curr === 0) ||
      (stockFilter === 'low' && curr > 0 && curr < min) ||
      (stockFilter === 'ok' && curr >= min)

    return matchSearch && matchStock
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => { setPage(1) }, [search, stockFilter, pageSize])

  const openCreate = () => setDrawer({ open: true, mode: 'create', item: null })
  const openView = (item: InkCatalogItem) => setDrawer({ open: true, mode: 'view', item })
  const openEdit = (item: InkCatalogItem) => setDrawer({ open: true, mode: 'edit', item })
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
      <div className="sticky top-16 z-30 bg-background border-b border-border/50 -mx-8 px-8 mb-6">
        <div className="py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              id="catalog-search"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tinta..."
              className="h-8 w-100 border border-border bg-card pl-8 pr-7 text-xs outline-none focus:border-foreground/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className='flex flex-row gap-2'>

            {/* Stock filter */}
            <div id="catalog-stock-filter" className="flex border border-border">
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

            <DataRefresh updatedAt={dataUpdatedAt} isFetching={isFetching} onRefresh={() => refetch()} />

            {/* Page size */}
            <div id="catalog-page-size" className="flex items-center gap-1.5 border border-border px-2.5 h-8">
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
                id="catalog-new-btn"
                onClick={openCreate}
                className="flex items-center gap-2 h-8 px-4 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
              >
                <Plus className="size-3.5" />
                Nueva tinta
              </button>
            )}

          </div>
        </div>

        <div className="py-3">
          <InkStatsBar items={items} />
        </div>
      </div>

      {/* Grid */}
      {paginated.length > 0 ? (
        <div id="catalog-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

      {/* Count + Pagination — bottom */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {filtered.length} tinta{filtered.length !== 1 ? 's' : ''}
            {filtered.length > pageSize && (
              <span className="ml-1 font-normal normal-case tracking-normal">
                — mostrando {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}
              </span>
            )}
          </p>
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
                  className={`size-7 text-[10px] font-bold border transition-colors ${safePage === n
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
