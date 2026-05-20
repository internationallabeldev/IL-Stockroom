'use client'

import { useState } from 'react'
import { Building2, FileText, Bell, ShoppingCart, ClipboardCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CompanySettings }      from './company-settings'
import { PdfSettings }          from './pdf-settings'
import { AlertsSettings }       from './alerts-settings'
import { OrdersSettings }       from './orders-settings'
import { RequisitionsSettings } from './requisitions-settings'
import type { AppSettings }     from '@/types/app-settings.types'

type Section = 'company' | 'pdf' | 'alerts' | 'orders' | 'requisitions'

const SECTIONS = [
  { key: 'company'      as Section, label: 'Empresa',           icon: Building2,      desc: 'Identidad, logo y domicilios' },
  { key: 'pdf'          as Section, label: 'PDF y Documentos',  icon: FileText,       desc: 'Textos y notas en documentos exportados' },
  { key: 'alerts'       as Section, label: 'Alertas',           icon: Bell,           desc: 'Umbrales y días de aviso' },
  { key: 'orders'       as Section, label: 'Órdenes de Compra', icon: ShoppingCart,   desc: 'Valores por defecto al crear órdenes' },
  { key: 'requisitions' as Section, label: 'Requisiciones',     icon: ClipboardCheck, desc: 'Tiempos de respuesta y textos de ayuda' },
]

export function AppSettingsForm({ settings }: { settings: AppSettings }) {
  const [active, setActive] = useState<Section>('company')
  const current = SECTIONS.find(s => s.key === active)!

  return (
    <div className="flex h-full w-full">

      {/* Vertical nav */}
      <nav className="h-full w-52 shrink-0 border-r border-border overflow-y-auto py-6">
        {SECTIONS.map(s => {
          const Icon = s.icon
          const isActive = s.key === active
          return (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={cn(
                'w-full text-left flex items-center gap-3 px-5 py-3 border-l-2 transition-colors',
                isActive
                  ? 'border-foreground bg-foreground/5 text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-foreground/3'
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                {s.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Content panel — scrolls independently */}
      <div className="flex-1 h-full overflow-y-auto py-8 pb-14 min-w-0 px-15">
        <div className="mb-6 pb-3 border-b border-border">
          <h2 className="text-sm font-bold uppercase tracking-widest">{current.label}</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">{current.desc}</p>
        </div>

        {active === 'company'      && <CompanySettings settings={settings} />}
        {active === 'pdf'          && <PdfSettings settings={settings} />}
        {active === 'alerts'       && <AlertsSettings settings={settings} />}
        {active === 'orders'       && <OrdersSettings settings={settings} />}
        {active === 'requisitions' && <RequisitionsSettings settings={settings} />}
      </div>

    </div>
  )
}
