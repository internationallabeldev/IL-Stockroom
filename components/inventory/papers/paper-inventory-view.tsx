'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchSeed } from '@/hooks/use-search-seed'
import { useQuery } from '@tanstack/react-query'
import { LayoutList, Layers, Search, X, Eye, EyeOff, ChevronLeft, ChevronRight, SlidersHorizontal, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmbedded, toolbarStickyClass } from '@/lib/embedded-context'
import { ToolbarHoverMenu } from '@/components/shared/toolbar-hover-menu'
import { getPaperInventory, type PaperLot } from '@/actions/paper-inventory.actions'
import type { PaperCatalogForRequisition }   from '@/actions/requisitions.actions'
import { PaperLotsTableView }       from './paper-lots-table-view'
import { PaperCatalogGroupView }    from './paper-catalog-group-view'
import { PaperLotHistorySheet }     from './paper-lot-history-sheet'
import { PaperInventoryStatsBar }   from './paper-inventory-stats-bar'
import { RequisitionForm }          from '@/components/requisitions/requisition-form'
import { getLotStatusInfo }         from './lot-utils'

type InvSortKey = 'batch' | 'paper' | 'remaining' | 'date' | 'status'

type View = 'table' | 'group'

const STATUS_OPTIONS = ['Activo', 'Bajo stock', 'Crítico', '< 48H', 'Agotado'] as const

type Props = {
  initialLots:  PaperLot[]
  canManage:    boolean
  canRequest:   boolean
  paperCatalog: PaperCatalogForRequisition[]
}

