'use client'

import { useState } from 'react'
import { Pencil, Power } from 'lucide-react'
import { toast } from 'sonner'
import { togglePaperCatalogStatus, type PaperCatalogItem } from '@/actions/paper-catalog.actions'
import { StockBadge, StockBar } from '@/components/catalog/stock-badge'
import {
  SUBSTRATE_CATEGORY_LABELS,
  type SubstrateCategory,
  INK_COMPAT_LABELS,
  type InkCompat,
} from '@/lib/validations/paper-catalog.schema'
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

  const provider       = providers.find(p => p.id === item.provider_id)
  const stockUnitLabel = item.stock_unit === 'm2' ? 'm²' : (item.stock_unit ?? 'm²')

  async function handleToggle() {
    setLoading(true)
    const res = await togglePaperCatalogStatus(item.id)
    if (res.error) toast.error(res.error)
    else toast.success(item.enabled ? 'Papel desactivado' : 'Papel activado')
    setLoading(false)
  }

  return (
    <div className={`bg-[#fdf9f0] border border-[#1A1A1A]/15 flex flex-col transition-opacity ${!item.enabled ? 'opacity-50' : ''}`}>
      <div className="p-5 flex flex-col gap-3 flex-1">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => onView(item)}
            className="min-w-0 text-left hover:opacity-70 transition-opacity"
          >
            <p className="font-mono text-[9px] font-bold text-[#5f5e59] uppercase tracking-widest">{item.code}</p>
            <p className="font-heading font-bold text-base leading-tight mt-0.5">{item.name}</p>
            {item.material && (
              <p className="font-mono text-[10px] text-[#5f5e59] mt-0.5">{item.material}</p>
            )}
          </button>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StockBadge current={item.current_stock_m2} min={item.min_stock_m2} unit={stockUnitLabel} />
            {item.substrate_category && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-[#1A1A1A] text-[#F5F2EA]">
                {SUBSTRATE_CATEGORY_LABELS[item.substrate_category as SubstrateCategory]}
              </span>
            )}
          </div>
        </div>

        {/* Specs físicos */}
        <div className="grid grid-cols-3 gap-x-3 gap-y-1">
          {item.weight_gsm != null && (
            <Spec label="Gramaje" value={`${item.weight_gsm} g/m²`} />
          )}
          {item.thickness_mm != null && (
            <Spec label="Grosor" value={`${item.thickness_mm} µm`} />
          )}
          {item.standard_width_m != null && (
            <Spec label="Ancho" value={`${item.standard_width_m} m`} />
          )}
        </div>

        {/* Compatibilidad de tinta */}
        {item.ink_compatibility && item.ink_compatibility.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {(item.ink_compatibility as InkCompat[]).map(c => (
              <span
                key={c}
                className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest border border-[#1A1A1A]/20 text-[#5f5e59]"
              >
                {INK_COMPAT_LABELS[c]}
              </span>
            ))}
          </div>
        )}

        {/* Provider */}
        {provider && (
          <p className="text-[10px] text-[#5f5e59] truncate">{provider.name}</p>
        )}

        {/* Stock bar */}
        <div className="space-y-1.5 mt-auto">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">Stock</span>
            <span className="font-mono text-[10px] text-[#1A1A1A]">
              {(item.current_stock_m2 ?? 0).toFixed(1)} / {(item.min_stock_m2 ?? 0).toFixed(1)} {stockUnitLabel}
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
