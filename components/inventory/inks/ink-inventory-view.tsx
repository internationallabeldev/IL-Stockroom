'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchSeed } from '@/hooks/use-search-seed'
import { useQuery } from '@tanstack/react-query'
import { LayoutList, Layers, Search, X, Eye, EyeOff, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInkInventory, type InkLot } from '@/actions/ink-inventory.actions'
import type { InkCatalogForRequisition }  from '@/actions/requisitions.actions'
import { InkLotsTableView }       from './ink-lots-table-view'
import { InkCatalogGroupView }    from './ink-catalog-group-view'
import { InkLotHistorySheet }     from './ink-lot-history-sheet'
import { InkInventoryStatsBar }   from './ink-inventory-stats-bar'
import { DataRefresh }            from '@/components/shared/data-refresh'
import { RequisitionForm }        from '@/components/requisitions/requisition-form'
import { getLotStatusInfo }       from './lot-utils'

type InvSortKey = 'batch' | 'ink' | 'remaining' | 'date' | 'status'

type View = 'table' | 'group'

const STATUS_OPTIONS = ['Activo', 'Bajo stock', 'Crítico', '< 48H', 'Agotado'] as const

type Props = {
  initialLots: InkLot[]
  canManage:   boolean
  canRequest:  boolean
  inkCatalog:  InkCatalogForRequisition[]
}

