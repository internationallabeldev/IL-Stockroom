import { redirect } from 'next/navigation'
import { getSessionUser } from '@/actions/auth.actions'
import { getUsers } from '@/actions/users.actions'
import { UsersList } from '@/components/users/users-list'

export const metadata = { title: 'Usuarios — IL Stockroom' }

export default async function UsersPage() {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') redirect('/dashboard')

  const users = await getUsers()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-black uppercase tracking-tight">Usuarios</h1>
        <p className="text-xs text-[#5f5e59] mt-1">
          Gestión de accesos y roles del sistema
        </p>
      </div>

      <UsersList initialUsers={users} currentUserId={user.id} />
    </div>
  )
}
