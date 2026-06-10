'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Responsive, useContainerWidth } from 'react-grid-layout'
import type { Layout, ResponsiveLayouts } from 'react-grid-layout'
import { LayoutGrid, Plus, RotateCcw, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  getDashboardLayout,
  saveDashboardLayout,
  resetDashboardLayout,
} from '@/actions/dashboard-layout.actions'
import { LAYOUT_BREAKPOINTS } from '@/types/dashboard-layout.types'
import type {
  DashboardKey,
  DashboardLayouts,
  DashboardState,
  LayoutBreakpoint,
  WidgetInstance,
  WidgetRect,
} from '@/types/dashboard-layout.types'
import { WIDGET_REGISTRY, type RenderCtx } from './widget-registry'
import { WidgetPicker } from './widget-picker'

import 'react-grid-layout/css/styles.css'
import './dashboard-grid.css'

const BREAKPOINTS: Record<LayoutBreakpoint, number> = { lg: 1024, md: 640, xs: 0 }
const COLS: Record<LayoutBreakpoint, number> = { lg: 12, md: 6, xs: 2 }
const ROW_HEIGHT = 52
const MARGIN: [number, number] = [12, 12]

/** A widget in a dashboard's default seed: its instance + rects per breakpoint. */
export type DefaultWidget = WidgetInstance & {
  rects: Record<LayoutBreakpoint, { x: number; y: number; w: number; h: number }>
}

/** Compact helper to declare default rects per breakpoint as [x,y,w,h] tuples. */
export function rects(
  lg: [number, number, number, number],
  md: [number, number, number, number],
  xs: [number, number, number, number],
): DefaultWidget['rects'] {
  const r = ([x, y, w, h]: [number, number, number, number]) => ({ x, y, w, h })
  return { lg: r(lg), md: r(md), xs: r(xs) }
}

function stripLayouts(layouts: ResponsiveLayouts<LayoutBreakpoint>): DashboardLayouts {
  const out: DashboardLayouts = {}
  for (const bp of LAYOUT_BREAKPOINTS) {
    const items = layouts[bp]
    if (!items) continue
    out[bp] = items.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))
  }
  return out
}

// Guarantees every widget has a rect in every breakpoint: a freshly added widget
// (or one whose breakpoint was never visited) gets synthesized at the bottom,
// where the vertical compactor lifts it into place.
function resolveLayouts(widgets: WidgetInstance[], base: DashboardLayouts): DashboardLayouts {
  const out: DashboardLayouts = {}
  for (const bp of LAYOUT_BREAKPOINTS) {
    const existing = new Map((base[bp] ?? []).map(r => [r.i, r]))
    let maxY = 0
    for (const r of base[bp] ?? []) maxY = Math.max(maxY, r.y + r.h)
    const cols = COLS[bp]
    out[bp] = widgets.map(w => {
      const found = existing.get(w.id)
      if (found) return found
      const size = WIDGET_REGISTRY[w.type]?.defaultSize ?? { w: 3, h: 4 }
      const rect: WidgetRect = { i: w.id, x: 0, y: maxY, w: Math.min(size.w, cols), h: size.h }
      maxY += size.h
      return rect
    })
  }
  return out
}

