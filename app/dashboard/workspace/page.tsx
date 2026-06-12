import { redirect } from 'next/navigation'
import { getSessionUser } from '@/actions/auth.actions'
import { WorkspaceShell } from '@/components/dashboard/workspace/workspace-shell'
import type { Role } from '@/components/dashboard/workspace/view-registry'

export const dynamic = 'force-dynamic'

export default async function WorkspacePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  return <WorkspaceShell role={user.role as Role} userId={user.id} />
}
