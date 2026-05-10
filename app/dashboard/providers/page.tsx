import { getProviders } from '@/actions/providers.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { ProvidersList } from '@/components/providers/providers-list'

export default async function ProvidersPage() {
  const [providers, user] = await Promise.all([getProviders(), getSessionUser()])
  const canEdit = user?.role === 'ADMIN' || user?.role === 'PURCHASER'

  return (
    <div className="px-8 pt-6 pb-8">
      <ProvidersList providers={providers} canEdit={canEdit} />
    </div>
  )
}
