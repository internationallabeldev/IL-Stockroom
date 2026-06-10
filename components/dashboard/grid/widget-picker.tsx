'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { widgetsForDashboard, defaultParams, type WidgetDef } from './widget-registry'
import type { DashboardKey } from '@/types/dashboard-layout.types'

export function WidgetPicker({
  dashboardKey,
  open,
  onOpenChange,
  onAdd,
}: {
  dashboardKey: DashboardKey
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (type: string, params: Record<string, string>) => void
}) {
  const categories = useMemo(() => {
    const map = new Map<string, WidgetDef[]>()
    for (const d of widgetsForDashboard(dashboardKey)) {
      if (!map.has(d.category)) map.set(d.category, [])
      map.get(d.category)!.push(d)
    }
    return [...map.entries()]
  }, [dashboardKey])

  // Per-type selected params (defaults to the first option of each field).
  const [params, setParams] = useState<Record<string, Record<string, string>>>({})
  const paramsFor = (d: WidgetDef) => params[d.type] ?? defaultParams(d)
  const setParam = (type: string, key: string, value: string) =>
    setParams(p => ({ ...p, [type]: { ...(p[type] ?? {}), [key]: value } }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar tarjeta</DialogTitle>
          <DialogDescription>Elige un widget para añadir a tu panel.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {categories.map(([category, items]) => (
            <div key={category}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2">{category}</p>
              <div className="space-y-2">
                {items.map(d => {
                  const p = paramsFor(d)
                  return (
                    <div key={d.type} className="flex items-start gap-3 border border-border p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold">{d.label}</p>
                        <p className="text-[10px] text-foreground/50">{d.description}</p>
                        {d.params?.map(f => (
                          <div key={f.key} className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] text-foreground/50">{f.label}</span>
                            <Select value={p[f.key]} onValueChange={v => setParam(d.type, f.key, v)}>
                              <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {f.options.map(o => (
                                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => { onAdd(d.type, p); onOpenChange(false) }}
                      >
                        <Plus data-icon="inline-start" />
                        Agregar
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
