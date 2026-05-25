'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LayoutList, Layers, Search, X, AlertTriangle, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
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

type Props = {
  initialLots:  PaperLot[]
  canManage:    boolean
  canRequest:   boolean
  paperCatalog: PaperCatalogForRequisition[]
}

export function PaperInventoryView({ initialLots, canManage, canRequest, paperCatalog }: Props) {
  const [view, setView] = useState<View>('table')

  useEffect(() => {
    const stored = localStorage.getItem('paper-inv-view') as View
    if (stored === 'table' || stored === 'group') setView(stored)
  }, [])

  const [search,        setSearch]        = useState('')
  const [lowStock,      setLowStock]      = useState(false)
  const [showDisabled,  setShowDisabled]  = useState(false)
  const [page,          setPage]          = useState(1)
  const [pageSize,      setPageSize]      = useState(15)
  const [pageSizeInput, setPageSizeInput] = useState('15')

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

  useEffect(() => { setPage(1) }, [search, lowStock, showDisabled, pageSize, view])

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

    if (lowStock) {
      result = result.filter(l => {
        const min = l.paper_catalog?.min_stock_m2 ?? 0
        return (l.remaining_m2 ?? 0) < min
      })
    }

    return result
  }, [lots, search, lowStock, showDisabled])

  const totalDisabled = (lots as PaperLot[]).filter(l => !l.enabled).length
  const lowStockCount = (lots as PaperLot[]).filter(l => {
    const min = l.paper_catalog?.min_stock_m2 ?? 0
    return l.enabled && (l.remaining_m2 ?? 0) < min
  }).length

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

  return (
    <>
      {/* ── Sticky toolbar + stats bar ───────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-background border-b border-border -mx-8 px-8 mb-6">

        {/* Toolbar row */}
        <div className="py-3 flex flex-wrap items-center gap-3">

          {/* Search */}
          <div id="paper-inv-search" className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar bobina, papel…"
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

          {/* Low-stock filter */}
          <button
            id="paper-inv-low-stock"
            onClick={() => setLowStock(v => !v)}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 border text-[9px] font-bold uppercase tracking-widest transition-colors',
              lowStock
                ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                : 'border-border text-muted-foreground hover:border-foreground/40'
            )}
          >
            <AlertTriangle className="size-3" />
            Stock bajo
            {lowStockCount > 0 && (
              <span className="ml-0.5 bg-yellow-400 text-yellow-900 text-[8px] font-bold px-1 rounded-full">
                {lowStockCount}
              </span>
            )}
          </button>

          {/* Show disabled */}
          <button
            id="paper-inv-show-disabled"
            onClick={() => setShowDisabled(v => !v)}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 border text-[9px] font-bold uppercase tracking-widest transition-colors',
              showDisabled
                ? 'border-foreground/40 bg-muted/60 text-foreground'
                : 'border-border text-muted-foreground hover:border-foreground/40'
            )}
          >
            {showDisabled ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
            Deshabilitadas
            {totalDisabled > 0 && (
              <span className="ml-0.5 text-[8px] font-mono">({totalDisabled})</span>
            )}
          </button>

          <div className="flex-1" />

          {/* Summary */}
          <p className="text-[10px] font-mono text-muted-foreground">
            {sortedFiltered.length} bobina{sortedFiltered.length !== 1 ? 's' : ''}
          </p>

          {/* Page size */}
          <div id="paper-inv-page-size" className="flex items-center gap-1.5 border border-border px-2.5 h-8">
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
          <div id="paper-inv-view-toggle" className="flex border border-border">
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
              Por bobina
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
              Por papel
            </button>
          </div>
        </div>

        {/* Stats bar row */}
        <div id="paper-inv-stats" className="py-3">
          <PaperInventoryStatsBar lots={lots as PaperLot[]} />
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
      {view === 'table' && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {sortedFiltered.length} bobina{sortedFiltered.length !== 1 ? 's' : ''}
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
          materialType: 'PAPER',
          catalogId:    selectedLot.paper_catalog.id,
          name:         selectedLot.paper_catalog.name,
          code:         selectedLot.paper_catalog.code,
          stock:        selectedLot.paper_catalog.current_stock_m2 ?? undefined,
        } : undefined}
      />
    </>
  )
}
