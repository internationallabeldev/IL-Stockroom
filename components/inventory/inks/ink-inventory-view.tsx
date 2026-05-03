'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LayoutList, Layers, Search, X, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInkInventory, type InkLot } from '@/actions/ink-inventory.actions'
import { InkLotsTableView }       from './ink-lots-table-view'
import { InkCatalogGroupView }    from './ink-catalog-group-view'
import { InkLotHistorySheet }     from './ink-lot-history-sheet'
import { InkRequisitionSheet }    from './ink-requisition-sheet'

type View = 'table' | 'group'

type Props = {
  initialLots: InkLot[]
  canManage:   boolean
  canRequest:  boolean
}

export function InkInventoryView({ initialLots, canManage, canRequest }: Props) {
  const [view,       setView]       = useState<View>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('ink-inv-view') as View) ?? 'table'
    }
    return 'table'
  })
  const [search,     setSearch]     = useState('')
  const [lowStock,   setLowStock]   = useState(false)
  const [showDisabled, setShowDisabled] = useState(false)

  const [historyOpen,    setHistoryOpen]    = useState(false)
  const [historyLotId,   setHistoryLotId]   = useState<number | null>(null)
  const [requisitionOpen, setRequisitionOpen] = useState(false)
  const [selectedLot,    setSelectedLot]    = useState<InkLot | null>(null)

  const { data: lots, refetch } = useQuery({
    queryKey:      ['ink-inventory'],
    queryFn:       () => getInkInventory(),
    initialData:   initialLots,
    refetchInterval: 30_000,
  })

  function switchView(v: View) {
    setView(v)
    localStorage.setItem('ink-inv-view', v)
  }

  function openHistory(id: number) {
    setHistoryLotId(id)
    setHistoryOpen(true)
  }

  function openRequest(lot: InkLot) {
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

    if (lowStock) {
      result = result.filter(l => {
        const min = l.ink_catalog?.min_stock_kg ?? 0
        return (l.remaining_kg ?? 0) < min
      })
    }

    return result
  }, [lots, search, lowStock, showDisabled])

  const totalActive   = (lots as InkLot[]).filter(l => l.enabled).length
  const totalDisabled = (lots as InkLot[]).filter(l => !l.enabled).length
  const lowStockCount = (lots as InkLot[]).filter(l => {
    const min = l.ink_catalog?.min_stock_kg ?? 0
    return l.enabled && (l.remaining_kg ?? 0) < min
  }).length

  return (
    <>
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">

        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#5f5e59]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar lote, tinta…"
            className="w-full h-8 pl-8 pr-8 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-sm outline-none focus:border-[#1A1A1A]/40 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5f5e59] hover:text-[#1A1A1A]"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Low-stock filter */}
        <button
          onClick={() => setLowStock(v => !v)}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 border text-[9px] font-bold uppercase tracking-widest transition-colors',
            lowStock
              ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
              : 'border-[#1A1A1A]/20 text-[#5f5e59] hover:border-[#1A1A1A]/40'
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
          onClick={() => setShowDisabled(v => !v)}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 border text-[9px] font-bold uppercase tracking-widest transition-colors',
            showDisabled
              ? 'border-[#1A1A1A]/40 bg-[#E5E1D8]/60 text-[#1A1A1A]'
              : 'border-[#1A1A1A]/20 text-[#5f5e59] hover:border-[#1A1A1A]/40'
          )}
        >
          {showDisabled ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
          Deshabilitados
          {totalDisabled > 0 && (
            <span className="ml-0.5 text-[8px] font-mono">({totalDisabled})</span>
          )}
        </button>

        <div className="flex-1" />

        {/* Summary */}
        <p className="text-[10px] font-mono text-[#5f5e59]">
          {filtered.length} / {totalActive} lotes activos
        </p>

        {/* View toggle */}
        <div className="flex border border-[#1A1A1A]/20">
          <button
            onClick={() => switchView('table')}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors',
              view === 'table'
                ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                : 'text-[#5f5e59] hover:bg-[#E5E1D8]/60'
            )}
          >
            <LayoutList className="size-3" />
            Lista
          </button>
          <button
            onClick={() => switchView('group')}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors border-l border-[#1A1A1A]/20',
              view === 'group'
                ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                : 'text-[#5f5e59] hover:bg-[#E5E1D8]/60'
            )}
          >
            <Layers className="size-3" />
            Grupo
          </button>
        </div>
      </div>

      {/* ── View ────────────────────────────────────────────────────────────── */}
      {view === 'table' ? (
        <InkLotsTableView
          lots={filtered}
          canManage={canManage}
          canRequest={canRequest}
          onHistory={openHistory}
          onRequest={openRequest}
          onLotDisabled={refetch}
        />
      ) : (
        <InkCatalogGroupView
          lots={filtered}
          canManage={canManage}
          canRequest={canRequest}
          onHistory={openHistory}
          onRequest={openRequest}
          onLotDisabled={refetch}
        />
      )}

      {/* ── Sheets ──────────────────────────────────────────────────────────── */}
      <InkLotHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        inventoryId={historyLotId}
      />

      <InkRequisitionSheet
        open={requisitionOpen}
        onClose={() => { setRequisitionOpen(false); refetch() }}
        preselectedInk={selectedLot?.ink_catalog ?? null}
        availableLots={lots as InkLot[]}
      />
    </>
  )
}
