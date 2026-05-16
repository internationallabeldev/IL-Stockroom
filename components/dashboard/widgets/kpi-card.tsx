import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
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
}

const colorMap: Record<Color, string> = {
  default: 'text-[#1A1A1A]',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger:  'text-[#ba1a1a]',
}

const borderMap: Record<Color, string> = {
  default: 'border-[#1A1A1A]/10',
  success: 'border-green-500',
  warning: 'border-yellow-500',
  danger:  'border-[#ba1a1a]',
}

export function KpiCard({ title, value, unit, trend, icon, color = 'default', loading }: KpiCardProps) {
  return (
    <div className={cn(
      'bg-[#fdf9f0] border border-[#1A1A1A]/10 border-l-2 p-5 flex flex-col gap-3',
      borderMap[color]
    )}>
      <div className="flex items-start justify-between">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/50">{title}</p>
        {icon && <span className="text-[#1A1A1A]/30">{icon}</span>}
      </div>

      {loading ? (
        <div className="h-8 w-20 bg-[#E5E1D8] animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className={cn('font-heading text-3xl font-bold tracking-tight', colorMap[color])}>
            {typeof value === 'number' ? value.toLocaleString('es-MX') : value}
          </span>
          {unit && (
            <span className="text-sm text-[#1A1A1A]/40 font-normal">{unit}</span>
          )}
        </div>
      )}

      {trend !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest',
          trend > 0 ? 'text-green-600' : trend < 0 ? 'text-[#ba1a1a]' : 'text-[#1A1A1A]/40'
        )}>
          {trend > 0 ? <TrendingUp className="size-3" /> : trend < 0 ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
          {trend > 0 ? '+' : ''}{trend}% vs período anterior
        </div>
      )}
    </div>
  )
}
