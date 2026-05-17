import { redirect }      from 'next/navigation'
import { getSessionUser } from '@/actions/auth.actions'
import { getAuditLog }    from '@/actions/audit.actions'
import { getUsers }       from '@/actions/users.actions'
import { AuditLogList }   from '@/components/audit/audit-log-list'

export const metadata = { title: 'Auditoría — IL Stockroom' }

export default async function AuditPage() {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') redirect('/dashboard')

  const [{ data, total }, users] = await Promise.all([
    getAuditLog({ page: 1, pageSize: 50 }),
    getUsers(),
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sistema</h1>
        <h2 className="text-2xl font-bold tracking-tight mt-0.5">Auditoría</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Historial completo de mutaciones del sistema — solo visible para administradores.
        </p>
      </div>

      <AuditLogList
        initialData={data}
        initialTotal={total}
        users={users}
      />
    </div>
  )
}
