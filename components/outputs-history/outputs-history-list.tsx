'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search, X, Eye, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowUpDown,
  Droplet, FileText, RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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

type Props = {
  initialRequisitions: Requisition[]
  userRole: UserRole
}

export function OutputsHistoryList({ initialRequisitions, userRole }: Props) {
  const [search,      setSearch]      = useState('')
  const [matFilter,   setMatFilter]   = useState<MatFilter>('ALL')
  const [dateFrom,    setDateFrom]    = useState('')
  const [dateTo,      setDateTo]      = useState('')
  const [sortKey,     setSortKey]     = useState<SortKey>('date')
  const [sortDir,     setSortDir]     = useState<'asc' | 'desc'>('desc')
  const [page,        setPage]        = useState(1)
  const [pageSize,    setPageSize]    = useState(15)
  const [pageSizeInp, setPageSizeInp] = useState('15')
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null)

  const { data: all = initialRequisitions } = useQuery({
    queryKey:        ['requisitions', 'fulfilled'],
    queryFn:         () => getRequisitions({ status: 'FULFILLED' }),
    initialData:     initialRequisitions,
    refetchInterval: 60_000,
  })

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let result = all as Requisition[]

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

  const stats = useMemo(() => ({
    count:   filtered.length,
    totalKg: filtered.flatMap(r => r.ink_outputs).reduce((s, o) => s + o.kg_delivered, 0),
    totalM2: filtered.flatMap(r => r.paper_outputs).reduce((s, o) => s + (o.m2_delivered ?? 0), 0),
  }), [filtered])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
      : <ArrowUpDown className="size-3 opacity-30" />

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total completadas"   value={String(stats.count)} />
        <StatCard label="Kg tinta entregada"  value={stats.totalKg > 0 ? `${stats.totalKg.toFixed(2)} kg`   : '0 kg'} />
        <StatCard label="M² papel entregado"  value={stats.totalM2 > 0 ? `${stats.totalM2.toFixed(3)} m²` : '0 m²'} />
      </div>

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

        {/* Material type */}
        <div className="flex border border-[#1A1A1A]/20">
          {MAT_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => { setMatFilter(t.value); setPage(1) }}
              className={cn(
                'px-3 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors',
                matFilter === t.value
                  ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                  : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A] border-l border-[#1A1A1A]/20 first:border-l-0',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1) }}
            className="h-8 border border-[#1A1A1A]/20 bg-[#fdf9f0] px-2 text-[11px] outline-none focus:border-[#1A1A1A]/40 transition-colors"
          />
          <span className="text-[10px] text-[#5f5e59]">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1) }}
            className="h-8 border border-[#1A1A1A]/20 bg-[#fdf9f0] px-2 text-[11px] outline-none focus:border-[#1A1A1A]/40 transition-colors"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
              className="text-[#5f5e59] hover:text-[#1A1A1A] transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
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
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="border border-dashed border-[#1A1A1A]/20 p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
            No hay salidas para mostrar
          </p>
        </div>
      ) : (
        <div className="border border-[#1A1A1A]/15 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/40">
                <th
                  onClick={() => toggleSort('number')}
                  className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] select-none cursor-pointer hover:text-[#1A1A1A] transition-colors"
                >
                  <span className="inline-flex items-center gap-1"># <SortIcon k="number" /></span>
                </th>
                <th
                  onClick={() => toggleSort('type')}
                  className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] select-none cursor-pointer hover:text-[#1A1A1A] transition-colors"
                >
                  <span className="inline-flex items-center gap-1">Tipo <SortIcon k="type" /></span>
                </th>
                <th
                  onClick={() => toggleSort('order')}
                  className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] select-none cursor-pointer hover:text-[#1A1A1A] transition-colors"
                >
                  <span className="inline-flex items-center gap-1">O. Prod. <SortIcon k="order" /></span>
                </th>
                <th className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
                  Materiales
                </th>
                <th className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
                  Entregado
                </th>
                <th className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
                  Devuelto
                </th>
                <th
                  onClick={() => toggleSort('date')}
                  className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] select-none cursor-pointer hover:text-[#1A1A1A] transition-colors"
                >
                  <span className="inline-flex items-center gap-1">Completado <SortIcon k="date" /></span>
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]/08">
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
                  <tr key={req.id} className="hover:bg-[#E5E1D8]/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-sm">
                      #{req.requisition_number}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
                        {isInk
                          ? <Droplet  className="size-3" />
                          : <FileText className="size-3" />}
                        {isInk ? 'Tinta' : 'Papel'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-[160px] truncate font-mono">
                      {req.production_order}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#5f5e59] max-w-[200px] truncate">
                      {names || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-bold text-[#1A1A1A]">
                      {isInk
                        ? kgNet > 0 ? `${kgNet.toFixed(2)} kg`   : '—'
                        : m2Net > 0 ? `${m2Net.toFixed(3)} m²` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {isInk && kgRet > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700">
                          <RotateCcw className="size-3" />
                          {kgRet.toFixed(2)} kg
                        </span>
                      ) : !isInk && m2Ret > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700">
                          <RotateCcw className="size-3" />
                          {m2Ret.toFixed(3)} m²
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#5f5e59]/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#5f5e59]">
                      {req.fulfilled_at ? fmtDate(req.fulfilled_at) : '—'}
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
          {filtered.length} salida{filtered.length !== 1 ? 's' : ''}
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#1A1A1A]/15 p-4">
      <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-2">
        {label}
      </p>
      <p className="font-heading text-2xl font-black text-[#1A1A1A] tabular-nums">
        {value}
      </p>
    </div>
  )
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}
