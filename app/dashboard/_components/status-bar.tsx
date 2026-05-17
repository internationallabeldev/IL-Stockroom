'use client'

import { useEffect, useState } from 'react'
import { Activity, X, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pingDatabase, getSystemStats, type SystemStats } from '@/actions/system-status.actions'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type Indicator = 'none' | 'minor' | 'major' | 'critical'
type CompStatus = 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'under_maintenance'

interface SupabaseComponent { id: string; name: string; status: CompStatus }
interface SupabaseStatusData {
  indicator:   Indicator
  description: string
  components:  SupabaseComponent[]
  incidents:   Array<{ name: string; status: string }>
}

const INDICATOR_DOT: Record<Indicator, string> = {
  none:     'bg-green-500',
  minor:    'bg-yellow-400',
  major:    'bg-orange-500',
  critical: 'bg-red-600',
}

const COMP_DOT: Record<CompStatus, string> = {
  operational:          'bg-green-500',
  degraded_performance: 'bg-yellow-400',
  partial_outage:       'bg-orange-500',
  major_outage:         'bg-red-600',
  under_maintenance:    'bg-blue-400',
}

const COMP_LABEL: Record<CompStatus, string> = {
  operational:          'Operacional',
  degraded_performance: 'Rendimiento degradado',
  partial_outage:       'Interrupción parcial',
  major_outage:         'Caído',
  under_maintenance:    'En mantenimiento',
}

const INDICATOR_DESC: Record<Indicator, string> = {
  none:     'Todos los sistemas operativos',
  minor:    'Interrupción menor en curso',
  major:    'Interrupción mayor en curso',
  critical: 'Interrupción crítica en curso',
}

const CORE_SERVICES = ['Database', 'Auth', 'Storage', 'Realtime', 'Edge Functions', 'API']

