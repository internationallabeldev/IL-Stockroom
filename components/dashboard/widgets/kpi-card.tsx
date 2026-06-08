import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Color = 'default' | 'warning' | 'danger' | 'success'

interface KpiCardProps {
  title: string
  value: number | string
  unit?: string
  trend?: number
  icon?: React.ReactNode
  color?: Color
  loading?: boolean
  /** When set, the card becomes an interactive link to this route. */
  href?: string
}

const valueColor: Record<Color, string> = {
  default: 'text-foreground',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger:  'text-destructive',
}

const accentBorder: Record<Color, string> = {
  default: 'border-l-border',
  success: 'border-l-green-500',
  warning: 'border-l-yellow-500',
  danger:  'border-l-destructive',
}

export function KpiCard({ title, value, unit, trend, icon, color = 'default', loading, href }: KpiCardProps) {
  const interactive = !!href

  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">{title}</p>
        {interactive ? (
          <ArrowUpRight className="size-3.5 text-foreground/25 transition-all group-hover:text-foreground/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        ) : (
          icon && <span className="text-foreground/25">{icon}</span>
        )}
      </div>

      {loading ? (
        <div className="h-7 w-20 bg-muted animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className={cn('font-heading text-2xl font-bold tracking-tight tabular-nums', valueColor[color])}>
            {typeof value === 'number' ? value.toLocaleString('es-MX') : value}
          </span>
          {unit && <span className="text-xs text-foreground/40">{unit}</span>}
        </div>
      )}

      {trend !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest',
          trend > 0 ? 'text-green-600' : trend < 0 ? 'text-destructive' : 'text-foreground/40',
        )}>
          {trend > 0 ? <TrendingUp className="size-3" /> : trend < 0 ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
          {trend > 0 ? '+' : ''}{trend}% vs período anterior
        </div>
      )}
    </>
  )

  const className = cn(
    'group bg-card border border-border border-l-2 px-4 py-3 flex flex-col gap-1.5 transition-colors',
    accentBorder[color],
    interactive && 'hover:border-foreground/30 hover:bg-muted/30 cursor-pointer',
  )

  return interactive
    ? <Link href={href!} className={className}>{content}</Link>
    : <div className={className}>{content}</div>
}
