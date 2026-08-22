'use client'

import { useState, useRef, useCallback } from 'react'
import { Search, X, Loader2, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmbedded, toolbarStickyClass } from '@/lib/embedded-context'
import { ToolbarHoverMenu, EmbeddedSummaryChip } from '@/components/shared/toolbar-hover-menu'
import { PendingQualityList } from '@/components/receipts/pending-quality-list'
import { ReceiptsHistory } from '@/components/receipts/receipts-history'
import type { InkReceiptWithContext, PaperReceiptWithContext } from '@/actions/receipts.actions'

type Tab          = 'pending' | 'history'
type QualityValue = 'APPROVED' | 'REJECTED' | 'CONDITIONAL'

const BULK_OPTIONS: { value: QualityValue; label: string; activeCls: string }[] = [
  { value: 'APPROVED',    label: 'Aprobado',    activeCls: 'bg-green-600 text-white' },
  { value: 'REJECTED',    label: 'Rechazado',   activeCls: 'bg-red-600 text-white' },
  { value: 'CONDITIONAL', label: 'Condicional', activeCls: 'bg-orange-500 text-white' },
]

const QUALITY_FILTERS = [
  { value: '',            label: 'Todos' },
  { value: 'PENDING',     label: 'Pendiente' },
  { value: 'APPROVED',    label: 'Aprobado' },
  { value: 'REJECTED',    label: 'Rechazado' },
  { value: 'CONDITIONAL', label: 'Condicional' },
]

const TYPE_FILTERS = [
  { value: '',      label: 'Todos' },
  { value: 'INK',   label: 'Tinta' },
  { value: 'PAPER', label: 'Papel' },
]

type Props = {
  statsBar:         React.ReactNode
  defaultMaterial?: 'INK' | 'PAPER'
  canEdit:          boolean
  initialPending:   { inkReceipts: InkReceiptWithContext[]; paperReceipts: PaperReceiptWithContext[] }
  initialHistory:   { inkReceipts: InkReceiptWithContext[]; paperReceipts: PaperReceiptWithContext[] }
  alert?:           React.ReactNode
}

