'use client'

import { useState } from 'react'
import { useSearchSeed } from '@/hooks/use-search-seed'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Eye, ChevronLeft, ChevronRight, SlidersHorizontal, X, ArrowUp, ArrowDown, ArrowUpDown, Search, PackageCheck, AlertTriangle, Clock, CheckCircle2, TrendingUp, CalendarClock, Settings2 } from 'lucide-react'
import {
  getPurchaseOrders,
  type PurchaseOrderSummary,
  type MaterialType,
  type OrderStatus,
} from '@/actions/purchase-orders.actions'
import { OrderStatusBadge } from './order-status-badge'
import { InkOrderForm } from './ink-order-form'
import { PaperOrderForm } from './paper-order-form'
import type { Provider } from '@/actions/providers.actions'
import type { InkCatalogItem } from '@/actions/ink-catalog.actions'
import type { PaperCatalogItem } from '@/actions/paper-catalog.actions'
import { cn } from '@/lib/utils'
import { useEmbedded, toolbarStickyClass } from '@/lib/embedded-context'
import { DataRefresh } from '@/components/shared/data-refresh'
import { ToolbarHoverMenu, EmbeddedSummaryChip } from '@/components/shared/toolbar-hover-menu'

const STATUS_TABS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PARTIAL', label: 'Parcial' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

