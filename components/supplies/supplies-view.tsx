'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Search,
  X,
  Package,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Layers,
  TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getSupplyCategories } from '@/actions/supplies.actions'
import { type SupplyCategoryWithItems, type SupplyItemWithStatus } from '@/lib/supplies/types'
import { SupplyItemRow } from './supply-item-row'
import { SupplyItemForm } from './supply-item-form'
import { SupplyCategoryForm } from './supply-category-form'
import { DataRefresh } from '@/components/shared/data-refresh'

type StatusFilter = 'all' | 'critical' | 'warning' | 'ok'

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',      label: 'Todos' },
  { value: 'critical', label: 'Críticos' },
  { value: 'warning',  label: 'Por agotarse' },
  { value: 'ok',       label: 'Ok' },
]

function SuppliesStatsBar({ categories }: { categories: SupplyCategoryWithItems[] }) {
  const totals = categories.reduce(
    (acc, cat) => {
      acc.ok       += cat.counts.ok
      acc.warning  += cat.counts.warning
      acc.critical += cat.counts.critical + cat.counts.empty
      acc.items    += cat.items.length
      return acc
    },
    { ok: 0, warning: 0, critical: 0, items: 0 }
  )

  const categoryCount = categories.length
  const totalTracked  = totals.ok + totals.warning + totals.critical

  // Most affected category (highest critical+warning ratio)
  const worstCategory = categories
    .filter(c => c.items.length > 0)
    .map(c => ({
      cat:   c,
      risky: c.counts.critical + c.counts.empty + c.counts.warning,
    }))
    .sort((a, b) => b.risky - a.risky)[0]

  const items = [
    { icon: Package,       label: 'Items',         value: totals.items,    accent: null as 'red' | 'yellow' | 'green' | null },
    { icon: AlertOctagon,  label: 'Críticos',      value: totals.critical, accent: totals.critical > 0 ? 'red'    as const : null },
    { icon: AlertTriangle, label: 'Por agotarse',  value: totals.warning,  accent: totals.warning  > 0 ? 'yellow' as const : null },
    { icon: CheckCircle2,  label: 'Ok',            value: totals.ok,       accent: totals.ok       > 0 ? 'green'  as const : null },
    { icon: Layers,        label: 'Categorías',    value: categoryCount,   accent: null as 'red' | 'yellow' | 'green' | null },
  ]

  const accentClass = (a: 'red' | 'yellow' | 'green' | null) =>
    a === 'red'    ? 'text-red-500' :
    a === 'yellow' ? 'text-yellow-500' :
    a === 'green'  ? 'text-green-500' :
                     'text-muted-foreground/50'

  const valueClass = (a: 'red' | 'yellow' | 'green' | null) =>
    a === 'red'    ? 'text-red-500' :
    a === 'yellow' ? 'text-yellow-600' :
    a === 'green'  ? 'text-green-600' :
                     'text-foreground/80'

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
      {items.map(({ icon: Icon, label, value, accent }, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <span className="text-border/60 select-none hidden sm:inline">·</span>}
          <Icon className={cn('size-3 shrink-0', accentClass(accent))} />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">{label}</span>
          <span className={cn('text-[11px] font-bold tabular-nums', valueClass(accent))}>
            {value}
          </span>
        </div>
      ))}

      {/* Distribution mini stacked bar */}
      {totalTracked > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden sm:inline">·</span>
          <Layers className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">Distribución</span>
          <div className="flex h-1.5 w-14 overflow-hidden rounded-full gap-px">
            <div className="bg-red-500 transition-all"    style={{ width: `${(totals.critical / totalTracked) * 100}%` }} />
            <div className="bg-yellow-400 transition-all" style={{ width: `${(totals.warning  / totalTracked) * 100}%` }} />
            <div className="bg-green-500 transition-all"  style={{ width: `${(totals.ok       / totalTracked) * 100}%` }} />
          </div>
          <span className="text-[11px] font-bold tabular-nums text-red-500">{totals.critical}</span>
          <span className="text-[9px] text-muted-foreground/40">·</span>
          <span className="text-[11px] font-bold tabular-nums text-yellow-600">{totals.warning}</span>
          <span className="text-[9px] text-muted-foreground/40">·</span>
          <span className="text-[11px] font-bold tabular-nums text-green-600">{totals.ok}</span>
        </div>
      )}

      {/* Most affected category */}
      {worstCategory && worstCategory.risky > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden sm:inline">·</span>
          <TrendingDown className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">Crítica</span>
          <span className="text-[11px] font-bold tabular-nums text-foreground/80 max-w-30 truncate">
            {worstCategory.cat.name}
          </span>
          <span className="text-[10px] text-red-500 tabular-nums">{worstCategory.risky}</span>
        </div>
      )}
    </div>
  )
}

