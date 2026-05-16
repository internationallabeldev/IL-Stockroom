'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Eye, ChevronLeft, ChevronRight, SlidersHorizontal, X, ArrowUp, ArrowDown, ArrowUpDown, Search, PackageCheck } from 'lucide-react'
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

const STATUS_TABS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PARTIAL', label: 'Parcial' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancelada' },
]


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
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [search, setSearch] = useState('')
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

  const { data: allOrders = initialOrders } = useQuery({
    queryKey: ['purchase-orders', materialType],
    queryFn: () => getPurchaseOrders({ material_type: materialType }),
    initialData: initialOrders,
    refetchInterval: 30_000,
  })

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

  return (
    <>
      {/* Toolbar */}
      <div className="sticky top-16 z-30 bg-[#F5F2EA] border-b border-[#1A1A1A]/10 -mx-8 px-8 mb-6">
      <div className="py-3 flex flex-wrap items-center gap-3">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#5f5e59] pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por # o proveedor..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="h-8 w-56 pl-8 pr-7 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-xs outline-none focus:border-[#1A1A1A]/40 transition-colors"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5f5e59] hover:text-[#1A1A1A]">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex border border-[#1A1A1A]/20">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => { setStatusFilter(t.value); setPage(1) }}
              className={cn(
                'px-3 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors',
                statusFilter === t.value
                  ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                  : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A] border-l border-[#1A1A1A]/20 first:border-l-0',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setFiltersOpen(v => !v)}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 border text-[10px] font-bold uppercase tracking-widest transition-colors',
            filtersOpen || activeFilters > 0
              ? 'bg-[#1A1A1A] text-[#F5F2EA] border-[#1A1A1A]'
              : 'border-[#1A1A1A]/20 text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          Filtros
          {activeFilters > 0 && (
            <span className="ml-0.5 bg-white/20 text-[9px] px-1 rounded-sm">{activeFilters}</span>
          )}
        </button>

        <div className="flex-1" />

        {/* Page size */}
        <div className="flex items-center gap-1.5 border border-[#1A1A1A]/20 px-2.5 h-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] whitespace-nowrap">Por página</span>
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
            className="w-9 bg-transparent text-[11px] font-mono text-center outline-none text-[#1A1A1A]"
          />
        </div>

        {canCreate && (
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 h-8 px-4 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            <Plus className="size-3.5" />
            Nueva orden
          </button>
        )}
      </div>

      {/* Filter panel — inside sticky wrapper */}
      {filtersOpen && (
        <div className="border-t border-[#1A1A1A]/10 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Cantidad */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-2">
              Cantidad ({materialType === 'INK' ? 'kg' : 'm²'})
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} placeholder="Mín"
                value={qtyMin}
                onChange={e => { setQtyMin(e.target.value); setPage(1) }}
                className="w-full border border-[#1A1A1A]/20 px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-[#1A1A1A]"
              />
              <span className="text-[#5f5e59] text-xs">—</span>
              <input
                type="number" min={0} placeholder="Máx"
                value={qtyMax}
                onChange={e => { setQtyMax(e.target.value); setPage(1) }}
                className="w-full border border-[#1A1A1A]/20 px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>

          {/* Fecha solicitud */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-2">Fecha solicitud</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={reqFrom}
                onChange={e => { setReqFrom(e.target.value); setPage(1) }}
                className="w-full border border-[#1A1A1A]/20 px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-[#1A1A1A]"
              />
              <span className="text-[#5f5e59] text-xs">—</span>
              <input
                type="date"
                value={reqTo}
                onChange={e => { setReqTo(e.target.value); setPage(1) }}
                className="w-full border border-[#1A1A1A]/20 px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>

          {/* Fecha entrega esperada */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-2">Entrega esperada</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={delFrom}
                onChange={e => { setDelFrom(e.target.value); setPage(1) }}
                className="w-full border border-[#1A1A1A]/20 px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-[#1A1A1A]"
              />
              <span className="text-[#5f5e59] text-xs">—</span>
              <input
                type="date"
                value={delTo}
                onChange={e => { setDelTo(e.target.value); setPage(1) }}
                className="w-full border border-[#1A1A1A]/20 px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>

          {activeFilters > 0 && (
            <div className="sm:col-span-3 flex justify-end">
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] hover:text-[#1A1A1A] transition-colors"
              >
                <X className="size-3" />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="border border-dashed border-[#1A1A1A]/20 p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
            No hay órdenes para mostrar
          </p>
        </div>
      ) : (
        <>
          <div className="border border-[#1A1A1A]/15 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/40">
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
                        'px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] select-none',
                        col.key && 'cursor-pointer hover:text-[#1A1A1A] transition-colors'
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
              <tbody className="divide-y divide-[#1A1A1A]/08">
                {paginated.map(order => {
                  const items = materialType === 'INK' ? order.ink_items : order.paper_items
                  const total = materialType === 'INK'
                    ? order.ink_items.reduce((s, i) => s + (i.total_kg_ordered ?? 0), 0)
                    : order.paper_items.reduce((s, i) => s + (i.total_m2_ordered ?? 0), 0)
                  const unit = materialType === 'INK' ? 'kg' : 'm²'
                  const complete = items.filter(i => i.is_complete).length

                  return (
                    <tr key={order.id} className="hover:bg-[#E5E1D8]/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-sm">
                        #{order.order_number}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[160px] truncate">
                        {order.providers?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#5f5e59]">
                        {complete}/{items.length} completos
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {total.toFixed(1)} {unit}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#5f5e59]">
                        {fmtDate(order.request_date)}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#5f5e59]">
                        {order.expected_delivery_date ? fmtDate(order.expected_delivery_date) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} size="xs" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] hover:text-[#1A1A1A] transition-colors"
                          >
                            <Eye className="size-3.5" />
                            Ver
                          </Link>
                          {canReceive && (order.status === 'PENDING' || order.status === 'PARTIAL') && (
                            <Link
                              href={`/dashboard/receipts/${order.id}`}
                              className="flex items-center gap-1 h-6 px-2 bg-[#1A1A1A] text-[#F5F2EA] text-[9px] font-bold uppercase tracking-widest hover:opacity-75 transition-opacity"
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

      {/* Bottom bar: count + pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
          {orders.length} orden{orders.length !== 1 ? 'es' : ''}
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
              .reduce<(number | '…')[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…')
                acc.push(n)
                return acc
              }, [])
              .map((n, i) =>
                n === '…'
                  ? <span key={`e${i}`} className="w-7 text-center text-[10px] text-[#5f5e59]">…</span>
                  : <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={cn('size-7 text-[10px] font-bold border transition-colors', safePage === n
                      ? 'bg-[#1A1A1A] text-[#F5F2EA] border-[#1A1A1A]'
                      : 'border-[#1A1A1A]/20 hover:bg-[#E5E1D8]'
                    )}
                  >{n}</button>
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
