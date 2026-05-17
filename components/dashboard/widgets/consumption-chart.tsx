'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingUp } from 'lucide-react'
import { getConsumptionData } from '@/actions/dashboard.actions'
import type { DateRange } from '@/types/dashboard.types'

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border border-border px-3 py-2 shadow-lg">
      <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/50 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-[10px]">
          <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-foreground/60 truncate max-w-30">{p.name}</span>
          <span className="font-mono font-bold ml-auto pl-2">
            {Number(p.value).toLocaleString('es-MX', { maximumFractionDigits: 2 })} {unit}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ConsumptionChart({
  materialType,
  dateRange,
}: {
  materialType: 'INK' | 'PAPER'
  dateRange: DateRange
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['consumption', materialType, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn:  () => getConsumptionData(dateRange),
    refetchInterval: 30_000,
  })

  const result    = materialType === 'INK' ? data?.ink : data?.paper
  const points    = result?.points    ?? []
  const materials = result?.materials ?? []
  const unit      = materialType === 'INK' ? 'kg' : 'm²'

  const formattedPoints = points.map(p => ({
    ...p,
    dateLabel: (() => {
      try { return format(parseISO(p.date as string), 'dd/MM', { locale: es }) }
      catch { return p.date as string }
    })(),
  }))

  return (
    <div className="bg-card border border-border p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="size-3.5 text-foreground/60" />
        <h3 className="text-[10px] font-bold uppercase tracking-widest">
          Consumo de {materialType === 'INK' ? 'tintas' : 'papel'}
        </h3>
        <span className="text-[9px] text-foreground/40 uppercase tracking-wider">{unit}</span>
      </div>

      {isLoading ? (
        <div className="h-48 bg-muted animate-pulse" />
      ) : points.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center gap-2">
          <TrendingUp className="size-6 text-foreground/15" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/30">
            Sin datos en el período seleccionado
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={formattedPoints} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {materials.map(m => (
                <linearGradient key={m.name} id={`grad-${m.name.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={m.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={m.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 9, fill: 'currentColor', fontFamily: 'var(--font-sans)', fontWeight: 700, letterSpacing: 1, fillOpacity: 0.5 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: 'currentColor', fontFamily: 'var(--font-sans)', fontWeight: 700, fillOpacity: 0.5 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            {materials.length > 1 && (
              <Legend
                wrapperStyle={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}
              />
            )}
            {materials.map(m => (
              <Area
                key={m.name}
                type="monotone"
                dataKey={m.name}
                stroke={m.color}
                strokeWidth={1.5}
                fill={`url(#grad-${m.name.replace(/\s/g, '')})`}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