function OrdersStatsBar({ orders }: { orders: PurchaseOrderSummary[] }) {
  const todayStr = new Date().toISOString().slice(0, 10)

  const active       = orders.filter(o => o.status === 'PENDING' || o.status === 'PARTIAL').length
  const delayed      = orders.filter(o =>
    (o.status === 'PENDING' || o.status === 'PARTIAL') &&
    !!o.expected_delivery_date &&
    o.expected_delivery_date.slice(0, 10) < todayStr
  ).length
  const receivedToday = orders.filter(o =>
    (o.actual_delivery_date as string | null)?.slice(0, 10) === todayStr
  ).length

  const completedWithDates = orders.filter(o =>
    o.status === 'COMPLETED' && o.request_date && o.actual_delivery_date
  )
  const avgDays = completedWithDates.length > 0
    ? Math.round(completedWithDates.reduce((sum, o) => {
        return sum + (new Date(o.actual_delivery_date as string).getTime() - new Date(o.request_date).getTime()) / 86_400_000
      }, 0) / completedWithDates.length)
    : null

  const completedWithExp = orders.filter(o =>
    o.status === 'COMPLETED' && o.actual_delivery_date && o.expected_delivery_date
  )
  const compliance = completedWithExp.length > 0
    ? Math.round(
        completedWithExp.filter(o =>
          (o.actual_delivery_date as string).slice(0, 10) <= o.expected_delivery_date!.slice(0, 10)
        ).length / completedWithExp.length * 100
      )
    : null

  const stats = [
    { icon: Clock,        label: 'Activas',        value: active,                           accent: null          },
    { icon: CheckCircle2, label: 'Recibidas hoy',  value: receivedToday,                    accent: null          },
    { icon: AlertTriangle,label: 'Retrasadas',     value: delayed,                          accent: delayed > 0 ? 'red' as const : null },
    { icon: CalendarClock,label: 'Prom. entrega',  value: avgDays !== null ? `${avgDays} días` : '—', accent: null },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
      {stats.map(({ icon: Icon, label, value, accent }, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <span className="text-border/60 select-none hidden sm:inline">·</span>}
          <Icon className={cn('size-3 shrink-0', accent === 'red' ? 'text-red-500' : 'text-muted-foreground/50')} />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">{label}</span>
          <span className={cn('text-[11px] font-bold tabular-nums', accent === 'red' ? 'text-red-500' : 'text-foreground/80')}>
            {value}
          </span>
        </div>
      ))}

      {compliance !== null && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden sm:inline">·</span>
          <TrendingUp className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">Cumplimiento</span>
          <span className="text-[11px] font-bold tabular-nums text-foreground/80">{compliance}%</span>
          <div className="w-14 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-foreground/60 transition-all" style={{ width: `${compliance}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}


type Props = {
  initialOrders: PurchaseOrderSummary[]
  materialType: MaterialType
  providers: Provider[]
  inkCatalog: InkCatalogItem[]
  paperCatalog: PaperCatalogItem[]
  canCreate: boolean
  canReceive?: boolean
}

export function OrdersList({
  initialOrders, materialType, providers, inkCatalog, paperCatalog, canCreate, canReceive,
}: Props) {
  const embedded = useEmbedded()
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [search, setSearch] = useSearchSeed()
  const [pageSizeInput, setPageSizeInput] = useState('10')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Range filters
  const [qtyMin, setQtyMin] = useState('')
  const [qtyMax, setQtyMax] = useState('')
  const [reqFrom, setReqFrom] = useState('')
  const [reqTo, setReqTo] = useState('')
  const [delFrom, setDelFrom] = useState('')
  const [delTo, setDelTo] = useState('')

  const [sortKey, setSortKey] = useState<'order_number' | 'provider' | 'qty' | 'request_date' | 'delivery_date' | 'status'>('order_number')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const activeFilters = [qtyMin, qtyMax, reqFrom, reqTo, delFrom, delTo].filter(Boolean).length

  function resetFilters() {
    setQtyMin(''); setQtyMax('')
    setReqFrom(''); setReqTo('')
    setDelFrom(''); setDelTo('')
    setPage(1)
  }

  const { data: allOrders = initialOrders, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['purchase-orders', materialType],
    queryFn: () => getPurchaseOrders({ material_type: materialType }),
    initialData: initialOrders,
    refetchInterval: 30_000,
  })

  // ── Quick-insights helpers (filtered subset context) ───────────────────────
  const todayStr = new Date().toISOString().slice(0, 10)

  const kpiDelayed = allOrders.filter(o =>
    (o.status === 'PENDING' || o.status === 'PARTIAL') &&
    !!o.expected_delivery_date &&
    o.expected_delivery_date.slice(0, 10) < todayStr
  ).length
  const kpiToday = allOrders.filter(o =>
    (o.actual_delivery_date as string | null)?.slice(0, 10) === todayStr
  ).length
  const nextDelivery = allOrders
    .filter(o =>
      (o.status === 'PENDING' || o.status === 'PARTIAL') &&
      o.expected_delivery_date &&
      o.expected_delivery_date.slice(0, 10) >= todayStr
    )
    .sort((a, b) => a.expected_delivery_date!.localeCompare(b.expected_delivery_date!))
    [0]?.expected_delivery_date ?? null
  // ────────────────────────────────────────────────────────────────────────────

  const q = search.trim().toLowerCase()
  const orders = allOrders.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false

    if (q) {
      const num = `#${o.order_number}`
      const prov = (o.providers?.name ?? '').toLowerCase()
      if (!num.includes(q) && !prov.includes(q)) return false
    }

    const total = materialType === 'INK'
      ? o.ink_items.reduce((s, i) => s + (i.total_kg_ordered ?? 0), 0)
      : o.paper_items.reduce((s, i) => s + (i.total_m2_ordered ?? 0), 0)
    if (qtyMin !== '' && total < parseFloat(qtyMin)) return false
    if (qtyMax !== '' && total > parseFloat(qtyMax)) return false

    const req = o.request_date?.slice(0, 10) ?? ''
    if (reqFrom && req < reqFrom) return false
    if (reqTo && req > reqTo) return false

    const del = o.expected_delivery_date?.slice(0, 10) ?? ''
    if (delFrom && (!del || del < delFrom)) return false
    if (delTo && (!del || del > delTo)) return false

    return true
  })
  const dir = sortDir === 'asc' ? 1 : -1
  const sorted = [...orders].sort((a, b) => {
    switch (sortKey) {
      case 'order_number': return (a.order_number - b.order_number) * dir
      case 'provider': return (a.providers?.name ?? '').localeCompare(b.providers?.name ?? '') * dir
      case 'qty': {
        const qa = materialType === 'INK' ? a.ink_items.reduce((s, i) => s + (i.total_kg_ordered ?? 0), 0) : a.paper_items.reduce((s, i) => s + (i.total_m2_ordered ?? 0), 0)
        const qb = materialType === 'INK' ? b.ink_items.reduce((s, i) => s + (i.total_kg_ordered ?? 0), 0) : b.paper_items.reduce((s, i) => s + (i.total_m2_ordered ?? 0), 0)
        return (qa - qb) * dir
      }
      case 'request_date': return a.request_date.localeCompare(b.request_date) * dir
      case 'delivery_date': return (a.expected_delivery_date ?? '').localeCompare(b.expected_delivery_date ?? '') * dir
      case 'status': return (a.status ?? '').localeCompare(b.status ?? '') * dir
      default: return 0
    }
  })

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  // Page size — inline on full pages, tucked into the "Controles" dropdown when embedded.
  const pageSizeControl = (
    <div id="orders-page-size" className="flex items-center gap-1.5 border border-border px-2.5 h-8 shrink-0">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Por página</span>
      <input
        type="number"
        min={1}
        value={pageSizeInput}
        onChange={e => {
          setPageSizeInput(e.target.value)
          const n = parseInt(e.target.value, 10)
          if (n > 0) { setPageSize(n); setPage(1) }
        }}
        onBlur={() => {
          const n = parseInt(pageSizeInput, 10)
          if (!n || n < 1) { setPageSizeInput('10'); setPageSize(10); setPage(1) }
        }}
        className="w-9 bg-transparent text-[11px] font-mono text-center outline-none"
      />
    </div>
  )

  return (
    <>
      {/* Toolbar */}
      <div className={cn('sticky z-30 bg-background border-b border-border/50 mb-6', toolbarStickyClass(embedded))}>
        <div className="py-3 flex flex-wrap items-center gap-2">

          {/* Search */}
          <div id="orders-search" className={cn('relative min-w-0', embedded ? 'flex-1' : 'shrink basis-72')}>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por # o proveedor..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="h-8 w-full pl-8 pr-7 border border-border bg-card text-xs outline-none focus:border-foreground/40 transition-colors"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status tabs */}
          <div id="orders-status-filter" className="flex border border-border shrink-0">
              {STATUS_TABS.map(t => (
                <button
                  key={t.value}
                  onClick={() => { setStatusFilter(t.value); setPage(1) }}
                  className={cn(
                    'px-3 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors',
                    statusFilter === t.value
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground border-l border-border first:border-l-0',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              id="orders-filters-btn"
              onClick={() => setFiltersOpen(v => !v)}
              title={embedded ? 'Filtros' : undefined}
              aria-label={embedded ? 'Filtros' : undefined}
              className={cn(
                'flex items-center gap-1.5 h-8 border text-[10px] font-bold uppercase tracking-widest transition-colors shrink-0',
                embedded ? 'px-2' : 'px-3',
                filtersOpen || activeFilters > 0
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <SlidersHorizontal className="size-3.5" />
              {!embedded && 'Filtros'}
              {activeFilters > 0 && (
                <span className="ml-0.5 bg-white/20 text-[9px] px-1 rounded-sm">{activeFilters}</span>
              )}
            </button>

            {!embedded && <div className="flex-1" />}

            {embedded ? (
              <>
                <EmbeddedSummaryChip>
                  <OrdersStatsBar orders={allOrders} />
                </EmbeddedSummaryChip>
                <ToolbarHoverMenu label="Controles" icon={Settings2} iconOnly>
                  <div className="flex flex-col items-start gap-2.5">
                    <DataRefresh updatedAt={dataUpdatedAt} isFetching={isFetching} onRefresh={() => refetch()} />
                    {pageSizeControl}
                  </div>
                </ToolbarHoverMenu>
              </>
            ) : (
              <>
                <DataRefresh updatedAt={dataUpdatedAt} isFetching={isFetching} onRefresh={() => refetch()} className="shrink-0" />
                {pageSizeControl}
              </>
            )}

            {canCreate && (
              <button
                id="orders-new-btn"
                onClick={() => setFormOpen(true)}
                title={embedded ? 'Nueva orden' : undefined}
                aria-label={embedded ? 'Nueva orden' : undefined}
                className={cn(
                  'flex items-center gap-2 h-8 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity shrink-0 whitespace-nowrap',
                  embedded ? 'px-2.5' : 'px-4',
                )}
              >
                <Plus className="size-3.5" />
                {!embedded && 'Nueva orden'}
              </button>
            )}

        </div>

        {/* Filter panel — inside sticky wrapper */}
        {filtersOpen && (
          <div className="border-t border-border/50 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cantidad */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Cantidad ({materialType === 'INK' ? 'kg' : 'm²'})
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} placeholder="Mín"
                  value={qtyMin}
                  onChange={e => { setQtyMin(e.target.value); setPage(1) }}
                  className="w-full border border-border px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-foreground/50"
                />
                <span className="text-muted-foreground text-xs">—</span>
                <input
                  type="number" min={0} placeholder="Máx"
                  value={qtyMax}
                  onChange={e => { setQtyMax(e.target.value); setPage(1) }}
                  className="w-full border border-border px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-foreground/50"
                />
              </div>
            </div>

            {/* Fecha solicitud */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Fecha solicitud</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={reqFrom}
                  onChange={e => { setReqFrom(e.target.value); setPage(1) }}
                  className="w-full border border-border px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-foreground/50"
                />
                <span className="text-muted-foreground text-xs">—</span>
                <input
                  type="date"
                  value={reqTo}
                  onChange={e => { setReqTo(e.target.value); setPage(1) }}
                  className="w-full border border-border px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-foreground/50"
                />
              </div>
            </div>

            {/* Fecha entrega esperada */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Entrega esperada</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={delFrom}
                  onChange={e => { setDelFrom(e.target.value); setPage(1) }}
                  className="w-full border border-border px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-foreground/50"
                />
                <span className="text-muted-foreground text-xs">—</span>
                <input
                  type="date"
                  value={delTo}
                  onChange={e => { setDelTo(e.target.value); setPage(1) }}
                  className="w-full border border-border px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-foreground/50"
                />
              </div>
            </div>

            {activeFilters > 0 && (
              <div className="sm:col-span-3 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3" />
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {!embedded && (
          <div className="py-3">
            <OrdersStatsBar orders={allOrders} />
          </div>
        )}
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            No hay órdenes para mostrar
          </p>
        </div>
      ) : (
        <>
          <div id="orders-table" className="border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/40">
                  {([
                    { label: '#Orden', key: 'order_number' },
                    { label: 'Proveedor', key: 'provider' },
                    { label: 'Artículos', key: null },
                    { label: 'Cantidad', key: 'qty' },
                    { label: 'Solicitud', key: 'request_date' },
                    { label: 'Entrega esp.', key: 'delivery_date' },
                    { label: 'Estado', key: 'status' },
                    { label: '', key: null },
                  ] as const).map(col => (
                    <th
                      key={col.label}
                      onClick={() => col.key && toggleSort(col.key)}
                      className={cn(
                        'px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground select-none',
                        col.key && 'cursor-pointer hover:text-foreground transition-colors'
                      )}
                    >
                      {col.key ? (
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          {sortKey === col.key
                            ? sortDir === 'asc'
                              ? <ArrowUp className="size-3" />
                              : <ArrowDown className="size-3" />
                            : <ArrowUpDown className="size-3 opacity-30" />
                          }
                        </span>
                      ) : col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paginated.map((order, index) => {
                  const items = materialType === 'INK' ? order.ink_items : order.paper_items
                  const total = materialType === 'INK'
                    ? order.ink_items.reduce((s, i) => s + (i.total_kg_ordered ?? 0), 0)
                    : order.paper_items.reduce((s, i) => s + (i.total_m2_ordered ?? 0), 0)
                  const unit = materialType === 'INK' ? 'kg' : 'm²'
                  const complete = items.filter(i => i.is_complete).length

                  const progress = items.length > 0 ? Math.round((complete / items.length) * 100) : 0

                  return (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-sm">
                        #{order.order_number}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[160px] truncate">
                        {order.providers?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] text-muted-foreground">{complete}/{items.length} completos</span>
                          <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {total.toFixed(1)} {unit}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground">
                        {fmtDate(order.request_date)}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground">
                        {order.expected_delivery_date ? fmtDate(order.expected_delivery_date) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} size="xs" />
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div id={index === 0 ? 'orders-row-actions' : undefined} className="flex items-center gap-3">
                          <Link
                            id={index === 0 ? 'orders-view-link' : undefined}
                            href={`/dashboard/orders/${order.id}`}
                            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Eye className="size-3.5" />
                            Ver
                          </Link>
                          {canReceive && (order.status === 'PENDING' || order.status === 'PARTIAL') && (
                            <Link
                              id={index === 0 ? 'orders-receive-link' : undefined}
                              href={`/dashboard/receipts/${order.id}`}
                              className="flex items-center gap-1 h-6 px-2 bg-foreground text-background text-[9px] font-bold uppercase tracking-widest hover:opacity-75 transition-opacity"
                            >
                              <PackageCheck className="size-3" />
                              Recibir
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </>
      )}

      {/* Bottom bar: insights + pagination */}
      <div className="flex items-center justify-between mt-4">

        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <span>{orders.length} orden{orders.length !== 1 ? 'es' : ''}</span>
          {kpiDelayed > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="text-red-500 font-bold">{kpiDelayed} retrasada{kpiDelayed !== 1 ? 's' : ''}</span>
            </>
          )}
          {nextDelivery && (
            <>
              <span className="text-border">·</span>
              <span>próxima entrega {nextDelivery.slice(0, 10) === todayStr ? 'hoy' : fmtDate(nextDelivery)}</span>
            </>
          )}
          {kpiToday > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="text-foreground">{kpiToday} recibida{kpiToday !== 1 ? 's' : ''} hoy</span>
            </>
          )}
        </div>

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
              .reduce<(number | '…')[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…')
                acc.push(n)
                return acc
              }, [])
              .map((n, i) =>
                n === '…'
                  ? <span key={`e${i}`} className="w-7 text-center text-[10px] text-muted-foreground">…</span>
                  : <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={cn('size-7 text-[10px] font-bold border transition-colors', safePage === n
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border hover:bg-muted'
                    )}
                  >{n}</button>
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

      {materialType === 'INK' ? (
        <InkOrderForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          providers={providers}
          inkCatalog={inkCatalog}
        />
      ) : (
        <PaperOrderForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          providers={providers}
          paperCatalog={paperCatalog}
        />
      )}
    </>
  )
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}