export function InkInventoryView({ initialLots, canManage, canRequest, inkCatalog }: Props) {
  const [view, setView] = useState<View>('table')

  useEffect(() => {
    const stored = localStorage.getItem('ink-inv-view') as View
    if (stored === 'table' || stored === 'group') setView(stored)
  }, [])

  const [search,        setSearch]        = useSearchSeed()
  const [showDisabled,  setShowDisabled]  = useState(false)
  const [page,          setPage]          = useState(1)
  const [pageSize,      setPageSize]      = useState(15)
  const [pageSizeInput, setPageSizeInput] = useState('15')

  // ── Filter panel ──────────────────────────────────────────────────────────
  const [filtersOpen,  setFiltersOpen]  = useState(false)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [providerId,   setProviderId]   = useState('')
  const [remMin,       setRemMin]       = useState('')
  const [remMax,       setRemMax]       = useState('')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')

  function toggleStatus(s: string) {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const activeFilters =
    statusFilter.length +
    (providerId ? 1 : 0) +
    [remMin, remMax, dateFrom, dateTo].filter(Boolean).length +
    (showDisabled ? 1 : 0)

  function resetFilters() {
    setStatusFilter([])
    setProviderId('')
    setRemMin(''); setRemMax('')
    setDateFrom(''); setDateTo('')
    setShowDisabled(false)
  }

  const [sortKey, setSortKey] = useState<InvSortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(key: InvSortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const [historyOpen,     setHistoryOpen]     = useState(false)
  const [historyLotId,    setHistoryLotId]    = useState<number | null>(null)
  const [requisitionOpen, setRequisitionOpen] = useState(false)
  const [selectedLot,     setSelectedLot]     = useState<InkLot | null>(null)

  const { data: lots, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey:        ['ink-inventory'],
    queryFn:         () => getInkInventory(),
    initialData:     initialLots,
    refetchInterval: 30_000,
  })

  useEffect(() => { setPage(1) }, [search, showDisabled, statusFilter, providerId, remMin, remMax, dateFrom, dateTo, pageSize, view])

  function switchView(v: View) {
    setView(v)
    localStorage.setItem('ink-inv-view', v)
  }

  function openHistory(id: number) {
    setHistoryLotId(id)
    setHistoryOpen(true)
  }

  function openRequest(lot: InkLot) {
    if (!lot.ink_catalog) return
    setSelectedLot(lot)
    setRequisitionOpen(true)
  }

  const filtered = useMemo(() => {
    let result = lots as InkLot[]

    if (!showDisabled) result = result.filter(l => l.enabled)

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.internal_batch.toLowerCase().includes(q) ||
        l.ink_catalog?.name.toLowerCase().includes(q) ||
        l.ink_catalog?.code.toLowerCase().includes(q) ||
        (l.receipt?.provider_batch ?? '').toLowerCase().includes(q)
      )
    }

    if (statusFilter.length > 0) {
      result = result.filter(l => statusFilter.includes(getLotStatusInfo(l).label))
    }

    if (providerId) {
      result = result.filter(l =>
        String(l.receipt?.purchase_order_item?.purchase_order?.provider?.id ?? '') === providerId
      )
    }

    if (remMin !== '') result = result.filter(l => (l.remaining_kg ?? 0) >= parseFloat(remMin))
    if (remMax !== '') result = result.filter(l => (l.remaining_kg ?? 0) <= parseFloat(remMax))

    if (dateFrom || dateTo) {
      result = result.filter(l => {
        const d = l.receipt?.receipt_date?.slice(0, 10) ?? ''
        if (dateFrom && (!d || d < dateFrom)) return false
        if (dateTo && (!d || d > dateTo)) return false
        return true
      })
    }

    return result
  }, [lots, search, showDisabled, statusFilter, providerId, remMin, remMax, dateFrom, dateTo])

  const totalDisabled = (lots as InkLot[]).filter(l => !l.enabled).length

  // Provider options derived from current lots
  const providerOptions = useMemo(() => {
    const map = new Map<number, string>()
    for (const l of lots as InkLot[]) {
      const p = l.receipt?.purchase_order_item?.purchase_order?.provider
      if (p) map.set(p.id, p.name)
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [lots])

  // Count of enabled lots per status (for chip badges)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const l of lots as InkLot[]) {
      if (!l.enabled) continue
      const label = getLotStatusInfo(l).label
      counts[label] = (counts[label] ?? 0) + 1
    }
    return counts
  }, [lots])

  const STATUS_WEIGHT: Record<string, number> = { 'Agotado': 0, '< 48H': 1, 'Crítico': 2, 'Bajo stock': 3, 'Activo': 4, 'Deshabilitado': 5 }
  const sortedFiltered = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...(filtered as InkLot[])].sort((a, b) => {
      switch (sortKey) {
        case 'batch':     return a.internal_batch.localeCompare(b.internal_batch) * dir
        case 'ink':       return (a.ink_catalog?.name ?? '').localeCompare(b.ink_catalog?.name ?? '') * dir
        case 'remaining': return ((a.remaining_kg ?? 0) - (b.remaining_kg ?? 0)) * dir
        case 'date':      return (a.receipt?.receipt_date ?? '').localeCompare(b.receipt?.receipt_date ?? '') * dir
        case 'status':    return ((STATUS_WEIGHT[getLotStatusInfo(a).label] ?? 9) - (STATUS_WEIGHT[getLotStatusInfo(b).label] ?? 9)) * dir
        default:          return 0
      }
    })
  }, [filtered, sortKey, sortDir])

  const totalPages  = Math.max(1, Math.ceil(sortedFiltered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated   = view === 'table'
    ? sortedFiltered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedFiltered

  return (
    <>
      {/* ── Sticky toolbar + stats bar ───────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-background border-b border-border -mx-8 px-8 mb-6">

        {/* Toolbar row */}
        <div className="py-3 flex flex-wrap items-center gap-3">

          {/* Search */}
          <div id="ink-inv-search" className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar lote, tinta…"
              className="h-8 w-100 pl-8 pr-8 border border-border bg-card text-xs outline-none focus:border-foreground/40 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filters toggle */}
          <button
            id="ink-inv-filters-btn"
            onClick={() => setFiltersOpen(v => !v)}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 border text-[9px] font-bold uppercase tracking-widest transition-colors',
              filtersOpen || activeFilters > 0
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:border-foreground/40'
            )}
          >
            <SlidersHorizontal className="size-3" />
            Filtros
            {activeFilters > 0 && (
              <span className="ml-0.5 bg-white/20 text-[8px] px-1 rounded-sm">{activeFilters}</span>
            )}
          </button>

          <div className="flex-1" />

          <DataRefresh updatedAt={dataUpdatedAt} isFetching={isFetching} onRefresh={() => refetch()} />

          {/* Summary */}
          <p className="text-[10px] font-mono text-muted-foreground">
            {sortedFiltered.length} lote{sortedFiltered.length !== 1 ? 's' : ''}
          </p>

          {/* Page size */}
          <div id="ink-inv-page-size" className="flex items-center gap-1.5 border border-border px-2.5 h-8">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Por página</span>
            <input
              type="number"
              min={1}
              value={pageSizeInput}
              onChange={e => {
                setPageSizeInput(e.target.value)
                const n = parseInt(e.target.value, 10)
                if (n > 0) setPageSize(n)
              }}
              onBlur={() => {
                const n = parseInt(pageSizeInput, 10)
                if (!n || n < 1) { setPageSizeInput('15'); setPageSize(15) }
              }}
              className="w-9 bg-transparent text-[11px] font-mono text-center outline-none"
            />
          </div>

          {/* View toggle */}
          <div id="ink-inv-view-toggle" className="flex border border-border">
            <button
              onClick={() => switchView('table')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors',
                view === 'table'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted/60'
              )}
            >
              <LayoutList className="size-3" />
              Lista
            </button>
            <button
              onClick={() => switchView('group')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors border-l border-border',
                view === 'group'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted/60'
              )}
            >
              <Layers className="size-3" />
              Grupo
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="border-t border-border/50 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Estado */}
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Estado del lote</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(s => {
                  const active = statusFilter.includes(s)
                  const count  = statusCounts[s] ?? 0
                  return (
                    <button
                      key={s}
                      onClick={() => toggleStatus(s)}
                      className={cn(
                        'flex items-center gap-1.5 h-7 px-2.5 border text-[9px] font-bold uppercase tracking-widest transition-colors',
                        active
                          ? 'bg-foreground text-background border-foreground'
                          : 'border-border text-muted-foreground hover:border-foreground/40'
                      )}
                    >
                      {s}
                      <span className={cn('text-[8px] font-mono', active ? 'text-background/70' : 'text-muted-foreground/60')}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Proveedor */}
            <div className="sm:col-span-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Proveedor</p>
              <select
                value={providerId}
                onChange={e => setProviderId(e.target.value)}
                className="w-full border border-border px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-foreground/50"
              >
                <option value="">Todos</option>
                {providerOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            {/* Cantidad restante */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Restante (kg)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} placeholder="Mín"
                  value={remMin}
                  onChange={e => setRemMin(e.target.value)}
                  className="w-full border border-border px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-foreground/50"
                />
                <span className="text-muted-foreground text-xs">—</span>
                <input
                  type="number" min={0} placeholder="Máx"
                  value={remMax}
                  onChange={e => setRemMax(e.target.value)}
                  className="w-full border border-border px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-foreground/50"
                />
              </div>
            </div>

            {/* Fecha de recepción */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Fecha de recepción</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full border border-border px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-foreground/50"
                />
                <span className="text-muted-foreground text-xs">—</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full border border-border px-2 py-1 text-[11px] bg-transparent focus:outline-none focus:border-foreground/50"
                />
              </div>
            </div>

            {/* Mostrar deshabilitados + limpiar */}
            <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setShowDisabled(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 h-7 px-2.5 border text-[9px] font-bold uppercase tracking-widest transition-colors',
                  showDisabled
                    ? 'border-foreground/40 bg-muted/60 text-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/40'
                )}
              >
                {showDisabled ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                Mostrar deshabilitados
                {totalDisabled > 0 && (
                  <span className="ml-0.5 text-[8px] font-mono">({totalDisabled})</span>
                )}
              </button>

              {activeFilters > 0 && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3" />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats bar row */}
        <div id="ink-inv-stats" className="py-3">
          <InkInventoryStatsBar lots={lots as InkLot[]} />
        </div>
      </div>

      {/* ── View ────────────────────────────────────────────────────────────── */}
      {view === 'table' ? (
        <InkLotsTableView
          lots={paginated}
          canManage={canManage}
          canRequest={canRequest}
          onHistory={openHistory}
          onRequest={openRequest}
          onLotDisabled={refetch}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
        />
      ) : (
        <InkCatalogGroupView
          lots={paginated}
          canManage={canManage}
          canRequest={canRequest}
          onHistory={openHistory}
          onRequest={openRequest}
          onLotDisabled={refetch}
        />
      )}

      {/* ── Pagination (table view only) ─────────────────────────────────────── */}
      {view === 'table' && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {sortedFiltered.length} lote{sortedFiltered.length !== 1 ? 's' : ''}
            {sortedFiltered.length > pageSize && (
              <span className="ml-1 font-normal normal-case tracking-normal">
                — mostrando {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedFiltered.length)}
              </span>
            )}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="size-7 flex items-center justify-center border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '…' ? (
                    <span key={`e${i}`} className="w-7 text-center text-[10px] text-muted-foreground">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className={cn(
                        'size-7 text-[10px] font-bold border transition-colors',
                        currentPage === n
                          ? 'bg-foreground text-background border-foreground'
                          : 'border-border hover:bg-muted',
                      )}
                    >
                      {n}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="size-7 flex items-center justify-center border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Sheets ──────────────────────────────────────────────────────────── */}
      <InkLotHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        inventoryId={historyLotId}
      />

      <RequisitionForm
        open={requisitionOpen}
        onClose={() => { setRequisitionOpen(false); refetch() }}
        inkCatalog={inkCatalog}
        paperCatalog={[]}
        preselected={selectedLot?.ink_catalog ? {
          materialType: 'INK',
          catalogId:    selectedLot.ink_catalog.id,
          name:         selectedLot.ink_catalog.name,
          code:         selectedLot.ink_catalog.code,
          colorCode:    selectedLot.ink_catalog.color_code,
          stock:        selectedLot.ink_catalog.current_stock_kg ?? undefined,
        } : undefined}
      />
    </>
  )
}
