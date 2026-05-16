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
      <UsersList initialUsers={users} currentUserId={user.id} />
    </div>
  )
}
