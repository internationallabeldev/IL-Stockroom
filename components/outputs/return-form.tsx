'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { registerInkReturn, registerPaperReturn } from '@/actions/outputs.actions'
import type { InkOutputRecord, PaperOutputRecord } from '@/actions/requisitions.actions'

type InkProps = {
  output:   InkOutputRecord
  open:     boolean
  onClose:  () => void
  onSuccess: () => void
}

export function InkReturnForm({ output, open, onClose, onSuccess }: InkProps) {
  const [kg, setKg]         = useState('')
  const [loading, setLoading] = useState(false)

  const maxKg = output.kg_delivered - (output.kg_returned ?? 0)

  async function handleSubmit() {
    const val = parseFloat(kg)
    if (!val || val <= 0) { toast.error('Ingresa una cantidad válida'); return }
    if (val > maxKg) { toast.error(`Máximo ${maxKg.toFixed(2)} kg`); return }

    setLoading(true)
    const res = await registerInkReturn(output.id, val)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Devolución registrada — material regresó al inventario')
      setKg('')
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm bg-[#F5F2EA] border border-[#1A1A1A]/20 p-0 gap-0">
        <DialogHeader className="px-6 py-5 border-b border-[#1A1A1A]/10">
          <DialogTitle className="font-heading text-base font-bold tracking-tight text-[#1A1A1A]">
            Registrar devolución — Tinta
          </DialogTitle>
          <p className="text-[10px] text-[#5f5e59] mt-0.5">
            {output.ink_inventory?.ink_catalog?.name} · Lote {output.ink_inventory?.internal_batch}
          </p>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
              Kg a devolver (máx. {maxKg.toFixed(2)} kg)
            </label>
            <input
              type="number"
              min={0.01}
              max={maxKg}
              step={0.01}
              value={kg}
              onChange={e => setKg(e.target.value)}
              placeholder="0.00"
              className="w-full h-9 px-3 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-sm font-mono outline-none focus:border-[#1A1A1A]/40"
            />
          </div>

          <p className="text-[10px] text-[#5f5e59] border border-[#1A1A1A]/10 bg-[#E5E1D8]/30 px-3 py-2">
            ¿Confirmas la devolución? El material regresará al inventario automáticamente.
          </p>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] hover:text-[#1A1A1A]"
            >
              Cancelar
            </button>
            <button
              disabled={loading || !kg}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" />
              {loading ? 'Registrando…' : 'Confirmar devolución'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type PaperProps = {
  output:    PaperOutputRecord
  open:      boolean
  onClose:   () => void
  onSuccess: () => void
}

export function PaperReturnForm({ output, open, onClose, onSuccess }: PaperProps) {
  const [len, setLen]       = useState('')
  const [wid, setWid]       = useState('')
  const [loading, setLoading] = useState(false)

  const m2Returned  = (parseFloat(len) || 0) * (parseFloat(wid) || 0)
  const maxM2       = output.m2_delivered ?? 0

  async function handleSubmit() {
    const l = parseFloat(len)
    const w = parseFloat(wid)
    if (!l || !w || l <= 0 || w <= 0) { toast.error('Ingresa dimensiones válidas'); return }
    if (m2Returned > maxM2) { toast.error(`Máximo ${maxM2.toFixed(3)} m²`); return }

    setLoading(true)
    const res = await registerPaperReturn(output.id, l, w)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Devolución registrada — material regresó al inventario')
      setLen(''); setWid('')
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm bg-[#F5F2EA] border border-[#1A1A1A]/20 p-0 gap-0">
        <DialogHeader className="px-6 py-5 border-b border-[#1A1A1A]/10">
          <DialogTitle className="font-heading text-base font-bold tracking-tight text-[#1A1A1A]">
            Registrar devolución — Papel
          </DialogTitle>
          <p className="text-[10px] text-[#5f5e59] mt-0.5">
            {output.paper_inventory?.paper_catalog?.name} · Lote {output.paper_inventory?.internal_batch}
          </p>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
                Largo devuelto (m)
              </label>
              <input
                type="number" min={0.001} step={0.001} value={len}
                onChange={e => setLen(e.target.value)}
                placeholder="0.000"
                className="w-full h-9 px-3 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-sm font-mono outline-none focus:border-[#1A1A1A]/40"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
                Ancho devuelto (m)
              </label>
              <input
                type="number" min={0.001} step={0.001} value={wid}
                onChange={e => setWid(e.target.value)}
                placeholder="0.000"
                className="w-full h-9 px-3 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-sm font-mono outline-none focus:border-[#1A1A1A]/40"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#5f5e59]">
            <span>M² a devolver:</span>
            <span className={m2Returned > maxM2 ? 'text-red-600' : 'text-[#1A1A1A]'}>
              {m2Returned > 0 ? m2Returned.toFixed(3) : '—'} m²
            </span>
          </div>
          <p className="text-[9px] text-[#5f5e59]">
            Entregado: {output.length_m_delivered.toFixed(3)} × {output.width_m_delivered.toFixed(3)} m
            ({maxM2.toFixed(3)} m²)
          </p>

          <p className="text-[10px] text-[#5f5e59] border border-[#1A1A1A]/10 bg-[#E5E1D8]/30 px-3 py-2">
            ¿Confirmas la devolución? El material regresará al inventario automáticamente.
          </p>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] hover:text-[#1A1A1A]"
            >
              Cancelar
            </button>
            <button
              disabled={loading || !len || !wid || m2Returned > maxM2}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" />
              {loading ? 'Registrando…' : 'Confirmar devolución'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