export function ReceiptsPageTabs({
  statsBar,
  defaultMaterial,
  canEdit,
  initialPending,
  initialHistory,
  alert,
}: Props) {
  const [tab,           setTab]           = useState<Tab>('pending')
  const [search,        setSearch]        = useState('')
  const [bulkQuality,   setBulkQuality]   = useState<QualityValue | null>(null)
  const [bulkSaving,    setBulkSaving]    = useState(false)
  const [qualityFilter, setQualityFilter] = useState('')
  const [typeFilter,    setTypeFilter]    = useState(defaultMaterial ?? '')
  const [pageSize,      setPageSize]      = useState(15)
  const [pageSizeInput, setPageSizeInput] = useState('15')

  const embedded = useEmbedded()

  const pendingRef = useRef<{ applyBulk: () => Promise<void> }>(null)

  const handleBulkSavingChange = useCallback((v: boolean) => setBulkSaving(v), [])
  const handleBulkDone         = useCallback(() => setBulkQuality(null), [])

  const pendingCount = defaultMaterial === 'INK'
    ? initialPending.inkReceipts.length
    : defaultMaterial === 'PAPER'
    ? initialPending.paperReceipts.length
    : initialPending.inkReceipts.length + initialPending.paperReceipts.length

  // Page size — inline on full pages, tucked into the "Controles" dropdown when embedded.
  const pageSizeControl = (
    <div id="receipts-page-size" className="flex items-center gap-1.5 bg-muted/50 px-2.5 h-8">
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
  )

  return (
    <>
      <div className={cn('sticky z-30 bg-background border-b border-border mb-6', toolbarStickyClass(embedded))}>
        <div className="@container">
        <div className={cn(
          'py-3 flex gap-2',
          embedded
            ? 'flex-row flex-wrap items-center'
            : 'flex-col @2xl:flex-row @2xl:items-center @2xl:justify-between @2xl:gap-3',
        )}>

          {/* Search */}
          <div id="receipts-search" className={cn('relative min-w-0', embedded ? 'flex-1' : 'w-full @2xl:w-auto')}>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar lote, material, OC, proveedor…"
              className={cn(
                'h-8 w-full border border-border bg-card pl-8 pr-7 text-xs outline-none focus:border-foreground/40 transition-colors',
                !embedded && '@2xl:w-100',
              )}
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

          {/* Right group: secondary controls + page size + primary tabs */}
          <div className="flex items-center flex-wrap gap-2">

            {/* Dynamic secondary controls */}
            {tab === 'pending' && (
              <>
                <div id="receipts-bulk-actions" className="flex gap-0.5 bg-black/4 dark:bg-black/25 p-0.5 shrink-0">
                  {BULK_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setBulkQuality(prev => prev === o.value ? null : o.value)}
                      className={cn(
                        'px-3 h-7 text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap',
                        bulkQuality === o.value ? cn(o.activeCls, 'shadow-sm') : 'text-foreground/50 hover:text-foreground',
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {bulkQuality && (
                  <button
                    onClick={() => pendingRef.current?.applyBulk()}
                    disabled={bulkSaving}
                    className="h-8 px-4 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-30 flex items-center gap-1.5"
                  >
                    {bulkSaving && <Loader2 className="size-3 animate-spin" />}
                    Aplicar
                  </button>
                )}
              </>
            )}

            {tab === 'history' && (
              <>
                {!defaultMaterial && (
                  <div className="flex gap-0.5 bg-black/4 dark:bg-black/25 p-0.5 shrink-0">
                    {TYPE_FILTERS.map(f => (
                      <button
                        key={f.value}
                        onClick={() => setTypeFilter(f.value)}
                        className={cn(
                          'px-3 h-7 text-[10px] font-bold uppercase tracking-widest transition-all',
                          typeFilter === f.value ? 'bg-card text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground',
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
                <div id="receipts-quality-filter" className="flex gap-0.5 bg-black/4 dark:bg-black/25 p-0.5 shrink-0">
                  {QUALITY_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setQualityFilter(f.value)}
                      className={cn(
                        'px-3 h-7 text-[10px] font-bold uppercase tracking-widest transition-all',
                        qualityFilter === f.value ? 'bg-card text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground',
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {embedded ? (
              <>
                <EmbeddedSummaryChip>{statsBar}</EmbeddedSummaryChip>
                <ToolbarHoverMenu label="Controles" icon={Settings2} iconOnly>
                  <div className="flex flex-col items-start gap-2.5">
                    {pageSizeControl}
                  </div>
                </ToolbarHoverMenu>
              </>
            ) : (
              <>
                {pageSizeControl}
              </>
            )}

            {/* Primary tabs */}
            <div id="receipts-tabs" className="flex border border-border shrink-0">
              <button
                onClick={() => setTab('pending')}
                className={cn(
                  'px-4 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2',
                  tab === 'pending' ? 'bg-foreground text-background' : 'text-foreground/50 hover:text-foreground',
                )}
              >
                Pendientes
                {pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center size-4 rounded-full bg-yellow-500 text-white text-[9px] font-bold">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab('history')}
                className={cn(
                  'px-4 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors border-l border-border',
                  tab === 'history' ? 'bg-foreground text-background' : 'text-foreground/50 hover:text-foreground',
                )}
              >
                Historial
              </button>
            </div>
          </div>
        </div>

        {!embedded && (
          <div className="py-3">
            {statsBar}
          </div>
        )}
        </div>
      </div>

      {alert}

      {tab === 'pending' ? (
        <PendingQualityList
          ref={pendingRef}
          key="pending"
          initialInk={initialPending.inkReceipts}
          initialPaper={initialPending.paperReceipts}
          defaultMaterial={defaultMaterial}
          search={search}
          pageSize={pageSize}
          bulkQuality={bulkQuality}
          onBulkSavingChange={handleBulkSavingChange}
          onBulkDone={handleBulkDone}
        />
      ) : (
        <ReceiptsHistory
          key="history"
          initialInk={initialHistory.inkReceipts}
          initialPaper={initialHistory.paperReceipts}
          canEdit={canEdit}
          defaultMaterial={defaultMaterial}
          search={search}
          pageSize={pageSize}
          qualityFilter={qualityFilter}
          typeFilter={typeFilter}
        />
      )}
    </>
  )
}