export function PaperInventoryView({ initialLots, canManage, canRequest, paperCatalog }: Props) {
  const embedded = useEmbedded()
  const [view, setView] = useState<View>('table')

  useEffect(() => {
    const stored = localStorage.getItem('paper-inv-view') as View
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
  const [selectedLot,     setSelectedLot]     = useState<PaperLot | null>(null)

  const { data: lots, refetch } = useQuery({
    queryKey:        ['paper-inventory'],
    queryFn:         () => getPaperInventory(),
    initialData:     initialLots,
    refetchInterval: 30_000,
  })

  useEffect(() => { setPage(1) }, [search, showDisabled, statusFilter, providerId, remMin, remMax, dateFrom, dateTo, pageSize, view])

  function switchView(v: View) {
    setView(v)
    localStorage.setItem('paper-inv-view', v)
  }

  function openHistory(id: number) {
    setHistoryLotId(id)
    setHistoryOpen(true)
  }

  function openRequest(lot: PaperLot) {
    if (!lot.paper_catalog) return
    setSelectedLot(lot)
    setRequisitionOpen(true)
  }

  const filtered = useMemo(() => {
    let result = lots as PaperLot[]

    if (!showDisabled) result = result.filter(l => l.enabled)

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.internal_batch.toLowerCase().includes(q) ||
        l.paper_catalog?.name.toLowerCase().includes(q) ||
        l.paper_catalog?.code.toLowerCase().includes(q) ||
        ((l.receipt as any)?.provider_batch ?? '').toLowerCase().includes(q)
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

    if (remMin !== '') result = result.filter(l => (l.remaining_m2 ?? 0) >= parseFloat(remMin))
    if (remMax !== '') result = result.filter(l => (l.remaining_m2 ?? 0) <= parseFloat(remMax))

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

  const totalDisabled = (lots as PaperLot[]).filter(l => !l.enabled).length

  // Provider options derived from current lots
  const providerOptions = useMemo(() => {
    const map = new Map<number, string>()
    for (const l of lots as PaperLot[]) {
      const p = l.receipt?.purchase_order_item?.purchase_order?.provider
      if (p) map.set(p.id, p.name)
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [lots])

  // Count of enabled lots per status (for chip badges)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const l of lots as PaperLot[]) {
      if (!l.enabled) continue
      const label = getLotStatusInfo(l).label
      counts[label] = (counts[label] ?? 0) + 1
    }
    return counts
  }, [lots])

  const STATUS_WEIGHT: Record<string, number> = { 'Agotado': 0, '< 48H': 1, 'Crítico': 2, 'Bajo stock': 3, 'Activo': 4, 'Deshabilitado': 5 }
  const sortedFiltered = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...(filtered as PaperLot[])].sort((a, b) => {
      switch (sortKey) {
        case 'batch':     return a.internal_batch.localeCompare(b.internal_batch) * dir
        case 'paper':     return (a.paper_catalog?.name ?? '').localeCompare(b.paper_catalog?.name ?? '') * dir
        case 'remaining': return ((a.remaining_m2 ?? 0) - (b.remaining_m2 ?? 0)) * dir
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

  // Secondary toolbar controls — rendered inline on full pages, collapsed into a
  // hover dropdown when embedded so the toolbar fits on a single row.
  const metaControls = (
    <>
      {/* Summary */}
      <p className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
        {sortedFiltered.length} bobina{sortedFiltered.length !== 1 ? 's' : ''}
      </p>

      {/* Page size */}
      <div id="paper-inv-page-size" className="flex items-center gap-1.5 bg-muted/50 px-2.5 h-8">
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
    </>
  )

  const viewToggle = (
    <div id="paper-inv-view-toggle" className="flex border border-border shrink-0">
      <button
        onClick={() => switchView('table')}
        title={embedded ? 'Por bobina' : undefined}
        aria-label={embedded ? 'Por bobina' : undefined}
        className={cn(
          'flex items-center gap-1 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors',
          embedded ? 'px-2.5' : 'px-3',
          view === 'table'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:bg-muted/60'
        )}
      >
        <LayoutList className="size-3" />
        {!embedded && 'Por bobina'}
      </button>
      <button
        onClick={() => switchView('group')}
        title={embedded ? 'Por papel' : undefined}
        aria-label={embedded ? 'Por papel' : undefined}
        className={cn(
          'flex items-center gap-1 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors border-l border-border',
          embedded ? 'px-2.5' : 'px-3',
          view === 'group'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:bg-muted/60'
        )}
      >
        <Layers className="size-3" />
        {!embedded && 'Por papel'}
      </button>
    </div>
  )

  return (
    <>
      {/* ── Sticky toolbar + stats bar ───────────────────────────────────────── */}
      <div className={cn('sticky z-30 bg-background border-b border-border mb-6', toolbarStickyClass(embedded))}>
        <div className="@container">

        {/* Toolbar row — embedded: always a single row; full page: stacks below ~672px */}
        <div className={cn(
          'py-3 flex gap-2',
          embedded
            ? 'flex-row flex-wrap items-center'
            : 'flex-col @2xl:flex-row @2xl:flex-wrap @2xl:items-center @2xl:gap-3',
        )}>

          {/* Primary: search + filters */}
          <div className={cn('flex items-center gap-2 min-w-0', embedded && 'flex-1')}>
            {/* Search */}
            <div id="paper-inv-search" className="relative flex-1 @2xl:flex-none min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar bobina, papel…"
                className="h-8 w-full @2xl:w-100 pl-8 pr-8 border border-border bg-card text-xs outline-none focus:border-foreground/40 transition-colors"
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
              id="paper-inv-filters-btn"
              onClick={() => setFiltersOpen(v => !v)}
              title={embedded ? 'Filtros' : undefined}
              aria-label={embedded ? 'Filtros' : undefined}
              className={cn(
                'flex items-center gap-1.5 h-8 border text-[9px] font-bold uppercase tracking-widest transition-colors shrink-0',
                embedded ? 'px-2' : 'px-3',
                filtersOpen || activeFilters > 0
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/40'
              )}
            >
              <SlidersHorizontal className="size-3" />
              {!embedded && 'Filtros'}
              {activeFilters > 0 && (
                <span className="ml-0.5 bg-white/20 text-[8px] px-1 rounded-sm">{activeFilters}</span>
              )}
            </button>
          </div>

          {/* Secondary: stats, refresh, count, page size, view toggle */}
          <div className={cn('flex items-center gap-2', embedded ? 'shrink-0' : 'flex-wrap @2xl:ml-auto')}>
            {embedded ? (
              <>
                <PaperInventoryStatsBar lots={lots as PaperLot[]} iconOnly />
                <ToolbarHoverMenu label="Controles" icon={Settings2} iconOnly>
                  <div className="flex flex-col items-start gap-2.5">
                    {metaControls}
                  </div>
                </ToolbarHoverMenu>
              </>
            ) : (
              metaControls
            )}

            {viewToggle}
          </div>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="border-t border-border/50 py-4 grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-4 gap-4">

            {/* Estado */}
            <div className="@md:col-span-2 @3xl:col-span-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Estado de la bobina</p>
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
            <div className="@md:col-span-2">
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
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Restante (m²)</p>
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

            {/* Mostrar deshabilitadas + limpiar */}
            <div className="@md:col-span-2 @3xl:col-span-4 flex flex-wrap items-center justify-between gap-3">
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
                Mostrar deshabilitadas
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

        {/* Stats bar row — embedded collapses it into the toolbar Resumen chip */}
        {!embedded && (
          <div id="paper-inv-stats" className="py-3">
            <PaperInventoryStatsBar lots={lots as PaperLot[]} />
          </div>
        )}
        </div>
      </div>

      {/* ── View ────────────────────────────────────────────────────────────── */}
      {view === 'table' ? (
        <PaperLotsTableView
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
        <PaperCatalogGroupView
          lots={paginated}
          canManage={canManage}
          canRequest={canRequest}
          onHistory={openHistory}
          onRequest={openRequest}
          onLotDisabled={refetch}
        />
      )}

      {/* ── Pagination (table view only) ─────────────────────────────────────── */}
      {view === 'table' && (() => {
        const pill = 'border border-border rounded-lg bg-card/85 backdrop-blur-sm shadow-lg'

        const countEl = (
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {sortedFiltered.length} bobina{sortedFiltered.length !== 1 ? 's' : ''}
            {sortedFiltered.length > pageSize && (
              <span className="ml-1 font-normal normal-case tracking-normal">
                — mostrando {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedFiltered.length)}
              </span>
            )}
          </p>
        )

        const paginationEl = totalPages > 1 ? (
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

      {/* ── Sheets ──────────────────────────────────────────────────────────── */}
      <PaperLotHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        inventoryId={historyLotId}
      />

      <RequisitionForm
        open={requisitionOpen}
        onClose={() => { setRequisitionOpen(false); refetch() }}
        inkCatalog={[]}
        paperCatalog={paperCatalog}
        preselected={selectedLot?.paper_catalog ? {
          materialType:     'PAPER',
          catalogId:        selectedLot.paper_catalog.id,
          name:             selectedLot.paper_catalog.name,
          code:             selectedLot.paper_catalog.code,
          stock:            selectedLot.paper_catalog.current_stock_m2 ?? undefined,
          availableWidthM:  selectedLot.remaining_width_m ?? selectedLot.initial_width_m ?? null,
          availableLengthM: selectedLot.remaining_length_m ?? null,
        } : undefined}
      />
    </>
  )
}
