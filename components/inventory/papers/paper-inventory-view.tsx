'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LayoutList, Layers, Search, X, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPaperInventory, type PaperLot } from '@/actions/paper-inventory.actions'
import { PaperLotsTableView }    from './paper-lots-table-view'
import { PaperCatalogGroupView } from './paper-catalog-group-view'
import { PaperLotHistorySheet }  from './paper-lot-history-sheet'
import { PaperRequisitionSheet } from './paper-requisition-sheet'

type View = 'table' | 'group'

type Props = {
  initialLots: PaperLot[]
  canManage:   boolean
  canRequest:  boolean
}

export function PaperInventoryView({ initialLots, canManage, canRequest }: Props) {
  const [view, setView] = useState<View>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('paper-inv-view') as View) ?? 'table'
    }
    return 'table'
  })
  const [search,       setSearch]       = useState('')
  const [lowStock,     setLowStock]     = useState(false)
  const [showDisabled, setShowDisabled] = useState(false)

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

  function switchView(v: View) {
    setView(v)
    localStorage.setItem('paper-inv-view', v)
  }

  function openHistory(id: number) {
    setHistoryLotId(id)
    setHistoryOpen(true)
  }

  function openRequest(lot: PaperLot) {
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

  const totalActive   = (lots as PaperLot[]).filter(l => l.enabled).length
  const totalDisabled = (lots as PaperLot[]).filter(l => !l.enabled).length
  const lowStockCount = (lots as PaperLot[]).filter(l => {
    const min = l.paper_catalog?.min_stock_m2 ?? 0
    return l.enabled && (l.remaining_m2 ?? 0) < min
  }).length

  return (
    <>
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">

        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#5f5e59]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar bobina, papel…"
            className="w-full h-8 pl-8 pr-8 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-sm outline-none focus:border-[#1A1A1A]/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5f5e59] hover:text-[#1A1A1A]">
              <X className="size-3.5" />
            </button>
          )}
        </div>

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
          Deshabilitadas
          {totalDisabled > 0 && (
            <span className="ml-0.5 text-[8px] font-mono">({totalDisabled})</span>
          )}
        </button>

        <div className="flex-1" />

        <p className="text-[10px] font-mono text-[#5f5e59]">
          {filtered.length} / {totalActive} bobinas activas
        </p>

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
            Por bobina
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
            Por papel
          </button>
        </div>
      </div>

      {/* ── View ────────────────────────────────────────────────────────────── */}
      {view === 'table' ? (
        <PaperLotsTableView
          lots={filtered}
          canManage={canManage}
          canRequest={canRequest}
          onHistory={openHistory}
          onRequest={openRequest}
          onLotDisabled={refetch}
        />
      ) : (
        <PaperCatalogGroupView
          lots={filtered}
          canManage={canManage}
          canRequest={canRequest}
          onHistory={openHistory}
          onRequest={openRequest}
          onLotDisabled={refetch}
        />
      )}

      {/* ── Sheets ──────────────────────────────────────────────────────────── */}
      <PaperLotHistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        inventoryId={historyLotId}
      />

      <PaperRequisitionSheet
        open={requisitionOpen}
        onClose={() => { setRequisitionOpen(false); refetch() }}
        preselectedPaper={selectedLot?.paper_catalog ?? null}
        availableLots={lots as PaperLot[]}
      />
    </>
  )
}
