import {
  Building2,
  Droplet,
  FileText,
  Package,
  ShoppingCart,
  ClipboardList,
  ArrowRightFromLine,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchResult, SearchResultType } from '@/actions/search.actions'

const TYPE_ICON: Record<SearchResultType, React.ReactNode> = {
  provider: <Building2 className="size-3.5" />,
  ink_catalog: <Droplet className="size-3.5" />,
  paper_catalog: <FileText className="size-3.5" />,
  ink_inventory: <Package className="size-3.5" />,
  paper_inventory: <Package className="size-3.5" />,
  purchase_order: <ShoppingCart className="size-3.5" />,
  requisition: <ClipboardList className="size-3.5" />,
  output: <ArrowRightFromLine className="size-3.5" />,
}

const TYPE_COLOR: Record<SearchResultType, string> = {
  provider: 'bg-blue-100 text-blue-700',
  ink_catalog: 'bg-violet-100 text-violet-700',
  paper_catalog: 'bg-amber-100 text-amber-700',
  ink_inventory: 'bg-violet-50 text-violet-600',
  paper_inventory: 'bg-amber-50 text-amber-600',
  purchase_order: 'bg-emerald-100 text-emerald-700',
  requisition: 'bg-orange-100 text-orange-700',
  output: 'bg-slate-100 text-slate-600',
}

interface Props {
  result: SearchResult
  isSelected: boolean
  onClick: () => void
  onMouseEnter: () => void
}

export function SearchResultItem({ result, isSelected, onClick, onMouseEnter }: Props) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
        isSelected ? 'bg-[#1A1A1A]/8' : 'hover:bg-[#1A1A1A]/4'
      )}
    >
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center',
          TYPE_COLOR[result.type]
        )}
      >
        {TYPE_ICON[result.type]}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-[#1A1A1A]">
          {result.title}
        </span>
        {result.subtitle && (
          <span className="block truncate text-[11px] text-[#1A1A1A]/50">
            {result.subtitle}
          </span>
        )}
      </span>

      {result.badge && (
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#1A1A1A]/40">
          {result.badge}
        </span>
      )}
    </button>
  )
}