export function DashboardGrid({
  dashboardKey,
  defaults,
  renderCtx,
  toolbar,
}: {
  dashboardKey: DashboardKey
  defaults: DefaultWidget[]
  renderCtx: RenderCtx
  /** Rendered to the left of the edit controls (e.g. a DateRangePicker). */
  toolbar?: React.ReactNode
}) {
  const queryClient = useQueryClient()
  // mounted is false on the server and on the first client render, so SSR
  // outputs the skeleton and hydration matches; the grid mounts client-only.
  const { width, containerRef, mounted } = useContainerWidth()
  const [editing, setEditing] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draftWidgets, setDraftWidgets] = useState<WidgetInstance[] | null>(null)
  const [draftLayouts, setDraftLayouts] = useState<DashboardLayouts | null>(null)

  const { data: saved, isLoading } = useQuery({
    queryKey: ['dashboard-layout', dashboardKey],
    queryFn:  () => getDashboardLayout(dashboardKey),
    staleTime: Infinity,
  })

  const defaultWidgets = useMemo<WidgetInstance[]>(
    () => defaults.map(d => ({ id: d.id, type: d.type, ...(d.params ? { params: d.params } : {}) })),
    [defaults],
  )
  const defaultLayouts = useMemo<DashboardLayouts>(() => {
    const out: DashboardLayouts = {}
    for (const bp of LAYOUT_BREAKPOINTS) out[bp] = defaults.map(d => ({ i: d.id, ...d.rects[bp] }))
    return out
  }, [defaults])

  // Saved set is authoritative once the user has customized; otherwise seed from
  // the role default. Unknown widget types (code removed one) are dropped.
  const savedWidgets = saved?.widgets && saved.widgets.length > 0 ? saved.widgets : defaultWidgets
  const knownWidgets = useMemo(() => savedWidgets.filter(w => WIDGET_REGISTRY[w.type]), [savedWidgets])
  const baseLayouts = saved?.layouts && Object.keys(saved.layouts).length > 0 ? saved.layouts : defaultLayouts
  const resolvedLayouts = useMemo(() => resolveLayouts(knownWidgets, baseLayouts), [knownWidgets, baseLayouts])

  const widgets = editing ? (draftWidgets ?? knownWidgets) : knownWidgets
  const layouts = editing ? (draftLayouts ?? resolvedLayouts) : resolvedLayouts

  const rglLayouts = useMemo<ResponsiveLayouts<LayoutBreakpoint>>(() => {
    const byId = new Map(widgets.map(w => [w.id, w]))
    const out: ResponsiveLayouts<LayoutBreakpoint> = {}
    for (const bp of LAYOUT_BREAKPOINTS) {
      out[bp] = (layouts[bp] ?? [])
        .filter(r => byId.has(r.i))
        .map(rect => {
          const size = WIDGET_REGISTRY[byId.get(rect.i)!.type]?.defaultSize
          return { ...rect, minW: size?.minW ?? 1, minH: size?.minH ?? 2 }
        })
    }
    return out
  }, [layouts, widgets])

  const saveMutation = useMutation({
    mutationFn: (state: DashboardState) => saveDashboardLayout(dashboardKey, state),
    onSuccess: (result, state) => {
      if (result.error) { toast.error(result.error); return }
      queryClient.setQueryData(['dashboard-layout', dashboardKey], state)
      setDraftWidgets(null); setDraftLayouts(null); setEditing(false)
      toast.success('Diseño del panel guardado')
    },
    onError: () => toast.error('No se pudo guardar el diseño'),
  })

  const resetMutation = useMutation({
    mutationFn: () => resetDashboardLayout(dashboardKey),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      queryClient.setQueryData(['dashboard-layout', dashboardKey], null)
      setDraftWidgets(null); setDraftLayouts(null); setEditing(false)
      toast.success('Diseño restablecido')
    },
    onError: () => toast.error('No se pudo restablecer el diseño'),
  })

  const addWidget = (type: string, params: Record<string, string>) => {
    const hasParams = Object.keys(params).length > 0
    const instance: WidgetInstance = { id: crypto.randomUUID(), type, ...(hasParams ? { params } : {}) }
    const nextWidgets = [...(draftWidgets ?? knownWidgets), instance]
    setDraftWidgets(nextWidgets)
    setDraftLayouts(resolveLayouts(nextWidgets, draftLayouts ?? resolvedLayouts))
  }

  const removeWidget = (id: string) => {
    setDraftWidgets((draftWidgets ?? knownWidgets).filter(w => w.id !== id))
    const baseL = draftLayouts ?? resolvedLayouts
    const next: DashboardLayouts = {}
    for (const bp of LAYOUT_BREAKPOINTS) next[bp] = (baseL[bp] ?? []).filter(r => r.i !== id)
    setDraftLayouts(next)
  }

  const handleLayoutChange = (_layout: Layout, all: ResponsiveLayouts<LayoutBreakpoint>) => {
    if (!editing) return
    setDraftLayouts(prev => ({ ...(prev ?? resolvedLayouts), ...stripLayouts(all) }))
  }

  const cancelEditing = () => { setDraftWidgets(null); setDraftLayouts(null); setEditing(false) }
  const pending = saveMutation.isPending || resetMutation.isPending

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>{toolbar}</div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" disabled={pending} onClick={() => setPickerOpen(true)}>
                <Plus data-icon="inline-start" />
                Agregar tarjeta
              </Button>
              <Button variant="ghost" size="sm" disabled={pending} onClick={() => resetMutation.mutate()}>
                <RotateCcw data-icon="inline-start" />
                Restablecer
              </Button>
              <Button variant="outline" size="sm" disabled={pending} onClick={cancelEditing}>
                <X data-icon="inline-start" />
                Cancelar
              </Button>
              <Button size="sm" disabled={pending} onClick={() => saveMutation.mutate({ widgets, layouts })}>
                <Save data-icon="inline-start" />
                Guardar diseño
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <LayoutGrid data-icon="inline-start" />
              Personalizar
            </Button>
          )}
        </div>
      </div>

      <div ref={containerRef}>
        {!mounted || isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {widgets.slice(0, 8).map(w => (
              <div key={w.id} className="h-28 bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <Responsive<LayoutBreakpoint>
            width={width}
            layouts={rglLayouts}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={ROW_HEIGHT}
            margin={MARGIN}
            containerPadding={[0, 0]}
            dragConfig={{ enabled: editing, cancel: '.widget-remove' }}
            resizeConfig={{ enabled: editing, handles: ['se', 's', 'e'] }}
            onLayoutChange={handleLayoutChange}
          >
            {widgets.map(w => {
              const def = WIDGET_REGISTRY[w.type]
              if (!def) return null
              return (
                <div key={w.id} className="relative">
                  <div className="h-full overflow-hidden *:h-full">{def.render(w.params ?? {}, renderCtx)}</div>
                  {editing && (
                    <>
                      {/* Overlay: blocks the widget's own links/inputs and turns
                          the whole card into a drag surface. */}
                      <div className="absolute inset-0 cursor-grab active:cursor-grabbing border-2 border-dashed border-[#008dc2]/40 hover:border-[#008dc2]/80 transition-colors" />
                      <button
                        type="button"
                        className="widget-remove absolute top-1 right-1 z-10 grid size-5 place-items-center bg-destructive text-white shadow-sm hover:bg-destructive/90"
                        onClick={() => removeWidget(w.id)}
                        aria-label="Quitar tarjeta"
                      >
                        <X className="size-3" />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </Responsive>
        )}
      </div>

      <WidgetPicker
        dashboardKey={dashboardKey}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onAdd={addWidget}
      />
    </div>
  )
}
