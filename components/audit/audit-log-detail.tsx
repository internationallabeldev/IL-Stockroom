'use client'

import { format } from 'date-fns'
import { es }     from 'date-fns/locale'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { OperationBadge } from './operation-badge'
import { cn } from '@/lib/utils'
import type { AuditLogEntry } from '@/lib/audit-constants'

// ── Table label map ───────────────────────────────────────────────────────────

const TABLE_LABELS: Record<string, string> = {
  providers:                   'Proveedores',
  ink_catalog:                 'Catálogo tintas',
  paper_catalog:               'Catálogo papel',
  purchase_orders:             'Órdenes de compra',
  purchase_order_ink_items:    'Ítems tinta (OC)',
  purchase_order_paper_items:  'Ítems papel (OC)',
  ink_receipts:                'Recepciones tinta',
  paper_receipts:              'Recepciones papel',
  ink_inventory:               'Inventario tinta',
  paper_inventory:             'Inventario papel',
  ink_outputs:                 'Salidas tinta',
  paper_outputs:               'Salidas papel',
  production_requisitions:     'Requisiciones',
  requisition_ink_items:       'Ítems tinta (req.)',
  requisition_paper_items:     'Ítems papel (req.)',
  users:                       'Usuarios',
}

// ── Diff row ──────────────────────────────────────────────────────────────────

function DiffRow({
  field,
  oldVal,
  newVal,
  changed,
}: {
  field:   string
  oldVal:  unknown
  newVal:  unknown
  changed: boolean
}) {
  const fmt = (v: unknown) => {
    if (v === null || v === undefined) return <span className="text-muted-foreground italic">—</span>
    if (typeof v === 'boolean') return v ? 'true' : 'false'
    if (typeof v === 'object') return <span className="font-mono text-[10px]">{JSON.stringify(v)}</span>
    return String(v)
  }

  return (
    <tr className={cn('border-b border-border last:border-0', changed ? '' : 'opacity-40')}>
      <td className="py-1.5 pr-4 text-[10px] font-mono font-bold text-foreground/70 whitespace-nowrap align-top">{field}</td>
      {oldVal !== undefined && (
        <td className={cn('py-1.5 pr-4 text-[11px] align-top', changed && 'text-red-600 dark:text-red-400 line-through decoration-red-400/50')}>
          {fmt(oldVal)}
        </td>
      )}
      {newVal !== undefined && (
        <td className={cn('py-1.5 text-[11px] align-top', changed && 'text-emerald-600 dark:text-emerald-400 font-semibold')}>
          {fmt(newVal)}
        </td>
      )}
    </tr>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  entry:   AuditLogEntry | null
  onClose: () => void
}

export function AuditLogDetail({ entry, onClose }: Props) {
  if (!entry) return null

  const isUpdate = entry.operation === 'UPDATE'
  const isInsert = entry.operation === 'INSERT'
  const isDelete = entry.operation === 'DELETE'

  const data   = isInsert ? entry.new_data : isDelete ? entry.old_data : null
  const allKeys = isUpdate
    ? Array.from(new Set([
        ...Object.keys(entry.old_data ?? {}),
        ...Object.keys(entry.new_data ?? {}),
      ])).sort()
    : Object.keys(data ?? {}).sort()

  const changedSet = new Set(entry.changed_fields ?? [])

  return (
    <Sheet open={!!entry} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-sm font-bold uppercase tracking-widest">
            Detalle de auditoría
          </SheetTitle>
        </SheetHeader>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6 pb-6 border-b border-border">
          <MetaField label="Tabla"     value={TABLE_LABELS[entry.table_name] ?? entry.table_name} />
          <MetaField label="Operación" value={<OperationBadge operation={entry.operation} />} />
          <MetaField label="Registro"  value={entry.record_id ? `#${entry.record_id}` : '—'} />
          <MetaField label="Usuario"   value={entry.performed_by_name ?? entry.performed_by ?? '—'} />
          <MetaField
            label="Fecha"
            value={format(new Date(entry.created_at), "dd MMM yyyy, HH:mm:ss", { locale: es })}
            wide
          />
        </div>

        {/* Data diff */}
        {isUpdate && (
          <>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Cambios ({entry.changed_fields?.length ?? 0} campo{entry.changed_fields?.length !== 1 ? 's' : ''})
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="pb-2 pr-4 text-[9px] font-bold uppercase tracking-widest text-left text-muted-foreground">Campo</th>
                    <th className="pb-2 pr-4 text-[9px] font-bold uppercase tracking-widest text-left text-muted-foreground">Antes</th>
                    <th className="pb-2      text-[9px] font-bold uppercase tracking-widest text-left text-muted-foreground">Después</th>
                  </tr>
                </thead>
                <tbody>
                  {allKeys.map(key => (
                    <DiffRow
                      key={key}
                      field={key}
                      oldVal={entry.old_data?.[key]}
                      newVal={entry.new_data?.[key]}
                      changed={changedSet.has(key)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {(isInsert || isDelete) && data && (
          <>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              {isInsert ? 'Datos creados' : 'Datos eliminados'}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="pb-2 pr-4 text-[9px] font-bold uppercase tracking-widest text-left text-muted-foreground">Campo</th>
                    <th className="pb-2      text-[9px] font-bold uppercase tracking-widest text-left text-muted-foreground">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {allKeys.map(key => (
                    <DiffRow
                      key={key}
                      field={key}
                      oldVal={isDelete ? data[key] : undefined}
                      newVal={isInsert ? data[key] : undefined}
                      changed={false}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function MetaField({
  label,
  value,
  wide,
}: {
  label: string
  value: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <p className="text-[12px]">{value}</p>
    </div>
  )
}
