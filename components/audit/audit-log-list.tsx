'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery }          from '@tanstack/react-query'
import { format }            from 'date-fns'
import { es }                from 'date-fns/locale'
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Activity,
  PlusCircle,
  Pencil,
  Trash2,
  Users,
  Database,
  Layers,
  Settings2,
} from 'lucide-react'
import { cn }                from '@/lib/utils'
import { useEmbedded, toolbarStickyClass } from '@/lib/embedded-context'
import { ToolbarHoverMenu, EmbeddedSummaryChip } from '@/components/shared/toolbar-hover-menu'
import { OperationBadge }    from './operation-badge'
import { AuditLogDetail }    from './audit-log-detail'
import { getAuditLog, getAuditStats, type AuditStats } from '@/actions/audit.actions'
import { AUDITED_TABLES, type AuditLogEntry, type AuditOperation } from '@/lib/audit-constants'
import type { AppUser }      from '@/actions/users.actions'

// ── Constants ─────────────────────────────────────────────────────────────────

const TABLE_LABELS: Record<string, string> = {
  providers:                   'Proveedores',
  ink_catalog:                 'Catálogo tintas',
  paper_catalog:               'Catálogo papel',
  purchase_orders:             'Órdenes de compra',
  purchase_order_ink_items:    'Ítems tinta (OC)',
  purchase_order_paper_items:  'Ítems papel (OC)',
  ink_receipts:                'Recepciones tinta',
  paper_receipts:              'Recepciones papel',
  ink_inventory:               'Inventario tinta',
  paper_inventory:             'Inventario papel',
  ink_outputs:                 'Salidas tinta',
  paper_outputs:               'Salidas papel',
  production_requisitions:     'Requisiciones',
  requisition_ink_items:       'Ítems tinta (req.)',
  requisition_paper_items:     'Ítems papel (req.)',
  users:                       'Usuarios',
}

const OPERATION_FILTERS: { value: AuditOperation | ''; label: string }[] = [
  { value: '',       label: 'Todas' },
  { value: 'INSERT', label: 'Creación' },
  { value: 'UPDATE', label: 'Edición' },
  { value: 'DELETE', label: 'Baja' },
]

