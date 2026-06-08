'use client'

import { useState } from 'react'
import { Plus, Minus, MoreHorizontal, History, Pencil, PowerOff, ImageIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateSupplyItem } from '@/actions/supplies.actions'
import { type SupplyItemWithStatus } from '@/lib/supplies/types'
import { MovementForm } from './movement-form'
import { MovementHistory } from './movement-history'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_DOT: Record<string, string> = {
  ok:       'bg-green-500',
  warning:  'bg-yellow-400',
  critical: 'bg-red-500',
  empty:    'bg-foreground/80',
}

const STATUS_BAR: Record<string, string> = {
  ok:       'bg-green-500',
  warning:  'bg-yellow-400',
  critical: 'bg-red-500',
  empty:    'bg-foreground/30',
}

type Props = {
  item: SupplyItemWithStatus
  canEdit: boolean
  onEdit: (item: SupplyItemWithStatus) => void
}

export function SupplyItemRow({ item, canEdit, onEdit }: Props) {
  const [movementOpen, setMovementOpen] = useState<'IN' | 'OUT' | 'ADJUSTMENT' | null>(null)
  const [historyOpen, setHistoryOpen]   = useState(false)

  const warningLevel = item.quantity_warning ?? Math.ceil(item.quantity_minimum * 1.5)
  const barPct = Math.min(100, Math.round(
    (item.quantity_current / Math.max(warningLevel, 1)) * 100
  ))

  async function handleDisable() {
    const res = await updateSupplyItem(item.id, { enabled: !item.enabled })
    if (res.error) toast.error(res.error)
    else toast.success(item.enabled ? 'Item desactivado' : 'Item activado')
  }

  return (
    <>
      <tr className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group">
        {/* Status dot */}
        <td className="py-2.5 pl-3 pr-2 w-6">
          <span className={cn('block size-2.5 rounded-full', STATUS_DOT[item.status])} />
        </td>

        {/* Image thumbnail */}
        <td className="py-2.5 pr-3 w-10">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="size-8 object-cover border border-border"
            />
          ) : (
            <div className="size-8 bg-muted border border-border/50 flex items-center justify-center">
              <ImageIcon className="size-3.5 text-foreground/20" />
            </div>
          )}
        </td>

        {/* Name + description */}
        <td className="py-2.5 pr-4 min-w-0">
          <p className="text-[11px] font-bold truncate">{item.name}</p>
          {item.description && (
            <p className="text-[9px] text-foreground/40 truncate mt-0.5">{item.description}</p>
          )}
          {item.provider && (
            <p className="text-[9px] text-foreground/30 truncate">{item.provider.name}</p>
          )}
        </td>

        {/* Stock */}
        <td className="py-2.5 pr-4 w-40">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={cn(
              'text-[11px] font-bold tabular-nums',
              item.status === 'empty' || item.status === 'critical' ? 'text-red-600' :
              item.status === 'warning' ? 'text-yellow-600' : 'text-foreground'
            )}>
              {item.quantity_current}
            </span>
            <span className="text-[9px] text-foreground/40">/ {item.quantity_minimum} {item.unit}</span>
          </div>
          <div className="w-full h-1 bg-muted overflow-hidden">
            <div
              className={cn('h-full transition-all', STATUS_BAR[item.status])}
              style={{ width: `${barPct}%` }}
            />
          </div>
        </td>

        {/* Actions */}
        <td className="py-2.5 pr-3 w-28">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canEdit ? (
              <>
                <button
                  onClick={() => setMovementOpen('IN')}
                  title="Registrar entrada"
                  className="size-7 flex items-center justify-center border border-border hover:bg-green-50 hover:border-green-300 hover:text-green-600 dark:hover:bg-green-950/20 transition-colors"
                >
                  <Plus className="size-3.5" />
                </button>
                <button
                  onClick={() => setMovementOpen('OUT')}
                  disabled={item.quantity_current === 0}
                  title="Registrar uso"
                  className="size-7 flex items-center justify-center border border-border hover:bg-red-50 hover:border-red-300 hover:text-red-500 dark:hover:bg-red-950/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="size-3.5" />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="size-7 flex items-center justify-center border border-border hover:bg-muted transition-colors"
                      title="Más opciones"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs">
                    <DropdownMenuItem onClick={() => setMovementOpen('ADJUSTMENT')}>
                      <span className="mr-2">⟳</span> Ajuste de inventario
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                      <History className="size-3 mr-2" /> Ver historial
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Pencil className="size-3 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDisable} className="text-destructive focus:text-destructive">
                      <PowerOff className="size-3 mr-2" /> {item.enabled ? 'Deshabilitar' : 'Habilitar'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-1 h-7 px-2 border border-border text-[9px] font-bold uppercase tracking-widest hover:bg-muted transition-colors"
              >
                <History className="size-3" /> Historial
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Modals */}
      {movementOpen && (
        <MovementForm
          open={true}
          onClose={() => setMovementOpen(null)}
          item={item}
          movementType={movementOpen}
        />
      )}
      {historyOpen && (
        <MovementHistory
          open={true}
          onClose={() => setHistoryOpen(false)}
          item={item}
        />
      )}
    </>
  )
}
