'use client'

import { useState, useEffect } from 'react'
import { useSearchSeed } from '@/hooks/use-search-seed'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, ChevronLeft, ChevronRight, X, Building2, Layers, ShoppingCart, AlertTriangle, TrendingUp, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmbedded, toolbarStickyClass } from '@/lib/embedded-context'
import { ToolbarHoverMenu, EmbeddedSummaryChip } from '@/components/shared/toolbar-hover-menu'
import { ProviderCard } from './provider-card'
import { ProviderForm } from './provider-form'
import { getProviders, type Provider } from '@/actions/providers.actions'
import { getPurchaseOrders, type PurchaseOrderSummary } from '@/actions/purchase-orders.actions'

const TYPE_FILTERS = [
  { value: '',               label: 'Todos' },
  { value: 'INK_SUPPLIER',    label: 'Tintas' },
  { value: 'PAPER_SUPPLIER',  label: 'Papel' },
  { value: 'SUPPLY_SUPPLIER', label: 'Consumibles' },
  { value: 'BOTH',            label: 'Múltiples' },
]

function ProvidersStatsBar({ providers, orders }: { providers: Provider[], orders: PurchaseOrderSummary[] }) {
  const todayStr = new Date().toISOString().slice(0, 10)

  const active       = providers.filter(p => p.enabled).length
  const inkCount     = providers.filter(p => p.provider_type === 'INK_SUPPLIER').length
  const paperCount   = providers.filter(p => p.provider_type === 'PAPER_SUPPLIER').length
  const supplyCount  = providers.filter(p => p.provider_type === 'SUPPLY_SUPPLIER').length
  const bothCount    = providers.filter(p => p.provider_type === 'BOTH').length

  const activeOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PARTIAL').length

  const delayedIds = new Set(
    orders
      .filter(o =>
        (o.status === 'PENDING' || o.status === 'PARTIAL') &&
        !!o.expected_delivery_date &&
        o.expected_delivery_date.slice(0, 10) < todayStr &&
        o.provider_id != null
      )
      .map(o => o.provider_id as number)
  )
  const delayedCount = delayedIds.size

  const countByProvider: Record<number, number> = {}
  orders.forEach(o => {
    if (o.provider_id != null)
      countByProvider[o.provider_id] = (countByProvider[o.provider_id] ?? 0) + 1
  })
  const topEntry    = Object.entries(countByProvider).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
  const topProvider = topEntry ? providers.find(p => p.id === Number(topEntry[0])) ?? null : null
  const topPct      = topEntry && orders.length > 0
    ? Math.round((Number(topEntry[1]) / orders.length) * 100)
    : null

  const items = [
    { icon: Building2,     label: 'Activos',         value: active,        accent: null as 'red' | null },
    { icon: ShoppingCart,  label: 'Órdenes activas', value: activeOrders,  accent: null as 'red' | null },
    { icon: AlertTriangle, label: 'Con retrasos',    value: delayedCount,  accent: delayedCount > 0 ? 'red' as const : null },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
      {items.map(({ icon: Icon, label, value, accent }, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <span className="text-border/60 select-none hidden @2xl:inline">·</span>}
          <Icon className={cn('size-3 shrink-0', accent === 'red' ? 'text-red-500' : 'text-muted-foreground/50')} />
          <span className="text-[11px] text-muted-foreground/70 font-medium">{label}</span>
          <span className={cn('text-[11px] font-bold tabular-nums', accent === 'red' ? 'text-red-500' : 'text-foreground/80')}>
            {value}
          </span>
        </div>
      ))}

      {/* Distribución con mini stacked bar */}
      {active > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <Layers className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/70 font-medium">Distribución</span>
          <div className="flex h-1.5 w-14 overflow-hidden rounded-full gap-px">
            <div className="bg-[#008dc2] transition-all" style={{ width: `${(inkCount / active) * 100}%` }} />
            <div className="bg-foreground/40 transition-all" style={{ width: `${(paperCount / active) * 100}%` }} />
            <div className="bg-[#7c3aed] transition-all" style={{ width: `${(supplyCount / active) * 100}%` }} />
            <div className="bg-foreground/20 transition-all" style={{ width: `${(bothCount / active) * 100}%` }} />
          </div>
          {[
            { label: 'Tintas',      value: inkCount,    dot: 'bg-[#008dc2]',     num: 'text-[#008dc2]' },
            { label: 'Papel',       value: paperCount,  dot: 'bg-foreground/40', num: 'text-foreground/70' },
            { label: 'Consumibles', value: supplyCount, dot: 'bg-[#7c3aed]',     num: 'text-[#7c3aed]' },
            { label: 'Múltiples',   value: bothCount,   dot: 'bg-foreground/20', num: 'text-foreground/50' },
          ].map(seg => (
            <span key={seg.label} className="flex items-center gap-1">
              <span className={cn('size-1.5 shrink-0 rounded-full', seg.dot)} />
              <span className="text-[10px] text-muted-foreground/60">{seg.label}</span>
              <span className={cn('text-[11px] font-bold tabular-nums', seg.num)}>{seg.value}</span>
            </span>
          ))}
        </div>
      )}

      {/* Proveedor principal */}
      {topProvider && topPct !== null && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <TrendingUp className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/70 font-medium">Principal</span>
          <span className="text-[11px] font-bold tabular-nums text-foreground/80 max-w-30 truncate">{topProvider.name}</span>
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">{topPct}%</span>
        </div>
      )}
    </div>
  )
}

const DEFAULT_PAGE_SIZE = 8

type DrawerState = {
  open: boolean
  mode: 'create' | 'view' | 'edit'
  provider: Provider | null
}

type Props = {
  providers: Provider[]
  orders: PurchaseOrderSummary[]
  canEdit: boolean
}

