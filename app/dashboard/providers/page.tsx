import { getProviders } from '@/actions/providers.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { ProvidersList } from '@/components/providers/providers-list'

export default async function ProvidersPage() {
  const [providers, user] = await Promise.all([getProviders(), getSessionUser()])
  const canEdit = user?.role === 'ADMIN' || user?.role === 'PURCHASER'

  return (
    <div className="px-8 pt-6 pb-8">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-[#1A1A1A]">
            Proveedores
          </h1>
          <p className="text-sm text-[#5f5e59] mt-0.5">
            {providers.length} proveedor{providers.length !== 1 ? 'es' : ''} registrado{providers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <ProvidersList providers={providers} canEdit={canEdit} />
    </div>
  )
}
