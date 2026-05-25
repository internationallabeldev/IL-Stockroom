'use client'

import { Fragment, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search, X, Plus, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowUpDown, Droplet, FileText,
  Clock, AlertCircle, ChevronDown, ChevronUp, Package, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getRequisitions,
  type Requisition,
  type RequisitionStatus,
  type MaterialType,
  type InkCatalogForRequisition,
  type PaperCatalogForRequisition,
} from '@/actions/requisitions.actions'
import { RequisitionStatusBadge } from './requisition-status-badge'
import { RequisitionForm }        from './requisition-form'
import { RequisitionSheet }       from './requisition-sheet'
import type { Database }          from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

// ── Stats bar ─────────────────────────────────────────────────────────────────

function RequisitionsStatsBar({ reqs }: { reqs: Requisition[] }) {
  const now      = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const pending  = reqs.filter(r => r.status === 'PENDING').length
  const partial  = reqs.filter(r => r.status === 'PARTIAL').length
  const today    = reqs.filter(r => r.request_date.slice(0, 10) === todayStr).length
  const critical = reqs.filter(r =>
    r.status === 'PENDING' &&
    (now.getTime() - new Date(r.request_date).getTime()) / 36e5 > 24,
  ).length

  const fulfilled = reqs.filter(r => r.status === 'FULFILLED' && r.fulfilled_at)
  const avgH = fulfilled.length === 0 ? null
    : fulfilled.reduce((s, r) =>
        s + (new Date(r.fulfilled_at!).getTime() - new Date(r.request_date).getTime()) / 36e5,
      0) / fulfilled.length

  type Accent = 'red' | 'amber' | null
  const items: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; accent: Accent }[] = [
    { icon: AlertCircle, label: 'Pendientes', value: pending, accent: pending  > 0 ? 'red'   : null },
    { icon: Package,     label: 'En proceso', value: partial, accent: partial  > 0 ? 'amber' : null },
    { icon: Clock,       label: 'Hoy',        value: today,   accent: null },
  ]
  if (critical > 0) items.push({ icon: AlertCircle, label: '> 24 h', value: critical, accent: 'red' })
  if (avgH !== null) items.push({
    icon:   TrendingUp,
    label:  'T. prom. surtido',
    value:  avgH < 1 ? `${Math.round(avgH * 60)} min` : `${avgH.toFixed(1)} h`,
    accent: null,
  })

  return (
    <div className="flex flex-wrap justify-between items-center gap-x-6 gap-y-2">
      {items.map(({ icon: Icon, label, value, accent }, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <span className="text-border/60 select-none hidden sm:inline">·</span>}
          <Icon className={cn(
            'size-3 shrink-0',
            accent === 'red'   ? 'text-red-500'   :
            accent === 'amber' ? 'text-amber-500'  :
            'text-muted-foreground/50',
          )} />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">{label}</span>
          <span className={cn(
            'text-[11px] font-bold tabular-nums',
            accent === 'red'   ? 'text-red-500'   :
            accent === 'amber' ? 'text-amber-500'  :
            'text-foreground/80',
          )}>
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Flow step bar ─────────────────────────────────────────────────────────────

function StepBar({ status }: { status: RequisitionStatus }) {
  const done       = status === 'PENDING' ? 1 : ['APPROVED', 'PARTIAL'].includes(status) ? 2 : status === 'FULFILLED' ? 3 : 0
  const isRejected = status === 'REJECTED' || status === 'CANCELLED'
  return (
    <div className="flex gap-0.5 mt-1">
      {([1, 2, 3] as const).map(s => (
        <div key={s} className={cn(
          'h-px w-3.5',
          isRejected ? 'bg-red-400/50'   :
          done >= s  ? 'bg-foreground/50' :
          'bg-border/40',
        )} />
      ))}
    </div>
  )
}

// ── Row urgency ───────────────────────────────────────────────────────────────

type Urgency = 'critical' | 'partial' | 'pending' | 'closed' | 'none'

function getUrgency(req: Requisition): Urgency {
  if (req.status === 'FULFILLED' || req.status === 'REJECTED' || req.status === 'CANCELLED') return 'closed'
  if (req.status === 'PENDING' && (Date.now() - new Date(req.request_date).getTime()) / 36e5 > 24) return 'critical'
  if (req.status === 'PARTIAL')  return 'partial'
  if (req.status === 'PENDING')  return 'pending'
  return 'none'
}

const URGENCY_CLS: Record<Urgency, string> = {
  critical: 'border-l-2 border-l-red-400 bg-red-50/20 dark:bg-red-950/10',
  partial:  'border-l-2 border-l-blue-400 bg-blue-50/10 dark:bg-blue-950/10',
  pending:  'border-l-2 border-l-amber-300',
  closed:   'opacity-50',
  none:     '',
}

// ── Inline expanded row ───────────────────────────────────────────────────────

function ExpandedRow({
  req, colSpan, onOpenSheet,
}: { req: Requisition; colSpan: number; onOpenSheet: () => void }) {
  return (
    <tr className="bg-muted/5">
      <td colSpan={colSpan} className="px-8 pb-4 pt-0 border-b border-border/40">
        <div className="pt-2 space-y-2">

          {req.ink_items.map(item => {
            const del    = req.ink_outputs
              .filter(o => o.ink_inventory?.ink_catalog_id === item.ink_catalog_id)
              .reduce((s, o) => s + o.kg_delivered, 0)
            const kgReq  = parseFloat(String(item.kg_requested)) || 0
            const pct    = kgReq > 0 ? Math.min(100, (del / kgReq) * 100) : 0
            const filled = kgReq > 0 && del >= kgReq
            return (
              <div key={item.id} className="flex items-center gap-3">
                <Droplet className="size-2.5 text-cyan-500/70 shrink-0" />
                <span className="text-[10px] font-medium w-36 truncate">{item.ink_catalog?.name ?? '—'}</span>
                <div className="w-24 h-1 bg-muted/60 relative overflow-hidden shrink-0">
                  <div
                    className={cn('absolute left-0 top-0 h-full', filled ? 'bg-green-500' : 'bg-foreground/50')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {del.toFixed(2)}/{kgReq.toFixed(2)} kg
                </span>
                {filled && <span className="text-[8px] font-bold text-green-600 uppercase">completo</span>}
              </div>
            )
          })}

          {req.paper_items.map(item => {
            const del    = req.paper_outputs
              .filter(o => o.paper_inventory?.paper_catalog_id === item.paper_catalog_id)
              .reduce((s, o) => s + (o.m2_delivered ?? 0), 0)
            const m2Req  = parseFloat(String(item.m2_requested ?? '0')) || 0
            const pct    = m2Req > 0 ? Math.min(100, (del / m2Req) * 100) : 0
            const filled = m2Req > 0 && del >= m2Req
            return (
              <div key={item.id} className="flex items-center gap-3">
                <FileText className="size-2.5 text-stone-400/70 shrink-0" />
                <span className="text-[10px] font-medium w-36 truncate">{item.paper_catalog?.name ?? '—'}</span>
                <div className="w-24 h-1 bg-muted/60 relative overflow-hidden shrink-0">
                  <div
                    className={cn('absolute left-0 top-0 h-full', filled ? 'bg-green-500' : 'bg-foreground/50')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {del.toFixed(2)}/{m2Req.toFixed(2)} m²
                </span>
                {filled && <span className="text-[8px] font-bold text-green-600 uppercase">completo</span>}
              </div>
            )
          })}

          <div className="flex items-center justify-between pt-0.5">
            {req.notes
              ? <p className="text-[9px] text-muted-foreground italic truncate max-w-xs">{req.notes}</p>
              : <span />}
            <button
              onClick={e => { e.stopPropagation(); onOpenSheet() }}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver completo →
            </button>
          </div>

        </div>
      </td>
    </tr>
  )
}

// ── Tab config ────────────────────────────────────────────────────────────────

type TabValue = 'pending' | 'active' | 'closed' | 'all'

const TABS: { value: TabValue; label: string; statuses: RequisitionStatus[] }[] = [
  { value: 'pending', label: 'Pendientes', statuses: ['PENDING'] },
  { value: 'active',  label: 'En proceso', statuses: ['APPROVED', 'PARTIAL'] },
  { value: 'closed',  label: 'Cerradas',   statuses: ['FULFILLED', 'REJECTED', 'CANCELLED'] },
  { value: 'all',     label: 'Todas',      statuses: [] },
]

type SortKey = 'number' | 'type' | 'order' | 'requester' | 'date' | 'status'

type Props = {
  initialRequisitions: Requisition[]
  canCreate:    boolean
  canManage:    boolean
  userRole:     UserRole
  inkCatalog:   InkCatalogForRequisition[]
  paperCatalog: PaperCatalogForRequisition[]
  materialType?: MaterialType
}

export function RequisitionsList({
  initialRequisitions,
  canCreate,
  canManage,
  userRole,
  inkCatalog,
  paperCatalog,
  materialType,
}: Props) {
  const [tab,         setTab]         = useState<TabValue>('pending')
  const [search,      setSearch]      = useState('')
  const [sortKey,     setSortKey]     = useState<SortKey>('date')
  const [sortDir,     setSortDir]     = useState<'asc' | 'desc'>('desc')
  const [page,        setPage]        = useState(1)
  const [pageSize,    setPageSize]    = useState(15)
  const [pageSizeInp, setPageSizeInp] = useState('15')
  const [formOpen,    setFormOpen]    = useState(false)
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null)
  const [expandedId,  setExpandedId]  = useState<number | null>(null)

  const { data: all = initialRequisitions } = useQuery({
    queryKey:        ['requisitions'],
    queryFn:         () => getRequisitions(),
    initialData:     initialRequisitions,
    refetchInterval: 30_000,
  })

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  function toggleExpand(id: number) {
    setExpandedId(prev => prev === id ? null : id)
  }

  const filtered = useMemo(() => {
    const activeTab = TABS.find(t => t.value === tab)!
    let result = all as Requisition[]

    if (materialType) result = result.filter(r => r.material_type === materialType)

    if (activeTab.statuses.length) {
      result = result.filter(r => activeTab.statuses.includes(r.status))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        `#${r.requisition_number}`.includes(q) ||
        r.production_order.toLowerCase().includes(q) ||
        [r.requester?.first_name, r.requester?.last_name]
          .filter(Boolean).join(' ').toLowerCase().includes(q),
      )
    }

    const dir = sortDir === 'asc' ? 1 : -1
    return [...result].sort((a, b) => {
      switch (sortKey) {
        case 'number':    return (a.requisition_number - b.requisition_number) * dir
        case 'type':      return a.material_type.localeCompare(b.material_type) * dir
        case 'order':     return a.production_order.localeCompare(b.production_order) * dir
        case 'requester': return `${a.requester?.first_name}`.localeCompare(`${b.requester?.first_name}`) * dir
        case 'date':      return a.request_date.localeCompare(b.request_date) * dir
        case 'status':    return a.status.localeCompare(b.status) * dir
        default:          return 0
      }
    })
  }, [all, tab, search, sortKey, sortDir])

  const totalPages   = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage     = Math.min(page, totalPages)
  const paginated    = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const pendingCount = (all as Requisition[]).filter(r => r.status === 'PENDING').length
  const colCount     = !materialType ? 7 : 6

  return (
    <>
      {/* ── Sticky toolbar ────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-background border-b border-border/50 -mx-8 px-8 mb-4">

        {/* Toolbar row */}
        <div className="py-3 flex flex-wrap items-center gap-3">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar #, orden, solicitante…"
              className="h-8 w-100 pl-8 pr-7 border border-border bg-card text-xs outline-none focus:border-foreground/40 transition-colors"
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

          {/* Tabs */}
          <div className="flex border border-border">
            {TABS.map(t => (
              <button
                key={t.value}
                onClick={() => { setTab(t.value); setPage(1) }}
                className={cn(
                  'px-3 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors relative',
                  tab === t.value
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground border-l border-border first:border-l-0',
                )}
              >
                {t.label}
                {t.value === 'pending' && pendingCount > 0 && (
                  <span className={cn(
                    'ml-1.5 text-[8px] font-bold px-1 rounded-full',
                    tab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-400 text-amber-900',
                  )}>
                    {pendingCount}
                  </span>
                )}
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
              className="w-9 bg-transparent text-[11px] font-mono text-center outline-none text-foreground"
            />
          </div>

          {canCreate && (
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 h-8 px-4 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              <Plus className="size-3.5" />
              Nueva requisición
            </button>
          )}
        </div>

        {/* Stats bar row */}
        <div className="pb-3">
          <RequisitionsStatsBar reqs={all as Requisition[]} />
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {paginated.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            No hay requisiciones para mostrar
          </p>
        </div>
      ) : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/40">
                {(([
                  { label: '#',        key: 'number'    },
                  ...(!materialType ? [{ label: 'Tipo', key: 'type' }] : []),
                  { label: 'O. Prod.', key: 'order'     },
                  { label: 'Solicitó', key: 'requester' },
                  { label: 'Fecha',    key: 'date'      },
                  { label: 'Estado',   key: 'status'    },
                  { label: '',         key: null        },
                ]) as { label: string; key: SortKey | null }[]).map(col => (
                  <th
                    key={col.label}
                    onClick={() => col.key && toggleSort(col.key)}
                    className={cn(
                      'px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground select-none',
                      col.key && 'cursor-pointer hover:text-foreground transition-colors',
                    )}
                  >
                    {col.key ? (
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key
                          ? sortDir === 'asc'
                            ? <ArrowUp className="size-3" />
                            : <ArrowDown className="size-3" />
                          : <ArrowUpDown className="size-3 opacity-30" />}
                      </span>
                    ) : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paginated.map(req => {
                const urgency    = getUrgency(req)
                const isExpanded = expandedId === req.id
                const hoursSince = (Date.now() - new Date(req.request_date).getTime()) / 36e5

                return (
                  <Fragment key={req.id}>
                    <tr
                      onClick={() => toggleExpand(req.id)}
                      className={cn(
                        'transition-colors cursor-pointer',
                        URGENCY_CLS[urgency],
                        isExpanded ? 'bg-muted/20' : 'hover:bg-muted/20',
                      )}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-sm">
                        #{req.requisition_number}
                      </td>

                      {!materialType && (
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {req.material_type === 'INK'
                              ? <Droplet  className="size-3" />
                              : <FileText className="size-3" />}
                            {req.material_type === 'INK' ? 'Tinta' : 'Papel'}
                          </span>
                        </td>
                      )}

                      <td className="px-4 py-3 text-sm max-w-45 truncate font-mono">
                        {req.production_order}
                      </td>

                      <td className="px-4 py-3 text-[11px] text-muted-foreground">
                        {req.requester
                          ? `${req.requester.first_name} ${req.requester.last_name}`
                          : '—'}
                      </td>

                      <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">
                        {fmtDate(req.request_date)}
                        {urgency === 'critical' && (
                          <span className="ml-1.5 text-[8px] font-bold text-red-500">
                            +{Math.floor(hoursSince)}h
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <RequisitionStatusBadge status={req.status} size="xs" />
                        <StepBar status={req.status} />
                      </td>

                      <td className="px-4 py-3 text-right">
                        {isExpanded
                          ? <ChevronUp   className="size-3.5 text-muted-foreground ml-auto" />
                          : <ChevronDown className="size-3.5 text-muted-foreground ml-auto" />}
                      </td>
                    </tr>

                    {isExpanded && (
                      <ExpandedRow
                        req={req}
                        colSpan={colCount}
                        onOpenSheet={() => setSelectedReq(req)}
                      />
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {filtered.length} requisición{filtered.length !== 1 ? 'es' : ''}
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
        )}
      </div>

      {/* ── Create form ───────────────────────────────────────────────────── */}
      <RequisitionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        inkCatalog={inkCatalog}
        paperCatalog={paperCatalog}
        defaultMaterialType={materialType}
      />

      {/* ── Detail sheet ──────────────────────────────────────────────────── */}
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
