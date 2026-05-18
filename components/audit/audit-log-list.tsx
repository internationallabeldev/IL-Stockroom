'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery }          from '@tanstack/react-query'
import { format }            from 'date-fns'
import { es }                from 'date-fns/locale'
import { X, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { cn }                from '@/lib/utils'
import { OperationBadge }    from './operation-badge'
import { AuditLogDetail }    from './audit-log-detail'
import { getAuditLog }                         from '@/actions/audit.actions'
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

const PAGE_SIZE = 50

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  initialData:  AuditLogEntry[]
  initialTotal: number
  users:        AppUser[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AuditLogList({ initialData, initialTotal, users }: Props) {
  const [page,          setPage]          = useState(1)
  const [tableFilter,   setTableFilter]   = useState('')
  const [opFilter,      setOpFilter]      = useState<AuditOperation | ''>('')
  const [userFilter,    setUserFilter]    = useState('')
  const [dateFrom,      setDateFrom]      = useState('')
  const [dateTo,        setDateTo]        = useState('')
  const [selected,      setSelected]      = useState<AuditLogEntry | null>(null)
  const [filtersOpen,   setFiltersOpen]   = useState(false)

  // Reset page on any filter change
  useEffect(() => { setPage(1) }, [tableFilter, opFilter, userFilter, dateFrom, dateTo])

  const queryKey = ['audit_log', page, tableFilter, opFilter, userFilter, dateFrom, dateTo]

  const { data } = useQuery({
    queryKey,
    queryFn: () => getAuditLog({
      page,
      pageSize:     PAGE_SIZE,
      table_name:   tableFilter || undefined,
      operation:    (opFilter as AuditOperation) || undefined,
      performed_by: userFilter || undefined,
      date_from:    dateFrom   ? new Date(dateFrom).toISOString()  : undefined,
      date_to:      dateTo     ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
    }),
    initialData:    page === 1 && !tableFilter && !opFilter && !userFilter && !dateFrom && !dateTo
      ? { data: initialData, total: initialTotal }
      : undefined,
    staleTime: 15_000,
  })

  const entries = data?.data   ?? initialData
  const total   = data?.total  ?? initialTotal
  const pages   = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const hasFilters = !!(tableFilter || opFilter || userFilter || dateFrom || dateTo)

  const clearFilters = useCallback(() => {
    setTableFilter('')
    setOpFilter('')
    setUserFilter('')
    setDateFrom('')
    setDateTo('')
  }, [])

  return (
    <>
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-background border-b border-border -mx-8 px-8 py-3 mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setFiltersOpen(f => !f)}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 text-[10px] font-bold uppercase tracking-widest border transition-colors',
            filtersOpen || hasFilters
              ? 'bg-foreground text-background border-foreground'
              : 'border-border text-foreground/50 hover:text-foreground'
          )}
        >
          <Filter className="size-3.5" />
          Filtros
          {hasFilters && (
            <span className="ml-0.5 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[8px]">
              {[tableFilter, opFilter, userFilter, dateFrom, dateTo].filter(Boolean).length}
            </span>
          )}
        </button>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 h-8 px-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3" />
            Limpiar
          </button>
        )}

        <div className="flex-1" />

        <p className="text-[10px] font-mono text-muted-foreground">
          {total.toLocaleString()} registro{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Filter panel ────────────────────────────────────────────────────── */}
      {filtersOpen && (
        <div className="mb-6 p-4 border border-border bg-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {/* Table */}
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

          {/* Operation */}
          <FilterField label="Operación">
            <select
              value={opFilter}
              onChange={e => setOpFilter(e.target.value as AuditOperation | '')}
              className="h-8 w-full border border-border bg-background px-2 text-[11px] outline-none focus:border-foreground/40"
            >
              <option value="">Todas</option>
              <option value="INSERT">Creación</option>
              <option value="UPDATE">Edición</option>
              <option value="DELETE">Baja</option>
            </select>
          </FilterField>

          {/* User */}
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

          {/* Date from */}
          <FilterField label="Desde">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="h-8 w-full border border-border bg-background px-2 text-[11px] outline-none focus:border-foreground/40"
            />
          </FilterField>

          {/* Date to */}
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

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {entries.length === 0 ? (
        <div className="border border-dashed border-border p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sin registros de auditoría</p>
        </div>
      ) : (
        <div className="border border-border overflow-x-auto">
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
                  className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
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

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[10px] text-muted-foreground font-mono">
            Página {page} de {pages}
          </p>
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
        </div>
      )}

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