function CategorySection({
  category,
  filter,
  search,
  canEdit,
  onEditItem,
  onEditCategory,
  onNewItem,
}: {
  category: SupplyCategoryWithItems
  filter: StatusFilter
  search: string
  canEdit: boolean
  onEditItem: (item: SupplyItemWithStatus) => void
  onEditCategory: (cat: SupplyCategoryWithItems) => void
  onNewItem: (categoryId: number) => void
}) {
  const [open, setOpen] = useState(true)

  const q = search.toLowerCase().trim()

  const filteredItems = category.items.filter(item => {
    const matchesStatus =
      filter === 'critical' ? (item.status === 'critical' || item.status === 'empty') :
      filter === 'warning'  ? item.status === 'warning' :
      filter === 'ok'       ? item.status === 'ok' :
      true
    if (!matchesStatus) return false
    if (!q) return true
    return (
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.provider?.name.toLowerCase().includes(q)
    )
  })

  // Hide only when a filter/search is active and produces no matches
  if (filteredItems.length === 0 && (q || filter !== 'all')) return null

  // Force-expand when there's an active search or status filter
  const isOpen = q || filter !== 'all' ? true : open

  const accentColor = category.color ?? undefined

  return (
    <div id={`category-${category.id}`} className="bg-card border border-border">
      {/* Category header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
        style={accentColor ? { borderLeft: `3px solid ${accentColor}` } : { borderLeft: '3px solid transparent' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isOpen ? <ChevronDown className="size-3.5 text-foreground/40 shrink-0" /> : <ChevronRight className="size-3.5 text-foreground/40 shrink-0" />}
          <span className="text-[11px] font-bold uppercase tracking-widest truncate">{category.name}</span>
          {category.description && (
            <span className="text-[9px] text-foreground/40 hidden sm:inline truncate">{category.description}</span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
          {/* Count badges */}
          <div className="flex items-center gap-1.5">
            {(category.counts.critical + category.counts.empty) > 0 && (
              <span className="size-5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[9px] font-bold flex items-center justify-center tabular-nums">
                {category.counts.critical + category.counts.empty}
              </span>
            )}
            {category.counts.warning > 0 && (
              <span className="size-5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-[9px] font-bold flex items-center justify-center tabular-nums">
                {category.counts.warning}
              </span>
            )}
            <span className="text-[9px] text-foreground/30 tabular-nums">{category.items.length} items</span>
          </div>

          {canEdit && (
            <TooltipProvider delayDuration={300}>
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onNewItem(category.id)}
                      className="size-7 flex items-center justify-center text-foreground/30 hover:text-foreground transition-colors"
                    >
                      <Plus className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[10px]">
                    Agregar item a {category.name}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onEditCategory(category)}
                      className="size-7 flex items-center justify-center text-foreground/30 hover:text-foreground transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[10px]">
                    Editar categoría
                  </TooltipContent>
                </Tooltip>
              </>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Items table */}
      {isOpen && (
        <div className="border-t border-border">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/30">Sin items en esta categoría</p>
            </div>
          ) : (
            <table className="w-full" id={`supplies-table-${category.id}`}>
              <thead>
                <tr className="border-b border-border/50">
                  <th className="py-1.5 pl-3 pr-2 w-6" />
                  <th className="py-1.5 pr-3 w-10" />
                  <th className="py-1.5 pr-4 text-left text-[8px] font-bold uppercase tracking-widest text-foreground/30">Item</th>
                  <th className="py-1.5 pr-4 w-40 text-left text-[8px] font-bold uppercase tracking-widest text-foreground/30">Stock</th>
                  <th className="py-1.5 pr-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <SupplyItemRow
                    key={item.id}
                    item={item}
                    canEdit={canEdit}
                    onEdit={onEditItem}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

type Props = {
  categories: SupplyCategoryWithItems[]
  canEdit: boolean
}

export function SuppliesView({ categories: initialCategories, canEdit }: Props) {
  const [filter, setFilter]           = useState<StatusFilter>('all')
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(0)
  const [pageSize, setPageSize]       = useState(5)
  const [categoryForm, setCategoryForm] = useState<{ open: boolean; category: SupplyCategoryWithItems | null }>({
    open: false, category: null,
  })
  const [itemForm, setItemForm] = useState<{
    open: boolean
    item: SupplyItemWithStatus | null
    defaultCategoryId?: number
  }>({ open: false, item: null })

  const { data: categories = initialCategories, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey:       ['supply-categories'],
    queryFn:        getSupplyCategories,
    initialData:    initialCategories,
    refetchInterval: 30_000,
  })

  const openNewItem    = (categoryId?: number) => setItemForm({ open: true, item: null, defaultCategoryId: categoryId })
  const openEditItem   = (item: SupplyItemWithStatus) => setItemForm({ open: true, item, defaultCategoryId: undefined })
  const openEditCat    = (cat: SupplyCategoryWithItems) => setCategoryForm({ open: true, category: cat })
  const openNewCat     = () => setCategoryForm({ open: true, category: null })

  // Reset to first page when filter, search or page size changes
  useEffect(() => { setPage(0) }, [filter, search, pageSize])

  const filterCounts: Record<StatusFilter, number> = categories.reduce(
    (acc, cat) => {
      acc.all      += cat.items.length
      acc.critical += cat.counts.critical + cat.counts.empty
      acc.warning  += cat.counts.warning
      acc.ok       += cat.counts.ok
      return acc
    },
    { all: 0, critical: 0, warning: 0, ok: 0 }
  )

  // Pre-filter to determine which categories are actually visible
  const q = search.toLowerCase().trim()
  const visibleCategories = categories.filter(cat => {
    const hasMatchingItems = cat.items.some(item => {
      const matchesStatus =
        filter === 'critical' ? (item.status === 'critical' || item.status === 'empty') :
        filter === 'warning'  ? item.status === 'warning' :
        filter === 'ok'       ? item.status === 'ok' :
        true
      if (!matchesStatus) return false
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.provider?.name.toLowerCase().includes(q)
      )
    })
    // Show empty categories when no filter/search active
    return (q || filter !== 'all') ? hasMatchingItems : true
  })

  const totalPages      = Math.ceil(visibleCategories.length / pageSize)
  const pagedCategories = visibleCategories.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <>
      {/* Toolbar — providers-style: sticky, two rows */}
      <div className="sticky top-16 z-30 bg-background border-b border-border -mx-8 px-8 mb-6">
        <div className="py-3 flex flex-wrap justify-between items-center gap-3">
          {/* Search */}
          <div className="relative" id="supplies-search">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar item, descripción o proveedor..."
              className="h-8 w-100 border border-border bg-card pl-8 pr-7 text-xs outline-none focus:border-foreground/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="gap-2 flex flex-row">
            {/* Status filter */}
            <div className="flex border border-border" id="supplies-status-filter">
              {FILTER_OPTIONS.map(f => {
                const count    = filterCounts[f.value]
                const isActive = filter === f.value
                const isEmpty  = f.value !== 'all' && count === 0
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    disabled={isEmpty}
                    className={cn(
                      'flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors border-l border-border first:border-l-0',
                      isActive
                        ? 'bg-foreground text-background'
                        : isEmpty
                          ? 'text-foreground/20 cursor-not-allowed'
                          : 'text-foreground/50 hover:text-foreground',
                    )}
                  >
                    {f.label}
                    {f.value !== 'all' && (
                      <span className={cn(
                        'text-[9px] tabular-nums font-bold',
                        isActive ? 'text-background/60' : isEmpty ? 'text-foreground/20' : 'text-foreground/30'
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex-1" />

            <DataRefresh updatedAt={dataUpdatedAt} isFetching={isFetching} onRefresh={() => refetch()} />

            {canEdit && (
              <>
                <button
                  id="supplies-new-category-btn"
                  onClick={openNewCat}
                  className="flex items-center gap-2 h-8 px-3 border border-border text-[10px] font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  <Plus className="size-3.5" />
                  Categoría
                </button>

                <button
                  id="supplies-new-item-btn"
                  onClick={() => openNewItem()}
                  disabled={categories.length === 0}
                  className="flex items-center gap-2 h-8 px-4 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="size-3.5" />
                  Nuevo item
                </button>
              </>
            )}
          </div>
        </div>

        <div className="py-3">
          <SuppliesStatsBar categories={categories} />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3" id="supplies-categories">
        {categories.length === 0 ? (
          <div className="border border-dashed border-border p-16 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Aún no hay categorías de consumibles
            </p>
            {canEdit && (
              <button
                onClick={openNewCat}
                className="mt-4 flex items-center gap-2 h-8 px-4 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity mx-auto"
              >
                <Plus className="size-3.5" />
                Crear primera categoría
              </button>
            )}
          </div>
        ) : (
          pagedCategories.map(cat => (
            <CategorySection
              key={cat.id}
              category={cat}
              filter={filter}
              search={search}
              canEdit={canEdit}
              onEditItem={openEditItem}
              onEditCategory={openEditCat}
              onNewItem={openNewItem}
            />
          ))
        )}
      </div>

      {/* Paginator */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-foreground/40 tabular-nums">
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, visibleCategories.length)} de {visibleCategories.length} categorías
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-foreground/30 uppercase tracking-widest">Mostrar</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="h-7 border border-border bg-background px-2 text-[10px] font-bold outline-none focus:border-foreground/40 transition-colors"
              >
                {[5, 10, 20, 50].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center border border-border">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="h-8 px-3 text-[10px] font-bold text-foreground/40 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors border-r border-border"
            >
              «
            </button>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 px-3 text-[10px] font-bold text-foreground/40 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors border-r border-border"
            >
              ‹ Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  'h-8 px-3 text-[10px] font-bold tabular-nums transition-colors border-r border-border last:border-r-0',
                  i === page
                    ? 'bg-foreground text-background'
                    : 'text-foreground/40 hover:text-foreground'
                )}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-8 px-3 text-[10px] font-bold text-foreground/40 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors border-l border-border"
            >
              Siguiente ›
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="h-8 px-3 text-[10px] font-bold text-foreground/40 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors border-l border-border"
            >
              »
            </button>
          </div>
        </div>
      )}


      {/* Modals */}
      <SupplyCategoryForm
        open={categoryForm.open}
        onClose={() => setCategoryForm({ open: false, category: null })}
        category={categoryForm.category}
      />

      <SupplyItemForm
        open={itemForm.open}
        onClose={() => setItemForm({ open: false, item: null })}
        categories={categories}
        item={itemForm.item}
        defaultCategoryId={itemForm.defaultCategoryId}
      />
    </>
  )
}
