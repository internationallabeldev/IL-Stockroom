import { redirect }                  from 'next/navigation'
import { getSessionUser }             from '@/actions/auth.actions'
import { getAuditLog, getAuditStats } from '@/actions/audit.actions'
import { getUsers }                   from '@/actions/users.actions'
import { AuditLogList }               from '@/components/audit/audit-log-list'

export const metadata = { title: 'Auditoría — IL Stockroom' }

export default async function AuditPage() {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') redirect('/dashboard')

  const [{ data, total }, stats, users] = await Promise.all([
    getAuditLog({ page: 1, pageSize: 50 }),
    getAuditStats(),
    getUsers(),
  ])

  return (
    <div className="px-8 pb-8">
      <AuditLogList
        initialData={data}
        initialTotal={total}
        initialStats={stats}
        users={users}
      />
    </div>
  )
}
