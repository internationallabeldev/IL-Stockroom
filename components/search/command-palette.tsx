'use client'

import { useEffect, useRef, useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import { globalSearch, type SearchCategory, type SearchResult } from '@/actions/search.actions'
import { SearchResultItem } from './search-result-item'

const QUICK_LINKS: SearchResult[] = [
  { id: 'ql-providers',   type: 'provider',       title: 'Proveedores',                url: '/dashboard/providers' },
  { id: 'ql-ink-cat',    type: 'ink_catalog',    title: 'Catálogo de Tintas',          url: '/dashboard/catalog/inks' },
  { id: 'ql-paper-cat',  type: 'paper_catalog',  title: 'Catálogo de Papel',           url: '/dashboard/catalog/papers' },
  { id: 'ql-ink-inv',    type: 'ink_inventory',  title: 'Inventario — Tintas',         url: '/dashboard/inventory/inks' },
  { id: 'ql-paper-inv',  type: 'paper_inventory',title: 'Inventario — Papel',          url: '/dashboard/inventory/paper' },
  { id: 'ql-orders-ink', type: 'purchase_order', title: 'Órdenes de compra — Tintas', url: '/dashboard/orders/ink' },
  { id: 'ql-req',        type: 'requisition',    title: 'Requisiciones de producción', url: '/dashboard/requisitions' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<SearchCategory[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flatResults: SearchResult[] = query.length >= 2
    ? categories.flatMap(c => c.results)
    : QUICK_LINKS

  const navigate = useCallback((url: string) => {
    onClose()
    router.push(url)
  }, [onClose, router])

  // Focus input on open, reset state on close
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setCategories([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setCategories([])
      setSelectedIndex(0)
      return
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const results = await globalSearch(query)
        setCategories(results)
        setSelectedIndex(0)
      })
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && flatResults[selectedIndex]) {
        navigate(flatResults[selectedIndex].url)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, flatResults, selectedIndex, navigate, onClose])

  if (!isOpen) return null

  const hasQuery = query.length >= 2
  const hasResults = categories.length > 0

  const kbdCls = 'rounded border border-border bg-foreground/6 px-1 py-0.5 font-mono'

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center pt-24"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/25 dark:bg-gray-700/40 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-xl border border-border bg-background shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-2 border-b border-border px-4">
          {isPending
            ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
            : <Search className="size-4 shrink-0 text-muted-foreground" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar en el sistema..."
            className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setCategories([]) }}
              className="flex size-5 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
          <kbd className={`hidden shrink-0 px-1.5 text-[10px] font-medium text-muted-foreground sm:block ${kbdCls}`}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-105 overflow-y-auto py-2">
          {/* No query → quick links */}
          {!hasQuery && (
            <>
              <p className="px-4 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Accesos rápidos
              </p>
              {QUICK_LINKS.map((r, i) => (
                <SearchResultItem
                  key={r.id}
                  result={r}
                  isSelected={selectedIndex === i}
                  onClick={() => navigate(r.url)}
                  onMouseEnter={() => setSelectedIndex(i)}
                />
              ))}
            </>
          )}

          {/* Has query, loading, no results yet */}
          {hasQuery && isPending && !hasResults && (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              Buscando...
            </div>
          )}

          {/* Has query, done, no results */}
          {hasQuery && !isPending && !hasResults && (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              Sin resultados para &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Categorized results */}
          {hasResults && (() => {
            let globalIdx = 0
            return categories.map(category => (
              <div key={category.label}>
                <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {category.label}
                </p>
                {category.results.map(result => {
                  const idx = globalIdx++
                  return (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      isSelected={selectedIndex === idx}
                      onClick={() => navigate(result.url)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    />
                  )
                })}
              </div>
            ))
          })()}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2">
          <span className="text-[10px] text-muted-foreground">
            <kbd className={kbdCls}>↑↓</kbd>
            {' '}navegar
          </span>
          <span className="text-[10px] text-muted-foreground">
            <kbd className={kbdCls}>↵</kbd>
            {' '}ir
          </span>
          <span className="text-[10px] text-muted-foreground">
            <kbd className={kbdCls}>Ctrl K</kbd>
            {' '}abrir/cerrar
          </span>
        </div>
      </div>
    </div>
  )
}
