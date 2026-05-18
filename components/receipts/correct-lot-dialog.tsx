'use client'

import { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { correctInkLotQuantity, correctPaperLotQuantity } from '@/actions/receipts.actions'

type Props = {
  open:         boolean
  onClose:      () => void
  onSuccess:    () => void
  materialType: 'INK' | 'PAPER'
  inventoryId:  number
  // Valores actuales (solo referencia, no editables)
  currentKg?:      number  // INK
  currentLengthM?: number  // PAPER
  currentWidthM?:  number  // PAPER
}

const inputCls = 'w-full h-9 border border-foreground/20 bg-card px-3 text-sm outline-none focus:border-foreground/50 transition-colors'

export function CorrectLotDialog({
  open, onClose, onSuccess, materialType, inventoryId,
  currentKg, currentLengthM, currentWidthM,
}: Props) {
  const isInk = materialType === 'INK'

  const [newKg,       setNewKg]       = useState('')
  const [newLengthM,  setNewLengthM]  = useState('')
  const [newWidthM,   setNewWidthM]   = useState('')
  const [auditNote,   setAuditNote]   = useState('')
  const [saving,      setSaving]      = useState(false)

  function handleClose() {
    setNewKg(''); setNewLengthM(''); setNewWidthM(''); setAuditNote('')
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    let res: { success?: boolean; error?: string }

    if (isInk) {
      res = await correctInkLotQuantity(inventoryId, {
        new_kg:     parseFloat(newKg),
        audit_note: auditNote.trim(),
      })
    } else {
      res = await correctPaperLotQuantity(inventoryId, {
        new_length_m: parseFloat(newLengthM),
        new_width_m:  parseFloat(newWidthM),
        audit_note:   auditNote.trim(),
      })
    }

    setSaving(false)

    if (res.error) { toast.error(res.error); return }
    toast.success('Corrección registrada')
    handleClose()
    onSuccess()
  }

  const canSubmit = auditNote.trim().length >= 10 && (
    isInk
      ? parseFloat(newKg) > 0
      : parseFloat(newLengthM) > 0 && parseFloat(newWidthM) > 0
  )

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold tracking-tight">
            Corregir cantidad del lote
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Valores actuales — solo referencia */}
          <div className="bg-muted/50 border border-border px-4 py-3 space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Valores actuales (referencia)
            </p>
            {isInk ? (
              <p className="font-mono text-sm">{currentKg} kg</p>
            ) : (
              <p className="font-mono text-sm">
                {currentLengthM} m × {currentWidthM} m
                {currentLengthM && currentWidthM
                  ? ` = ${(currentLengthM * currentWidthM).toFixed(2)} m²`
                  : ''}
              </p>
            )}
          </div>

          {/* Nuevos valores */}
          {isInk ? (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                Nuevo valor (kg) *
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={newKg}
                onChange={e => setNewKg(e.target.value)}
                placeholder="0.000"
                className={inputCls}
                required
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Nueva longitud (m) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newLengthM}
                  onChange={e => setNewLengthM(e.target.value)}
                  placeholder="0.00"
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Nuevo ancho (m) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newWidthM}
                  onChange={e => setNewWidthM(e.target.value)}
                  placeholder="0.00"
                  className={inputCls}
                  required
                />
              </div>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
              Motivo de la corrección * <span className="normal-case font-normal">(mín. 10 caracteres)</span>
            </label>
            <textarea
              value={auditNote}
              onChange={e => setAuditNote(e.target.value)}
              rows={3}
              placeholder="Describe el motivo de la corrección..."
              className={inputCls + ' resize-none pt-2 h-auto'}
              required
            />
            <p className={`text-[10px] mt-1 ${auditNote.trim().length >= 10 ? 'text-muted-foreground' : 'text-destructive'}`}>
              {auditNote.trim().length}/10 caracteres mínimos
            </p>
          </div>

          {/* Advertencia */}
          <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed">
              Esta acción modificará el stock en inventario y quedará registrada en el historial de auditoría.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="flex-1 py-2.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {saving && <Loader2 className="size-3 animate-spin" />}
              {saving ? 'Guardando…' : 'Confirmar corrección'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
