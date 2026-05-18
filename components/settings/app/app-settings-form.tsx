'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CompanySettings }      from './company-settings'
import { PdfSettings }          from './pdf-settings'
import { AlertsSettings }       from './alerts-settings'
import { OrdersSettings }       from './orders-settings'
import { RequisitionsSettings } from './requisitions-settings'
import type { AppSettings }     from '@/types/app-settings.types'

const TABS = [
  { value: 'company',      label: 'Empresa' },
  { value: 'pdf',          label: 'PDF y Documentos' },
  { value: 'alerts',       label: 'Alertas' },
  { value: 'orders',       label: 'Órdenes de Compra' },
  { value: 'requisitions', label: 'Requisiciones' },
] as const

export function AppSettingsForm({ settings }: { settings: AppSettings }) {
  return (
    <Tabs defaultValue="company">
      <TabsList className="w-full overflow-x-auto">
        {TABS.map(t => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="mt-8">
        <TabsContent value="company">
          <section>
            <div className="mb-5 pb-3 border-b border-border">
              <h2 className="text-sm font-bold uppercase tracking-widest">Identidad de la empresa</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Aparece en el sidebar, PDFs y documentos exportados
              </p>
            </div>
            <CompanySettings settings={settings} />
          </section>
        </TabsContent>

        <TabsContent value="pdf">
          <section>
            <div className="mb-5 pb-3 border-b border-border">
              <h2 className="text-sm font-bold uppercase tracking-widest">PDF y Documentos</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Textos y datos que aparecen en los documentos PDF de órdenes de compra
              </p>
            </div>
            <PdfSettings settings={settings} />
          </section>
        </TabsContent>

        <TabsContent value="alerts">
          <section>
            <div className="mb-5 pb-3 border-b border-border">
              <h2 className="text-sm font-bold uppercase tracking-widest">Alertas y Umbrales</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Configura cuándo se disparan las alertas en el dashboard
              </p>
            </div>
            <AlertsSettings settings={settings} />
          </section>
        </TabsContent>

        <TabsContent value="orders">
          <section>
            <div className="mb-5 pb-3 border-b border-border">
              <h2 className="text-sm font-bold uppercase tracking-widest">Órdenes de Compra</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Valores por defecto al crear nuevas órdenes de compra
              </p>
            </div>
            <OrdersSettings settings={settings} />
          </section>
        </TabsContent>

        <TabsContent value="requisitions">
          <section>
            <div className="mb-5 pb-3 border-b border-border">
              <h2 className="text-sm font-bold uppercase tracking-widest">Requisiciones</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Tiempos de respuesta y textos de ayuda para el flujo de requisiciones
              </p>
            </div>
            <RequisitionsSettings settings={settings} />
          </section>
        </TabsContent>
      </div>
    </Tabs>
  )
}
