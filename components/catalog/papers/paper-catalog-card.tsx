'use client'

import { useState } from 'react'
import { Pencil, Power } from 'lucide-react'
import { toast } from 'sonner'
import { togglePaperCatalogStatus, type PaperCatalogItem } from '@/actions/paper-catalog.actions'
import { StockBadge, StockBar } from '@/components/catalog/stock-badge'
import type { Provider } from '@/actions/providers.actions'

type Props = {
  item: PaperCatalogItem
  providers: Provider[]
  canEdit: boolean
  onView: (item: PaperCatalogItem) => void
  onEdit: (item: PaperCatalogItem) => void
}

export function PaperCatalogCard({ item, providers, canEdit, onView, onEdit }: Props) {
  const [loading, setLoading] = useState(false)

  const provider = providers.find(p => p.id === item.provider_id)

  async function handleToggle() {
    setLoading(true)
    const res = await togglePaperCatalogStatus(item.id)
    if (res.error) toast.error(res.error)
    else toast.success(item.enabled ? 'Papel desactivado' : 'Papel activado')
    setLoading(false)
  }

  return (
    <div className={`bg-[#fdf9f0] border border-[#1A1A1A]/15 flex flex-col transition-opacity ${!item.enabled ? 'opacity-50' : ''}`}>
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
          <StockBadge current={item.current_stock_m2} min={item.min_stock_m2} unit="m²" />
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {item.weight_gsm && (
            <Spec label="Gramaje" value={`${item.weight_gsm} g/m²`} />
          )}
          {item.thickness_mm && (
            <Spec label="Grosor" value={`${item.thickness_mm} mm`} />
          )}
          {item.standard_width_m && (
            <Spec label="Ancho" value={`${item.standard_width_m} m`} />
          )}
          {item.density && (
            <Spec label="Densidad" value={`${item.density}`} />
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
              {(item.current_stock_m2 ?? 0).toFixed(1)} / {(item.min_stock_m2 ?? 0).toFixed(1)} m²
            </span>
          </div>
          <StockBar current={item.current_stock_m2} min={item.min_stock_m2} />
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

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]/70">{label}</p>
      <p className="font-mono text-[10px] text-[#1A1A1A]">{value}</p>
    </div>
  )
}
