'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search, X, Plus, Eye, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowUpDown, Droplet, FileText,
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

// ── Tab config ───────────────────────────────────────────────────────────────

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const pendingCount = (all as Requisition[]).filter(r => r.status === 'PENDING').length

  return (
    <>
      {/* Toolbar */}
      <div className="sticky top-16 z-30 bg-[#F5F2EA] border-b border-[#1A1A1A]/10 -mx-8 px-8 py-3 mb-4 flex flex-wrap items-center gap-3">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#5f5e59] pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar #, orden, solicitante…"
            className="h-8 w-56 pl-8 pr-7 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-xs outline-none focus:border-[#1A1A1A]/40 transition-colors"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5f5e59] hover:text-[#1A1A1A]"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border border-[#1A1A1A]/20">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setPage(1) }}
              className={cn(
                'px-3 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors relative',
                tab === t.value
                  ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                  : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A] border-l border-[#1A1A1A]/20 first:border-l-0',
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
        <div className="flex items-center gap-1.5 border border-[#1A1A1A]/20 px-2.5 h-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] whitespace-nowrap">Por página</span>
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
            className="w-9 bg-transparent text-[11px] font-mono text-center outline-none text-[#1A1A1A]"
          />
        </div>

        {canCreate && (
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 h-8 px-4 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            <Plus className="size-3.5" />
            Nueva requisición
          </button>
        )}
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="border border-dashed border-[#1A1A1A]/20 p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
            No hay requisiciones para mostrar
          </p>
        </div>
      ) : (
        <div className="border border-[#1A1A1A]/15 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/40">
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
                      'px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] select-none',
                      col.key && 'cursor-pointer hover:text-[#1A1A1A] transition-colors',
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
            <tbody className="divide-y divide-[#1A1A1A]/08">
              {paginated.map(req => (
                <tr key={req.id} className="hover:bg-[#E5E1D8]/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-sm">
                    #{req.requisition_number}
                  </td>
                  {!materialType && (
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
                        {req.material_type === 'INK'
                          ? <Droplet  className="size-3" />
                          : <FileText className="size-3" />}
                        {req.material_type === 'INK' ? 'Tinta' : 'Papel'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm max-w-[180px] truncate font-mono">
                    {req.production_order}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[#5f5e59]">
                    {req.requester
                      ? `${req.requester.first_name} ${req.requester.last_name}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[#5f5e59]">
                    {fmtDate(req.request_date)}
                  </td>
                  <td className="px-4 py-3">
                    <RequisitionStatusBadge status={req.status} size="xs" />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedReq(req)}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] hover:text-[#1A1A1A] transition-colors"
                    >
                      <Eye className="size-3.5" />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
          {filtered.length} requisición{filtered.length !== 1 ? 'es' : ''}
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
              .map((n, i) => n === '…'
                ? <span key={`e${i}`} className="w-7 text-center text-[10px] text-[#5f5e59]">…</span>
                : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={cn(
                      'size-7 text-[10px] font-bold border transition-colors',
                      safePage === n
                        ? 'bg-[#1A1A1A] text-[#F5F2EA] border-[#1A1A1A]'
                        : 'border-[#1A1A1A]/20 hover:bg-[#E5E1D8]',
                    )}
                  >{n}</button>
                )
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

      {/* Create form */}
      <RequisitionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        inkCatalog={inkCatalog}
        paperCatalog={paperCatalog}
        defaultMaterialType={materialType}
      />

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
