import {
  Building2,
  Droplet,
  FileText,
  Package,
  ShoppingCart,
  ClipboardList,
  ArrowRightFromLine,
  Boxes,
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
  supply: <Boxes className="size-3.5" />,
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
        isSelected ? 'bg-foreground/8' : 'hover:bg-foreground/4'
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
        {TYPE_ICON[result.type]}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-foreground">
          {result.title}
        </span>
        {result.subtitle && (
          <span className="block truncate text-[11px] text-muted-foreground">
            {result.subtitle}
          </span>
        )}
      </span>

      {result.badge && (
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {result.badge}
        </span>
      )}
    </button>
  )
}
