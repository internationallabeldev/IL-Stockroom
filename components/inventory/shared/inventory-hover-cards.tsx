'use client'

import type { ReactNode } from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import type { InkLot }   from '@/actions/ink-inventory.actions'
import type { PaperLot } from '@/actions/paper-inventory.actions'

// ─── Shared bits ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
        {label}
      </span>
      <span className="font-mono text-[11px] text-right tabular-nums">{value}</span>
    </div>
  )
}

function CardHeader({ swatch, code, name }: { swatch?: string | null; code?: string | null; name?: string | null }) {
  return (
    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border/50">
      {swatch !== undefined && (
        <span
          className="size-3.5 rounded-full shrink-0 border border-border/50"
          style={{ backgroundColor: swatch ?? '#D9D5CC' }}
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[10px] text-muted-foreground">{code ?? '—'}</span>
        <span className="block font-medium text-[12px] leading-tight truncate">{name ?? '—'}</span>
      </span>
    </div>
  )
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

function userName(u: { first_name: string | null; last_name: string | null } | null | undefined) {
  if (!u) return '—'
  const full = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
  return full || '—'
}

const num = (v: number | null | undefined, unit: string, digits = 2) =>
  v == null ? '—' : `${v.toFixed(digits)} ${unit}`

// ─── Ink ────────────────────────────────────────────────────────────────────

export function InkInfoHoverCard({ lot, children }: { lot: InkLot; children: ReactNode }) {
  const ink = lot.ink_catalog
  if (!ink) return <>{children}</>

  return (
    <HoverCard openDelay={150} closeDelay={80}>
      <HoverCardTrigger asChild>
        <div className="cursor-default">{children}</div>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-64 space-y-1.5">
        <CardHeader swatch={ink.color_code} code={ink.code} name={ink.name} />
        <InfoRow label="Color"     value={ink.color_code ?? '—'} />
        <InfoRow label="Densidad"  value={ink.density != null ? ink.density.toFixed(3) : '—'} />
        <InfoRow label="Viscosidad" value={ink.viscosity != null ? `${ink.viscosity} s` : '—'} />
        <div className="pt-1.5 mt-1 border-t border-border/50 space-y-1">
          <InfoRow label="Stock total" value={num(ink.current_stock_kg, 'kg')} />
          <InfoRow label="Stock mín."  value={num(ink.min_stock_kg, 'kg')} />
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

// ─── Paper ──────────────────────────────────────────────────────────────────

export function PaperInfoHoverCard({ lot, children }: { lot: PaperLot; children: ReactNode }) {
  const paper = lot.paper_catalog
  if (!paper) return <>{children}</>

  return (
    <HoverCard openDelay={150} closeDelay={80}>
      <HoverCardTrigger asChild>
        <div className="cursor-default">{children}</div>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-64 space-y-1.5">
        <CardHeader code={paper.code} name={paper.name} />
        <InfoRow label="Gramaje"  value={paper.weight_gsm != null ? `${paper.weight_gsm} g/m²` : '—'} />
        <InfoRow label="Ancho"    value={num(paper.standard_width_m, 'm')} />
        <div className="pt-1.5 mt-1 border-t border-border/50 space-y-1">
          <InfoRow label="Stock total" value={num(paper.current_stock_m2, 'm²')} />
          <InfoRow label="Stock mín."  value={num(paper.min_stock_m2, 'm²')} />
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

// ─── Provider (shared between ink & paper) ──────────────────────────────────

type ProviderReceipt = {
  provider_batch?: string | null
  receipt_date?:   string | null
  receiver?:       { first_name: string | null; last_name: string | null } | null
  purchase_order_item?: {
    purchase_order?: { provider?: { id: number; name: string } | null } | null
  } | null
} | null

export function ProviderInfoHoverCard({ receipt, children }: { receipt: ProviderReceipt; children: ReactNode }) {
  const provider = receipt?.purchase_order_item?.purchase_order?.provider
  if (!provider) return <>{children}</>

  return (
    <HoverCard openDelay={150} closeDelay={80}>
      <HoverCardTrigger asChild>
        <div className="cursor-default">{children}</div>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-64 space-y-1.5">
        <CardHeader code="Proveedor" name={provider.name} />
        <InfoRow label="Lote prov."  value={receipt?.provider_batch ?? '—'} />
        <InfoRow label="Recepción"   value={fmtDate(receipt?.receipt_date)} />
        <InfoRow label="Recibido por" value={userName(receipt?.receiver)} />
      </HoverCardContent>
    </HoverCard>
  )
}
