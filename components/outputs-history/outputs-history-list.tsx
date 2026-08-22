'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchSeed } from '@/hooks/use-search-seed'
import { useQuery } from '@tanstack/react-query'
import {
  Search, X, Eye, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowUpDown,
  Droplet, FileText, RotateCcw,
  PackageCheck, Clock, TrendingUp,
  Timer, CircleDashed, ClipboardList, UserCheck, Settings2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmbedded, toolbarStickyClass } from '@/lib/embedded-context'
import { useMaterial } from '@/app/dashboard/_components/material-context'
import { ToolbarHoverMenu, EmbeddedSummaryChip } from '@/components/shared/toolbar-hover-menu'
import {
  getRequisitions,
  type Requisition,
  type MaterialType,
} from '@/actions/requisitions.actions'
import { RequisitionSheet } from '@/components/requisitions/requisition-sheet'
import type { Database }    from '@/types/database.types'

type UserRole     = Database['public']['Enums']['user_role']
type MatFilter    = 'ALL' | MaterialType
type SortKey      = 'number' | 'type' | 'order' | 'date'

const MAT_TABS: { value: MatFilter; label: string }[] = [
  { value: 'ALL',   label: 'Todos'  },
  { value: 'INK',   label: 'Tinta'  },
  { value: 'PAPER', label: 'Papel'  },
]

function formatDuration(hours: number): string {
  if (hours < 1)  return `${Math.round(hours * 60)} min`
  if (hours < 48) return `${hours.toFixed(1)} h`
  return `${(hours / 24).toFixed(1)} d`
}