function SystemUptime() {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const h = String(Math.floor(secs / 3600)).padStart(3, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return <span className="font-mono text-[11px] tracking-wider">{h}:{m}:{s}</span>
}

type Accent = 'green' | 'amber' | 'red' | 'neutral'

function MetricCard({ label, value, sub, tooltip, accent, loading }: {
  label:   string
  value:   string | number
  sub?:    string
  tooltip: string
  accent:  Accent
  loading?: boolean
}) {
  const valueColor: Record<Accent, string> = {
    green:   'text-green-600',
    amber:   'text-yellow-500',
    red:     'text-red-600',
    neutral: 'text-foreground',
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="bg-muted px-4 py-3 flex flex-col gap-1 cursor-default select-none">
          <p className="text-[8px] font-bold uppercase tracking-widest text-foreground/40 leading-none">{label}</p>
          {loading ? (
            <div className="h-7 w-10 bg-foreground/10 animate-pulse mt-0.5" />
          ) : (
            <p className={cn('text-2xl font-bold font-mono tracking-tight leading-none mt-0.5', valueColor[accent])}>
              {value}
            </p>
          )}
          {sub && (
            <p className="text-[8px] text-foreground/40 uppercase tracking-wider leading-none">{sub}</p>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function StatusBar() {
  const [time, setTime]               = useState('')
  const [isOnline, setIsOnline]       = useState(true)
  const [status, setStatus]           = useState<SupabaseStatusData | null>(null)
  const [dbPing, setDbPing]           = useState<number | null>(null)
  const [pingOk, setPingOk]           = useState<boolean | null>(null)
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [loadingPing, setLoadingPing] = useState(false)
  const [stats, setStats]             = useState<SystemStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('es-MX', { hour12: false }))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('https://status.supabase.com/api/v2/summary.json')
        const data = await res.json()
        setStatus({
          indicator:   data.status.indicator,
          description: data.status.description,
          components:  data.components,
          incidents:   data.incidents,
        })
      } catch {}
    }
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  async function runPing() {
    setLoadingPing(true)
    const result = await pingDatabase()
    setDbPing(result.latencyMs)
    setPingOk(result.ok)
    setLoadingPing(false)
  }

  async function loadStats() {
    setLoadingStats(true)
    const result = await getSystemStats()
    setStats(result)
    setLoadingStats(false)
  }

  async function refresh() {
    await Promise.all([runPing(), loadStats()])
  }

  function openDrawer() {
    setDrawerOpen(true)
    refresh()
  }

  function pingAccent(): Accent {
    if (!pingOk || dbPing === null) return 'red'
    if (dbPing < 200) return 'green'
    if (dbPing < 500) return 'amber'
    return 'red'
  }

  const indicator      = status?.indicator ?? 'none'
  const coreComponents = (status?.components ?? []).filter(c =>
    CORE_SERVICES.some(name => c.name.toLowerCase().includes(name.toLowerCase()))
  )

  return (
    <TooltipProvider>
      {/* ── Status bar ──────────────────────────────────────────────────────── */}
      <footer className="fixed bottom-0 left-16 right-0 z-30 h-10 bg-card border-t border-border px-8 flex items-center justify-between">
        <div className="flex gap-6 items-center text-[10px] font-bold uppercase tracking-widest">

          <span className="flex items-center gap-2">
            <span className={cn('size-1.5 rounded-full shrink-0', isOnline ? 'bg-green-500' : 'bg-red-500')} />
            {isOnline ? 'En línea' : 'Sin conexión'}
          </span>

          <button
            onClick={openDrawer}
            className="flex items-center gap-2 text-foreground/50 hover:text-foreground transition-colors"
          >
            <span className={cn(
              'size-1.5 rounded-full shrink-0',
              status ? INDICATOR_DOT[indicator] : 'bg-foreground/20 animate-pulse'
            )} />
            Supabase
            <Activity className="size-3" />
          </button>

          <span className="flex items-center gap-2 text-foreground/40">
            Uptime <SystemUptime />
          </span>
        </div>

        <div className="font-mono text-[11px] text-foreground/50 tracking-wider">
          {time}
        </div>
      </footer>

      {/* ── Backdrop ────────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Drawer ──────────────────────────────────────────────────────────── */}
      <div className={cn(
        'fixed left-16 right-0 z-50 bg-background border-t border-border shadow-2xl',
        'transition-all duration-300 ease-out',
        drawerOpen
          ? 'bottom-10 opacity-100 translate-y-0'
          : 'bottom-10 opacity-0 translate-y-3 pointer-events-none'
      )}>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <span className={cn(
              'size-2 rounded-full shrink-0',
              status ? INDICATOR_DOT[indicator] : 'bg-muted-foreground animate-pulse'
            )} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Estado del Sistema</p>
              <p className="text-[9px] text-foreground/50 tracking-wide mt-0.5">
                {status ? INDICATOR_DESC[indicator] : 'Consultando estado...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loadingPing || loadingStats}
              className="flex items-center gap-1.5 h-7 px-3 text-[8px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
            >
              <RotateCcw className={cn('size-2.5', (loadingPing || loadingStats) && 'animate-spin')} />
              Actualizar
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              className="size-7 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="size-3.5 text-foreground/50" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-5 space-y-5">

          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/40 mb-3">Métricas de la aplicación</p>
            <div className="grid grid-cols-6 gap-2">
              <MetricCard
                label="Latencia DB"
                value={dbPing !== null ? dbPing : '—'}
                sub={dbPing !== null ? 'ms' : undefined}
                tooltip="Tiempo de respuesta del servidor de base de datos Supabase"
                accent={dbPing !== null ? pingAccent() : 'neutral'}
                loading={loadingPing}
              />
              <MetricCard
                label="Req. pendientes"
                value={stats?.reqPending ?? '—'}
                tooltip="Requisiciones de producción en estado PENDIENTE esperando aprobación"
                accent="neutral"
                loading={loadingStats}
              />
              <MetricCard
                label="Órdenes activas"
                value={stats?.ordersActive ?? '—'}
                tooltip="Órdenes de compra en estado PENDIENTE o PARCIAL (no completadas)"
                accent="neutral"
                loading={loadingStats}
              />
              <MetricCard
                label="Lotes de tinta"
                value={stats?.inkLots ?? '—'}
                tooltip="Lotes de tinta activos en inventario (habilitados)"
                accent="neutral"
                loading={loadingStats}
              />
              <MetricCard
                label="Bobinas papel"
                value={stats?.paperLots ?? '—'}
                tooltip="Bobinas de papel activas en inventario (habilitadas)"
                accent="neutral"
                loading={loadingStats}
              />
              <MetricCard
                label="Usuarios"
                value={stats?.users ?? '—'}
                tooltip="Total de usuarios registrados en el sistema"
                accent="neutral"
                loading={loadingStats}
              />
            </div>
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/40 mb-2">Servicios Supabase</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {coreComponents.length > 0
                ? coreComponents.map(comp => (
                    <Tooltip key={comp.id}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 cursor-default">
                          <span className={cn('size-1.5 rounded-full shrink-0', COMP_DOT[comp.status])} />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/60">{comp.name}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">{COMP_LABEL[comp.status]}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))
                : CORE_SERVICES.map(name => (
                    <div key={name} className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-foreground/15 animate-pulse shrink-0" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/30">{name}</span>
                    </div>
                  ))
              }
            </div>
          </div>

          {(status?.incidents.length ?? 0) > 0 && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/40 mb-2">Incidentes activos</p>
              <div className="space-y-1">
                {status!.incidents.map((inc, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200">
                    <span className="size-1.5 rounded-full bg-orange-500 shrink-0" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-orange-800">{inc.name}</span>
                    <span className="text-[9px] text-orange-500 ml-auto uppercase tracking-wider">{inc.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