const DEFAULT_PAGE_SIZE = 50

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function AuditStatsBar({ stats }: { stats: AuditStats }) {
  const { total, byOperation, topTable, uniqueUsers } = stats
  const opTotal = byOperation.INSERT + byOperation.UPDATE + byOperation.DELETE

  const items = [
    { icon: Activity,    label: 'Total',     value: total,             accent: null as 'green' | 'blue' | 'red' | null },
    { icon: PlusCircle,  label: 'Creación',  value: byOperation.INSERT, accent: byOperation.INSERT > 0 ? 'green' as const : null },
    { icon: Pencil,      label: 'Edición',   value: byOperation.UPDATE, accent: byOperation.UPDATE > 0 ? 'blue'  as const : null },
    { icon: Trash2,      label: 'Baja',      value: byOperation.DELETE, accent: byOperation.DELETE > 0 ? 'red'   as const : null },
    { icon: Users,       label: 'Usuarios',  value: uniqueUsers,        accent: null as 'green' | 'blue' | 'red' | null },
  ]

  const accentClass = (a: 'green' | 'blue' | 'red' | null) =>
    a === 'green' ? 'text-emerald-500' :
    a === 'blue'  ? 'text-blue-500' :
    a === 'red'   ? 'text-red-500' :
                    'text-muted-foreground/50'

  const valueClass = (a: 'green' | 'blue' | 'red' | null) =>
    a === 'green' ? 'text-emerald-600' :
    a === 'blue'  ? 'text-blue-600' :
    a === 'red'   ? 'text-red-500' :
                    'text-foreground/80'

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
      {items.map(({ icon: Icon, label, value, accent }, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <span className="text-border/60 select-none hidden sm:inline">·</span>}
          <Icon className={cn('size-3 shrink-0', accentClass(accent))} />
          <span className="text-[11px] text-muted-foreground/70 font-medium">{label}</span>
          <span className={cn('text-[11px] font-bold tabular-nums', valueClass(accent))}>
            {value.toLocaleString()}
          </span>
        </div>
      ))}

      {/* Operation distribution mini stacked bar */}
      {opTotal > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <Layers className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/70 font-medium">Distribución</span>
          <div className="flex h-1.5 w-14 overflow-hidden rounded-full gap-px">
            <div className="bg-emerald-500 transition-all" style={{ width: `${(byOperation.INSERT / opTotal) * 100}%` }} />
            <div className="bg-blue-500    transition-all" style={{ width: `${(byOperation.UPDATE / opTotal) * 100}%` }} />
            <div className="bg-red-500     transition-all" style={{ width: `${(byOperation.DELETE / opTotal) * 100}%` }} />
          </div>
          <span className="text-[11px] font-bold tabular-nums text-emerald-600">{byOperation.INSERT}</span>
          <span className="text-[9px] text-muted-foreground/40">·</span>
          <span className="text-[11px] font-bold tabular-nums text-blue-600">{byOperation.UPDATE}</span>
          <span className="text-[9px] text-muted-foreground/40">·</span>
          <span className="text-[11px] font-bold tabular-nums text-red-500">{byOperation.DELETE}</span>
        </div>
      )}

      {/* Top affected table */}
      {topTable && topTable.count > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <Database className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/70 font-medium">Top tabla</span>
          <span className="text-[11px] font-bold tabular-nums text-foreground/80 max-w-40 truncate">
            {TABLE_LABELS[topTable.name] ?? topTable.name}
          </span>
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">{topTable.count}</span>
        </div>
      )}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  initialData:  AuditLogEntry[]
  initialTotal: number
  initialStats: AuditStats
  users:        AppUser[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AuditLogList({ initialData, initialTotal, initialStats, users }: Props) {
  const embedded = useEmbedded()
  const [page,          setPage]          = useState(1)
  const [pageSize,      setPageSize]      = useState(DEFAULT_PAGE_SIZE)
  const [pageSizeInput, setPageSizeInput] = useState(String(DEFAULT_PAGE_SIZE))
  const [search,        setSearch]        = useState('')
  const [tableFilter,   setTableFilter]   = useState('')
  const [opFilter,      setOpFilter]      = useState<AuditOperation | ''>('')
  const [userFilter,    setUserFilter]    = useState('')
  const [dateFrom,      setDateFrom]      = useState('')
  const [dateTo,        setDateTo]        = useState('')
  const [selected,      setSelected]      = useState<AuditLogEntry | null>(null)
  const [filtersOpen,   setFiltersOpen]   = useState(false)

  useEffect(() => { setPage(1) }, [search, tableFilter, opFilter, userFilter, dateFrom, dateTo, pageSize])

  const filterArgs = {
    table_name:   tableFilter || undefined,
    operation:    (opFilter as AuditOperation) || undefined,
    performed_by: userFilter || undefined,
    date_from:    dateFrom   ? new Date(dateFrom).toISOString()                 : undefined,
    date_to:      dateTo     ? new Date(dateTo + 'T23:59:59').toISOString()     : undefined,
    search:       search.trim() || undefined,
  }

  const hasFilters = !!(tableFilter || opFilter || userFilter || dateFrom || dateTo || search.trim())
  const isInitialState = page === 1 && pageSize === DEFAULT_PAGE_SIZE && !hasFilters

  const { data } = useQuery({
    queryKey: ['audit_log', page, pageSize, search, tableFilter, opFilter, userFilter, dateFrom, dateTo],
    queryFn:  () => getAuditLog({ page, pageSize, ...filterArgs }),
    initialData: isInitialState ? { data: initialData, total: initialTotal } : undefined,
    staleTime: 15_000,
  })

  const { data: stats = initialStats } = useQuery({
    queryKey: ['audit_stats', search, tableFilter, opFilter, userFilter, dateFrom, dateTo],
    queryFn:  () => getAuditStats(filterArgs),
    initialData: !hasFilters ? initialStats : undefined,
    staleTime: 15_000,
  })

  const entries = data?.data   ?? initialData
  const total   = data?.total  ?? initialTotal
  const pages   = Math.max(1, Math.ceil(total / pageSize))

  const clearFilters = useCallback(() => {
    setSearch('')
    setTableFilter('')
    setOpFilter('')
    setUserFilter('')
    setDateFrom('')
    setDateTo('')
  }, [])

  function handlePageSizeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPageSizeInput(e.target.value)
    const n = parseInt(e.target.value)
    if (!isNaN(n) && n >= 10 && n <= 200) setPageSize(n)
  }

  function handlePageSizeBlur() {
    const n = parseInt(pageSizeInput)
    const clamped = isNaN(n) || n < 10 ? pageSize : Math.min(200, n)
    setPageSize(clamped)
    setPageSizeInput(String(clamped))
  }

  const advancedFilterCount = [tableFilter, userFilter, dateFrom, dateTo].filter(Boolean).length

  // Page size — inline on full pages, tucked into the "Controles" dropdown when embedded.
  const pageSizeControl = (
    <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 h-8" id="audit-page-size">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Por página</span>
      <input
        type="number"
        min={10}
        max={200}
        value={pageSizeInput}
        onChange={handlePageSizeChange}
        onBlur={handlePageSizeBlur}
        className="w-10 bg-transparent text-[11px] font-mono text-center outline-none text-foreground"
      />
    </div>
  )

  return (
    <>
      {/* ── Toolbar — providers-style: sticky, search + filters inside ──────── */}
      <div className={cn('sticky z-30 bg-background border-b border-border mb-6', toolbarStickyClass(embedded))}>
        <div className="@container">
        <div className={cn(
          'py-3 flex gap-2',
          embedded
            ? 'flex-row flex-wrap items-center'
            : 'flex-col @2xl:flex-row @2xl:flex-wrap @2xl:justify-between @2xl:items-center @2xl:gap-3',
        )}>
          {/* Search */}
          <div className={cn('relative min-w-0', embedded ? 'flex-1' : 'w-full @2xl:w-auto')} id="audit-search">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por usuario o ID de registro..."
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

          <div className="gap-2 flex flex-row flex-wrap items-center">
            {/* Operation filter pills */}
            <div className="flex gap-0.5 bg-black/4 dark:bg-black/25 p-0.5 shrink-0" id="audit-op-filter">
              {OPERATION_FILTERS.map(f => (
                <button
                  key={f.value || 'all'}
                  onClick={() => setOpFilter(f.value)}
                  className={cn(
                    'px-3 h-7 text-[10px] font-bold uppercase tracking-widest transition-all',
                    opFilter === f.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-foreground/50 hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {embedded ? (
              <>
                <EmbeddedSummaryChip>
                  <AuditStatsBar stats={stats} />
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

            {hasFilters && (
              <button
                onClick={clearFilters}
                title={embedded ? 'Limpiar' : undefined}
                aria-label={embedded ? 'Limpiar' : undefined}
                className={cn(
                  'flex items-center gap-1 h-8 border border-border text-[10px] font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-colors shrink-0',
                  embedded ? 'px-2' : 'px-2.5',
                )}
              >
                <X className="size-3" />
                {!embedded && 'Limpiar'}
              </button>
            )}

            <button
              id="audit-filters-btn"
              onClick={() => setFiltersOpen(f => !f)}
              title={embedded ? 'Filtros' : undefined}
              aria-label={embedded ? 'Filtros' : undefined}
              className={cn(
                'flex items-center gap-1.5 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors shrink-0',
                embedded ? 'px-2' : 'px-4',
                filtersOpen || advancedFilterCount > 0
                  ? 'bg-foreground text-background'
                  : 'border border-border text-foreground/60 hover:text-foreground hover:border-foreground/40',
              )}
            >
              <Filter className="size-3.5" />
              {!embedded && 'Filtros'}
              {advancedFilterCount > 0 && (
                <span className="ml-0.5 rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold bg-background/20 text-background">
                  {advancedFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Advanced filter panel — collapsible, inside the sticky div */}
        {filtersOpen && (
          <div className="pb-3 grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-4 gap-3">
            <FilterField label="Tabla">
              <select
                value={tableFilter}
                onChange={e => setTableFilter(e.target.value)}
                className="h-8 w-full border border-border bg-background px-2 text-[11px] outline-none focus:border-foreground/40"
              >
                <option value="">Todas</option>
                {AUDITED_TABLES.map((t: string) => (
                  <option key={t} value={t}>{TABLE_LABELS[t] ?? t}</option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Usuario">
              <select
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
                className="h-8 w-full border border-border bg-background px-2 text-[11px] outline-none focus:border-foreground/40"
              >
                <option value="">Todos</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Desde">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                max={dateTo || undefined}
                className="h-8 w-full border border-border bg-background px-2 text-[11px] outline-none focus:border-foreground/40"
              />
            </FilterField>

            <FilterField label="Hasta">
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                max={new Date().toISOString().split('T')[0]}
                className="h-8 w-full border border-border bg-background px-2 text-[11px] outline-none focus:border-foreground/40"
              />
            </FilterField>
          </div>
        )}

        {!embedded && (
          <div className="py-3" id="audit-stats-bar">
            <AuditStatsBar stats={stats} />
          </div>
        )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {entries.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {hasFilters ? 'Sin resultados para los filtros' : 'Sin registros de auditoría'}
          </p>
        </div>
      ) : (
        <div className="border border-border bg-card overflow-x-auto" id="audit-table">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <Th>Fecha</Th>
                <Th>Tabla</Th>
                <Th>Operación</Th>
                <Th>ID Registro</Th>
                <Th>Usuario</Th>
                <Th>Campos modificados</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <Td mono>
                    {format(new Date(entry.created_at), 'dd MMM yyyy', { locale: es })}
                    <span className="block text-[10px] text-muted-foreground">
                      {format(new Date(entry.created_at), 'HH:mm:ss')}
                    </span>
                  </Td>
                  <Td>{TABLE_LABELS[entry.table_name] ?? entry.table_name}</Td>
                  <Td><OperationBadge operation={entry.operation} /></Td>
                  <Td mono>{entry.record_id ?? '—'}</Td>
                  <Td>{entry.performed_by_name ?? <span className="text-muted-foreground">—</span>}</Td>
                  <Td>
                    {entry.changed_fields?.length ? (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {entry.changed_fields.slice(0, 4).join(', ')}
                        {entry.changed_fields.length > 4 && ` +${entry.changed_fields.length - 4}`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Count + Pagination — dos pastillas flotantes en página completa; inline embebido ── */}
      {(() => {
        const pill = 'border border-border rounded-lg bg-card/85 backdrop-blur-sm shadow-lg'

        const countEl = (
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {total.toLocaleString()} registro{total !== 1 ? 's' : ''}
            {total > pageSize && (
              <span className="ml-1 font-normal normal-case tracking-normal">
                — mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
              </span>
            )}
          </p>
        )

        const paginationEl = pages > 1 ? (
          <div className="flex items-center gap-1">
            <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="size-3.5" />
            </PagBtn>

            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === pages || Math.abs(n - page) <= 1)
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
                    className={cn(
                      'size-7 text-[10px] font-bold border transition-colors',
                      page === n
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {n}
                  </button>
                )
              )}

            <PagBtn onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
              <ChevronRight className="size-3.5" />
            </PagBtn>
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

      {/* ── Detail sheet ────────────────────────────────────────────────────── */}
      <AuditLogDetail entry={selected} onClose={() => setSelected(null)} />
    </>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
      {children}
    </th>
  )
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={cn('px-4 py-2.5 align-top whitespace-nowrap', mono && 'font-mono text-[10px]')}>
      {children}
    </td>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      {children}
    </div>
  )
}

function PagBtn({ children, onClick, disabled }: {
  children: React.ReactNode
  onClick:  () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="size-7 flex items-center justify-center border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  )
}
