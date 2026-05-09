import { getSessionUser }              from '@/actions/auth.actions'
import { getInkInventory }             from '@/actions/ink-inventory.actions'
import { getInkCatalogWithStock }      from '@/actions/requisitions.actions'
import { InkInventoryView }            from '@/components/inventory/inks/ink-inventory-view'
import { redirect }                    from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function InkInventoryPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const canManage  = ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role)
  const canRequest = user.role !== 'USER'

  const [lots, inkCatalog] = await Promise.all([
    getInkInventory(),
    getInkCatalogWithStock(),
  ])

  return (
    <div className="p-8">
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Inventario — Tintas</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mt-0.5">
          Lotes activos, ubicaciones y solicitudes de material
        </p>
      </div>

      <InkInventoryView
        initialLots={lots}
        canManage={canManage}
        canRequest={canRequest}
        inkCatalog={inkCatalog}
      />
    </div>
  )
}