export function ProvidersList({ providers: initialProviders, orders: initialOrders, canEdit }: Props) {
  const [search, setSearch] = useSearchSeed()
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [pageSizeInput, setPageSizeInput] = useState(String(DEFAULT_PAGE_SIZE))
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, mode: 'create', provider: null })
  const embedded = useEmbedded()

  // Auto-refresh stays here; the manual refresh + freshness now live in the
  // global top-nav control (GlobalDataRefresh), which refetches active queries.
  const { data: providers = initialProviders } = useQuery({
    queryKey: ['providers'],
    queryFn: () => getProviders(),
    initialData: initialProviders,
    refetchInterval: 30_000,
  })

  const { data: orders = initialOrders } = useQuery({
    queryKey: ['purchase-orders-all'],
    queryFn: () => getPurchaseOrders(),
    initialData: initialOrders,
    refetchInterval: 30_000,
  })

  const filtered = providers.filter(p => {
    const matchType = !typeFilter || p.provider_type === typeFilter
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || (p.contact_person ?? '').toLowerCase().includes(q)
    return matchType && matchSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => { setPage(1) }, [search, typeFilter, pageSize])

  const openCreate = () => setDrawer({ open: true, mode: 'create', provider: null })
  const openView = (p: Provider) => setDrawer({ open: true, mode: 'view', provider: p })
  const openEdit = (p: Provider) => setDrawer({ open: true, mode: 'edit', provider: p })
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

  // Page size — inline on full pages, tucked into the "Controles" dropdown when embedded.
  const pageSizeControl = (
    <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 h-8" id="providers-page-size">
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
  )

  return (
    <>
      {/* Toolbar */}
      <div className={cn('sticky z-30 bg-background border-b border-border mb-6', toolbarStickyClass(embedded))}>
        <div className="@container">
        <div className={cn(
          'py-3 flex gap-2',
          embedded
            ? 'flex-row flex-wrap items-center'
            : 'flex-col @2xl:flex-row @2xl:flex-wrap @2xl:justify-between @2xl:items-center @2xl:gap-3',
        )}>
          <div className={cn('relative min-w-0', embedded ? 'flex-1' : 'w-full @2xl:w-auto')} id="providers-search">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar proveedor..."
              className={cn(
                'h-8 w-full border border-border bg-card pl-8 pr-7 text-xs outline-none focus:border-foreground/40 transition-colors',
                !embedded && '@2xl:w-100',
              )}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className='gap-2 flex flex-row flex-wrap items-center'>

            {/* Type filter */}
            <div className="flex gap-0.5 bg-black/4 dark:bg-black/25 p-0.5 shrink-0" id="providers-type-filter">
              {TYPE_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={cn(
                    'px-3 h-7 text-[10px] font-bold uppercase tracking-widest transition-all',
                    typeFilter === f.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-foreground/50 hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {!embedded && <div className="flex-1" />}

            {embedded ? (
              <>
                <EmbeddedSummaryChip>
                  <ProvidersStatsBar providers={providers} orders={orders} />
                </EmbeddedSummaryChip>
                <ToolbarHoverMenu label="Controles" icon={Settings2} iconOnly>
                  <div className="flex flex-col items-start gap-2.5">
                    {pageSizeControl}
                  </div>
                </ToolbarHoverMenu>
              </>
            ) : (
              pageSizeControl
            )}

            <span id="providers-new-btn" className="shrink-0">
              {canEdit && (
                <button
                  onClick={openCreate}
                  title={embedded ? 'Nuevo proveedor' : undefined}
                  aria-label={embedded ? 'Nuevo proveedor' : undefined}
                  className={cn(
                    'flex items-center gap-2 h-8 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity',
                    embedded ? 'px-2.5' : 'px-4',
                  )}
                >
                  <Plus className="size-3.5" />
                  {!embedded && 'Nuevo proveedor'}
                </button>
              )}
            </span>

          </div>
        </div>

        {!embedded && (
          <div className="py-3">
            <ProvidersStatsBar providers={providers} orders={orders} />
          </div>
        )}
        </div>
      </div>

      {/* Grid */}
      {paginated.length > 0 ? (
        <div className="@container">
        <div className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4 gap-4" id="providers-grid">
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
        </div>
      ) : (
        <div className="border border-dashed border-border p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {search || typeFilter ? 'Sin resultados para la búsqueda' : 'Aún no hay proveedores'}
          </p>
        </div>
      )}

      {/* Count + pagination — dos pastillas flotantes (texto izq, paginador der;
          el medio queda libre) en página completa; inline cuando va embebido. */}
      {(() => {
        const pill = 'border border-border rounded-lg bg-card/85 backdrop-blur-sm shadow-lg'

        const countEl = (
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {filtered.length} proveedor{filtered.length !== 1 ? 'es' : ''}
            {filtered.length > pageSize && (
              <span className="ml-1 font-normal normal-case tracking-normal">
                — mostrando {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}
              </span>
            )}
          </p>
        )

        const paginationEl = totalPages > 1 ? (
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
                  <span key={`ellipsis-${i}`} className="w-7 text-center text-[10px] text-muted-foreground">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={cn(
                      'size-7 text-[10px] font-bold border transition-colors',
                      safePage === n
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:bg-muted'
                    )}
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
        ) : null

        if (embedded) {
          return (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
              {countEl}
              {paginationEl}
            </div>
          )
        }

        return (
          <>
            <div className={cn('fixed bottom-12 left-20 z-20 flex items-center px-4 py-2', pill)}>
              {countEl}
            </div>
            {paginationEl && (
              <div className={cn('fixed bottom-12 right-16 z-20 flex items-center px-3 py-2', pill)}>
                {paginationEl}
              </div>
            )}
          </>
        )
      })()}

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
