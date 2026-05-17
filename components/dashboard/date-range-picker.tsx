'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, ChevronDown } from 'lucide-react'
import { format, subDays, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import type { DateRange } from '@/types/dashboard.types'
import type { DateRange as DPRange } from 'react-day-picker'

const STORAGE_KEY = 'dashboard-date-range'

type Preset = '7d' | '30d' | '3m' | 'custom'

function makePresetRange(preset: Preset): DateRange | null {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  if (preset === '7d')  return { start: subDays(end, 6),   end }
  if (preset === '30d') return { start: subDays(end, 29),  end }
  if (preset === '3m')  return { start: subMonths(end, 3), end }
  return null
}

function defaultRange(): DateRange {
  return makePresetRange('7d')!
}

function loadFromStorage(): { range: DateRange; preset: Preset } {
  if (typeof window === 'undefined') return { range: defaultRange(), preset: '7d' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { range: defaultRange(), preset: '7d' }
    const { start, end, preset } = JSON.parse(raw)
    return { range: { start: new Date(start), end: new Date(end) }, preset: preset ?? 'custom' }
  } catch {
    return { range: defaultRange(), preset: '7d' }
  }
}

export function DateRangePicker({ onRangeChange }: { onRangeChange: (range: DateRange) => void }) {
  const [preset, setPreset]     = useState<Preset>('7d')
  const [range, setRange]       = useState<DateRange>(defaultRange)
  const [open, setOpen]         = useState(false)
  const [calRange, setCalRange] = useState<DPRange | undefined>()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = loadFromStorage()
    setRange(saved.range)
    setPreset(saved.preset)
    setCalRange({ from: saved.range.start, to: saved.range.end })
    onRangeChange(saved.range)
    setHydrated(true)
  }, [])

  function applyPreset(p: Preset) {
    const r = makePresetRange(p)
    if (!r) return
    setPreset(p)
    setRange(r)
    setCalRange({ from: r.start, to: r.end })
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ start: r.start.toISOString(), end: r.end.toISOString(), preset: p }))
    onRangeChange(r)
  }

  function applyCustomRange(dpRange: DPRange | undefined) {
    setCalRange(dpRange)
    if (!dpRange?.from || !dpRange?.to) return
    const r: DateRange = { start: dpRange.from, end: dpRange.to }
    setPreset('custom')
    setRange(r)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ start: r.start.toISOString(), end: r.end.toISOString(), preset: 'custom' }))
    onRangeChange(r)
    setOpen(false)
  }

  if (!hydrated) return null

  const label = preset === 'custom'
    ? `${format(range.start, 'dd MMM', { locale: es })} – ${format(range.end, 'dd MMM yyyy', { locale: es })}`
    : preset === '7d' ? 'Últimos 7 días' : preset === '30d' ? 'Últimos 30 días' : 'Últimos 3 meses'

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/40 mr-1">Rango</span>

      {(['7d', '30d', '3m'] as const).map(p => (
        <button
          key={p}
          onClick={() => applyPreset(p)}
          className={cn(
            'h-7 px-3 text-[9px] font-bold uppercase tracking-widest transition-colors',
            preset === p
              ? 'bg-foreground text-background'
              : 'bg-muted text-foreground/60 hover:text-foreground'
          )}
        >
          {p === '7d' ? '7d' : p === '30d' ? '30d' : '3m'}
        </button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'h-7 px-3 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors',
              preset === 'custom'
                ? 'bg-foreground text-background'
                : 'bg-muted text-foreground/60 hover:text-foreground'
            )}
          >
            <CalendarIcon className="size-3" />
            {preset === 'custom' ? label : 'Custom'}
            <ChevronDown className="size-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-background border border-border rounded-none shadow-xl" align="end">
          <Calendar
            mode="range"
            selected={calRange}
            onSelect={applyCustomRange}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
