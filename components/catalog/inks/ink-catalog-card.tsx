'use client'

import { useState } from 'react'
import { Pencil, Power } from 'lucide-react'
import { toast } from 'sonner'
import { toggleInkCatalogStatus, type InkCatalogItem } from '@/actions/ink-catalog.actions'
import { StockBadge, StockBar } from '@/components/catalog/stock-badge'
import { INK_TYPE_LABELS, type InkType } from '@/lib/validations/ink-catalog.schema'
import type { Provider } from '@/actions/providers.actions'

type Props = {
  item: InkCatalogItem
  providers: Provider[]
  canEdit: boolean
  onView: (item: InkCatalogItem) => void
  onEdit: (item: InkCatalogItem) => void
}

export function InkCatalogCard({ item, providers, canEdit, onView, onEdit }: Props) {
  const [loading, setLoading] = useState(false)

  const provider = providers.find(p => p.id === item.provider_id)
  const isHex = item.color_code?.startsWith('#')

  async function handleToggle() {
    setLoading(true)
    const res = await toggleInkCatalogStatus(item.id)
    if (res.error) toast.error(res.error)
    else toast.success(item.enabled ? 'Tinta desactivada' : 'Tinta activada')
    setLoading(false)
  }

  return (
    <div className={`bg-[#fdf9f0] border border-[#1A1A1A]/15 flex flex-col transition-opacity ${!item.enabled ? 'opacity-50' : ''}`}>
      {isHex && (
        <div className="h-1.5 w-full shrink-0" style={{ background: item.color_code! }} />
      )}

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => onView(item)}
            className="min-w-0 text-left hover:opacity-70 transition-opacity"
          >
            <p className="font-mono text-[9px] font-bold text-[#5f5e59] uppercase tracking-widest">{item.code}</p>
            <p className="font-heading font-bold text-base leading-tight mt-0.5">{item.name}</p>
          </button>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StockBadge current={item.current_stock_kg} min={item.min_stock_kg} unit="kg" />
            {item.ink_type && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-[#1A1A1A]/8 text-[#5f5e59] border border-[#1A1A1A]/12">
                {INK_TYPE_LABELS[item.ink_type as InkType]}
              </span>
            )}
          </div>
        </div>

        {/* Color + quick specs */}
        <div className="flex items-center gap-3 flex-wrap">
          {item.color_code && (
            <div className="flex items-center gap-1.5">
              {isHex && (
                <span
                  className="size-3 rounded-sm border border-[#1A1A1A]/15 shrink-0"
                  style={{ background: item.color_code }}
                />
              )}
              <span className="font-mono text-[10px] text-[#5f5e59]">{item.color_code}</span>
            </div>
          )}
          {item.density != null && (
            <span className="font-mono text-[10px] text-[#5f5e59]">
              {item.density} cm³/m²
            </span>
          )}
          {item.viscosity != null && (
            <span className="font-mono text-[10px] text-[#5f5e59]">
              {item.viscosity} cP
            </span>
          )}
        </div>

        {/* Provider */}
        {provider && (
          <p className="text-[10px] text-[#5f5e59] truncate">{provider.name}</p>
        )}

        {/* Stock bar */}
        <div className="space-y-1.5 mt-auto">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">Stock</span>
            <span className="font-mono text-[10px] text-[#1A1A1A]">
              {(item.current_stock_kg ?? 0).toFixed(1)} / {item.min_stock_kg.toFixed(1)} kg
            </span>
          </div>
          <StockBar current={item.current_stock_kg} min={item.min_stock_kg} />
        </div>

        {canEdit && (
          <div className="flex gap-2 border-t border-[#1A1A1A]/10 pt-3">
            <button
              onClick={() => onEdit(item)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-[#1A1A1A]/20 text-[10px] font-bold uppercase tracking-widest hover:bg-[#E5E1D8] transition-colors"
            >
              <Pencil className="size-3" />
              Editar
            </button>
            <button
              onClick={handleToggle}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-[#1A1A1A]/20 text-[10px] font-bold uppercase tracking-widest hover:bg-[#E5E1D8] transition-colors disabled:opacity-50"
            >
              <Power className="size-3" />
              {item.enabled ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
