import { getSessionUser }              from '@/actions/auth.actions'
import { getPaperInventory }           from '@/actions/paper-inventory.actions'
import { getPaperCatalogWithStock }    from '@/actions/requisitions.actions'
import { PaperInventoryView }          from '@/components/inventory/papers/paper-inventory-view'
import { redirect }                    from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PaperInventoryPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const canManage  = ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role)
  const canRequest = user.role === 'PRODUCER'

  const [lots, paperCatalog] = await Promise.all([
    getPaperInventory(),
    getPaperCatalogWithStock(),
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Inventario — Papel</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mt-1">
          Bobinas activas, ubicaciones y solicitudes de material
        </p>
      </div>

      <PaperInventoryView
        initialLots={lots}
        canManage={canManage}
        canRequest={canRequest}
        paperCatalog={paperCatalog}
      />
    </div>
  )
}