function OutputsStatsBar({ all }: { all: Requisition[] }) {
  const todayStr = new Date().toISOString().slice(0, 10)

  const totalKg = all.flatMap(r => r.ink_outputs).reduce((s, o) => s + o.kg_delivered, 0)
  const totalM2 = all.flatMap(r => r.paper_outputs).reduce((s, o) => s + (o.m2_delivered ?? 0), 0)
  const kgRet   = all.flatMap(r => r.ink_outputs).reduce((s, o) => s + (o.kg_returned ?? 0), 0)
  const m2Ret   = all.flatMap(r => r.paper_outputs).reduce((s, o) => s + (o.m2_returned ?? 0), 0)

  const todayCount = all.filter(r =>
    r.ink_outputs.some(o => o.output_date?.startsWith(todayStr)) ||
    r.paper_outputs.some(o => o.output_date?.startsWith(todayStr))
  ).length

  const partialCount = all.filter(r => r.status === 'PARTIAL').length
  const uniqueOps    = new Set(all.map(r => r.production_order)).size

  const fulfilledWithDates = all.filter(r => r.fulfilled_at && r.request_date)
  const avgHours = fulfilledWithDates.length > 0
    ? fulfilledWithDates.reduce((s, r) => {
        const diff = new Date(r.fulfilled_at!).getTime() - new Date(r.request_date).getTime()
        return s + diff / (1000 * 60 * 60)
      }, 0) / fulfilledWithDates.length
    : null

  const inkTotals: Record<string, number> = {}
  all.flatMap(r => r.ink_outputs).forEach(o => {
    const name = o.ink_inventory?.ink_catalog?.name
    if (name) inkTotals[name] = (inkTotals[name] ?? 0) + o.kg_delivered
  })
  const topInkEntry = Object.entries(inkTotals).sort((a, b) => b[1] - a[1])[0]
  const topInkName  = topInkEntry?.[0] ?? null
  const topInkPct   = topInkEntry && totalKg > 0 ? Math.round((topInkEntry[1] / totalKg) * 100) : null

  const paperTotals: Record<string, number> = {}
  all.flatMap(r => r.paper_outputs).forEach(o => {
    const name = o.paper_inventory?.paper_catalog?.name
    if (name) paperTotals[name] = (paperTotals[name] ?? 0) + (o.m2_delivered ?? 0)
  })
  const topPaperEntry = Object.entries(paperTotals).sort((a, b) => b[1] - a[1])[0]
  const topPaperName  = topPaperEntry?.[0] ?? null
  const topPaperPct   = topPaperEntry && totalM2 > 0 ? Math.round((topPaperEntry[1] / totalM2) * 100) : null

  const deliverers: Record<string, number> = {}
  all.forEach(r => {
    const addOutput = (u: { first_name: string | null; last_name: string | null } | null) => {
      if (!u || (!u.first_name && !u.last_name)) return
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ')
      deliverers[name] = (deliverers[name] ?? 0) + 1
    }
    r.ink_outputs.forEach(o => addOutput(o.delivered_by_user))
    r.paper_outputs.forEach(o => addOutput(o.delivered_by_user))
  })
  const topDelivererEntry = Object.entries(deliverers).sort((a, b) => b[1] - a[1])[0]
  const topDelivererName  = topDelivererEntry?.[0] ?? null
  const topDelivererCount = topDelivererEntry?.[1] ?? null

  const hasReturns   = kgRet > 0 || m2Ret > 0
  const returnsLabel = kgRet > 0 ? `${kgRet.toFixed(2)} kg` : `${m2Ret.toFixed(3)} m²`
  const returnsPct   = kgRet > 0 && totalKg > 0
    ? Math.round((kgRet / totalKg) * 100)
    : m2Ret > 0 && totalM2 > 0
      ? Math.round((m2Ret / totalM2) * 100)
      : null

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">

      <div className="flex items-center gap-2">
        <PackageCheck className="size-3 shrink-0 text-muted-foreground/50" />
        <span className="text-[11px] text-muted-foreground/70 font-medium">Completadas</span>
        <span className="text-[11px] font-bold tabular-nums text-foreground/80">{all.length}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-border/60 select-none hidden @2xl:inline">·</span>
        <ClipboardList className="size-3 shrink-0 text-muted-foreground/50" />
        <span className="text-[11px] text-muted-foreground/70 font-medium">OPs</span>
        <span className="text-[11px] font-bold tabular-nums text-foreground/80">{uniqueOps}</span>
      </div>

      {partialCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <CircleDashed className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/70 font-medium">Parciales</span>
          <span className="text-[11px] font-bold tabular-nums text-foreground/80">{partialCount}</span>
        </div>
      )}

      {totalKg > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <Droplet className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/70 font-medium">Tinta</span>
          <span className="text-[11px] font-bold tabular-nums text-foreground/80">{totalKg.toFixed(2)} kg</span>
        </div>
      )}

      {totalM2 > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <FileText className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/70 font-medium">Papel</span>
          <span className="text-[11px] font-bold tabular-nums text-foreground/80">{totalM2.toFixed(3)} m²</span>
        </div>
      )}

      {hasReturns && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <RotateCcw className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/70 font-medium">Devuelto</span>
          <span className="text-[11px] font-bold tabular-nums text-green-600 dark:text-green-400">{returnsLabel}</span>
          {returnsPct !== null && (
            <span className="text-[10px] text-muted-foreground/50 tabular-nums">{returnsPct}%</span>
          )}
        </div>
      )}

      {avgHours !== null && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <Timer className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/70 font-medium">Entrega prom.</span>
          <span className="text-[11px] font-bold tabular-nums text-foreground/80">{formatDuration(avgHours)}</span>
        </div>
      )}

      {todayCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <Clock className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/70 font-medium">Hoy</span>
          <span className="text-[11px] font-bold tabular-nums text-foreground/80">{todayCount}</span>
        </div>
      )}

      {topInkName && topInkPct !== null && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <TrendingUp className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/70 font-medium">Tinta ppal</span>
          <span className="text-[11px] font-bold tabular-nums text-foreground/80 max-w-30 truncate">{topInkName}</span>
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">{topInkPct}%</span>
        </div>
      )}

      {topPaperName && topPaperPct !== null && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <TrendingUp className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/70 font-medium">Papel ppal</span>
          <span className="text-[11px] font-bold tabular-nums text-foreground/80 max-w-30 truncate">{topPaperName}</span>
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">{topPaperPct}%</span>
        </div>
      )}

      {topDelivererName && topDelivererCount !== null && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <UserCheck className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/70 font-medium">Almacenista</span>
          <span className="text-[11px] font-bold tabular-nums text-foreground/80 max-w-30 truncate">{topDelivererName}</span>
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">{topDelivererCount}</span>
        </div>
      )}

    </div>
  )
}

type Props = {
  initialRequisitions: Requisition[]
  userRole: UserRole
}

