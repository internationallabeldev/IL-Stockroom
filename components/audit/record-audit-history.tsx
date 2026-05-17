'use client'

import { useState }       from 'react'
import { useQuery }       from '@tanstack/react-query'
import { format }         from 'date-fns'
import { es }             from 'date-fns/locale'
import { Clock }          from 'lucide-react'
import { cn }             from '@/lib/utils'
import { OperationBadge } from './operation-badge'
import { AuditLogDetail } from './audit-log-detail'
import { getAuditLogByRecord }   from '@/actions/audit.actions'
import type { AuditLogEntry }    from '@/lib/audit-constants'

type Props = {
  tableName:   string
  recordId:    number
  initialData?: AuditLogEntry[]
}

export function RecordAuditHistory({ tableName, recordId, initialData = [] }: Props) {
  const [selected, setSelected] = useState<AuditLogEntry | null>(null)

  const { data: entries = initialData } = useQuery({
    queryKey:    ['audit_record', tableName, recordId],
    queryFn:     () => getAuditLogByRecord(tableName, recordId),
    initialData: initialData.length > 0 ? initialData : undefined,
    staleTime:   30_000,
  })

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Sin historial de cambios
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4.5 top-0 bottom-0 w-px bg-border" />

        <ol className="space-y-0">
          {entries.map((entry, idx) => {
            const isLast = idx === entries.length - 1
            return (
              <li key={entry.id} className="relative pl-10">
                {/* Dot */}
                <div className={cn(
                  'absolute left-0 top-3 size-2.5 rounded-full border-2 border-background ring-1',
                  entry.operation === 'INSERT' && 'bg-emerald-500 ring-emerald-500',
                  entry.operation === 'UPDATE' && 'bg-blue-500 ring-blue-500',
                  entry.operation === 'DELETE' && 'bg-red-500 ring-red-500',
                )} />

                <button
                  onClick={() => setSelected(entry)}
                  className={cn(
                    'w-full text-left group',
                    isLast ? 'pb-0' : 'pb-4'
                  )}
                >
                  <div className="border border-border bg-card p-3 group-hover:border-foreground/30 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <OperationBadge operation={entry.operation} />
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono shrink-0">
                        <Clock className="size-3" />
                        {format(new Date(entry.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                      </div>
                    </div>

                    {entry.performed_by_name && (
                      <p className="text-[10px] text-muted-foreground">
                        Por <span className="font-semibold text-foreground">{entry.performed_by_name}</span>
                      </p>
                    )}

                    {entry.changed_fields && entry.changed_fields.length > 0 && (
                      <p className="mt-1 text-[10px] font-mono text-muted-foreground">
                        {entry.changed_fields.slice(0, 5).join(', ')}
                        {entry.changed_fields.length > 5 && ` +${entry.changed_fields.length - 5} más`}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      <AuditLogDetail entry={selected} onClose={() => setSelected(null)} />
    </>
  )
}