export function OutputsHistoryList({ initialRequisitions, userRole }: Props) {
  const embedded = useEmbedded()
  const { material } = useMaterial()
  const [search,      setSearch]      = useSearchSeed()
  // Página completa: el material lo decide el toggle global del top-nav.
  // Embebido (workspace): el toggle global se oculta, así que el panel
  // conserva sus tabs locales Todos/Tinta/Papel.
  const [localMat,    setLocalMat]    = useState<MatFilter>('ALL')
  const matFilter: MatFilter = embedded ? localMat : (material === 'ink' ? 'INK' : 'PAPER')
  const [dateFrom,    setDateFrom]    = useState('')
  const [dateTo,      setDateTo]      = useState('')
  const [sortKey,     setSortKey]     = useState<SortKey>('date')
  const [sortDir,     setSortDir]     = useState<'asc' | 'desc'>('desc')
  const [page,        setPage]        = useState(1)
  const [pageSize,    setPageSize]    = useState(15)
  const [pageSizeInp, setPageSizeInp] = useState('15')
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null)

  const { data: all = initialRequisitions } = useQuery({
    queryKey:        ['requisitions', 'with-outputs'],
    queryFn:         () => getRequisitions({ statuses: ['FULFILLED', 'PARTIAL'] }),
    initialData:     initialRequisitions,
    refetchInterval: 60_000,
  })

  useEffect(() => { setPage(1) }, [matFilter])

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let result = (all as Requisition[]).filter(r =>
      r.ink_outputs.length > 0 || r.paper_outputs.length > 0
    )

    if (matFilter !== 'ALL') result = result.filter(r => r.material_type === matFilter)

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        `#${r.requisition_number}`.includes(q) ||
        r.production_order.toLowerCase().includes(q) ||
        [r.requester?.first_name, r.requester?.last_name]
          .filter(Boolean).join(' ').toLowerCase().includes(q),
      )
    }

    if (dateFrom) result = result.filter(r => !!r.fulfilled_at && r.fulfilled_at >= dateFrom)
    if (dateTo)   result = result.filter(r => !!r.fulfilled_at && r.fulfilled_at <= `${dateTo}T23:59:59`)

    const dir = sortDir === 'asc' ? 1 : -1
    return [...result].sort((a, b) => {
      switch (sortKey) {
        case 'number': return (a.requisition_number - b.requisition_number) * dir
        case 'type':   return a.material_type.localeCompare(b.material_type) * dir
        case 'order':  return a.production_order.localeCompare(b.production_order) * dir
        case 'date':   return (a.fulfilled_at ?? '').localeCompare(b.fulfilled_at ?? '') * dir
        default:       return 0
      }
    })
  }, [all, matFilter, search, dateFrom, dateTo, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
      : <ArrowUpDown className="size-3 opacity-30" />

  // Date range + page size — inline on full pages, tucked into "Controles" when embedded.
  const dateRangeControl = (
    <div id="outputs-date-range" className="flex items-center gap-2">
      <input
        type="date"
        value={dateFrom}
        onChange={e => { setDateFrom(e.target.value); setPage(1) }}
        className="h-8 border border-border bg-card px-2 text-[11px] outline-none focus:border-foreground/40 transition-colors"
      />
      <span className="text-[10px] text-muted-foreground">—</span>
      <input
        type="date"
        value={dateTo}
        onChange={e => { setDateTo(e.target.value); setPage(1) }}
        className="h-8 border border-border bg-card px-2 text-[11px] outline-none focus:border-foreground/40 transition-colors"
      />
      {(dateFrom || dateTo) && (
        <button
          onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )

  const pageSizeControl = (
    <div id="outputs-page-size" className="flex items-center gap-1.5 bg-muted/50 px-2.5 h-8">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Por página</span>
      <input
        type="number"
        min={1}
        value={pageSizeInp}
        onChange={e => {
          setPageSizeInp(e.target.value)
          const n = parseInt(e.target.value, 10)
          if (n > 0) { setPageSize(n); setPage(1) }
        }}
        onBlur={() => {
          const n = parseInt(pageSizeInp, 10)
          if (!n || n < 1) { setPageSizeInp('15'); setPageSize(15); setPage(1) }
        }}
        className="w-9 bg-transparent text-[11px] font-mono text-center outline-none"
      />
    </div>
  )

  return (
    <>
      {/* Toolbar */}
      <div className={cn('sticky z-30 bg-background border-b border-border mb-4', toolbarStickyClass(embedded))}>
        <div className="@container">

        {/* Filters row */}
        <div className="py-3 flex flex-wrap items-center gap-2">


          {/* Search */}
          <div id="outputs-search" className={cn('relative min-w-0', embedded ? 'flex-1' : 'w-full @2xl:w-auto')}>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar #, orden, solicitante…"
              className={cn(
                'h-8 w-full pl-8 pr-7 border border-border bg-card text-xs outline-none focus:border-foreground/40 transition-colors',
                !embedded && '@2xl:w-100',
              )}
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Material type — solo embebido; en página completa manda el toggle global */}
          {embedded && (
            <div id="outputs-mat-tabs" className="flex gap-0.5 bg-black/4 dark:bg-black/25 p-0.5 shrink-0">
              {MAT_TABS.map(t => (
                <button
                  key={t.value}
                  onClick={() => { setLocalMat(t.value); setPage(1) }}
                  className={cn(
                    'px-3 h-7 text-[10px] font-bold uppercase tracking-widest transition-all',
                    matFilter === t.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-foreground/50 hover:text-foreground',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {!embedded && <div className="flex-1" />}

          {embedded ? (
            <>
              <EmbeddedSummaryChip>
                <OutputsStatsBar all={all} />
              </EmbeddedSummaryChip>
              <ToolbarHoverMenu label="Controles" icon={Settings2} iconOnly>
                <div className="flex flex-col items-start gap-2.5">
                  {dateRangeControl}
                  {pageSizeControl}
                </div>
              </ToolbarHoverMenu>
            </>
          ) : (
            <>
              {dateRangeControl}
              {pageSizeControl}
            </>
          )}
        </div>

        {/* Stats bar */}
        {!embedded && (
          <div id="outputs-stats-bar" className="py-3">
            <OutputsStatsBar all={all} />
          </div>
        )}

        </div>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            No hay salidas para mostrar
          </p>
        </div>
      ) : (
        <div id="outputs-table" className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/40">
                <th
                  onClick={() => toggleSort('number')}
                  className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center gap-1"># <SortIcon k="number" /></span>
                </th>
                <th
                  onClick={() => toggleSort('type')}
                  className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center gap-1">Tipo <SortIcon k="type" /></span>
                </th>
                <th
                  onClick={() => toggleSort('order')}
                  className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center gap-1">O. Prod. <SortIcon k="order" /></span>
                </th>
                <th className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Materiales
                </th>
                <th className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Entregado
                </th>
                <th className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Devuelto
                </th>
                <th
                  onClick={() => toggleSort('date')}
                  className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center gap-1">Completado <SortIcon k="date" /></span>
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paginated.map(req => {
                const isInk = req.material_type === 'INK'
                const kgNet = req.ink_outputs.reduce((s, o) => s + o.kg_delivered, 0)
                const kgRet = req.ink_outputs.reduce((s, o) => s + (o.kg_returned ?? 0), 0)
                const m2Net = req.paper_outputs.reduce((s, o) => s + (o.m2_delivered ?? 0), 0)
                const m2Ret = req.paper_outputs.reduce((s, o) => s + (o.m2_returned ?? 0), 0)
                const names = isInk
                  ? [...new Set(req.ink_items.map(i => i.ink_catalog?.name).filter(Boolean))].join(', ')
                  : [...new Set(req.paper_items.map(i => i.paper_catalog?.name).filter(Boolean))].join(', ')

                return (
                  <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-sm">
                      #{req.requisition_number}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {isInk
                          ? <Droplet  className="size-3" />
                          : <FileText className="size-3" />}
                        {isInk ? 'Tinta' : 'Papel'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-[160px] truncate font-mono">
                      {req.production_order}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground max-w-50 truncate">
                      {names || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-bold">
                      {isInk
                        ? kgNet > 0 ? `${kgNet.toFixed(2)} kg`   : '—'
                        : m2Net > 0 ? `${m2Net.toFixed(3)} m²` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {isInk && kgRet > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                          <RotateCcw className="size-3" />
                          {kgRet.toFixed(2)} kg
                        </span>
                      ) : !isInk && m2Ret > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                          <RotateCcw className="size-3" />
                          {m2Ret.toFixed(3)} m²
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground">
                      {req.fulfilled_at ? fmtDate(req.fulfilled_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Eye className="size-3.5" />
                        Ver
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom bar — dos pastillas flotantes en página completa; inline embebido */}
      {(() => {
        const pill = 'border border-border rounded-lg bg-card/85 backdrop-blur-sm shadow-lg'

        const countEl = (
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {filtered.length} salida{filtered.length !== 1 ? 's' : ''}
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
              .reduce<(number | '…')[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…')
                acc.push(n)
                return acc
              }, [])
              .map((n, i) => n === '…'
                ? <span key={`e${i}`} className="w-7 text-center text-[10px] text-muted-foreground">…</span>
                : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={cn(
                      'size-7 text-[10px] font-bold border transition-colors',
                      safePage === n
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:bg-muted',
                    )}
                  >{n}</button>
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

      {/* Detail sheet */}
      <RequisitionSheet
        open={!!selectedReq}
        onClose={() => setSelectedReq(null)}
        requisitionId={selectedReq?.id ?? null}
        initialRequisition={selectedReq}
        userRole={userRole}
      />
    </>
  )
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}
