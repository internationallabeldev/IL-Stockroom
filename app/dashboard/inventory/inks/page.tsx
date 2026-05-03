import { getSessionUser }      from '@/actions/auth.actions'
import { getInkInventory }     from '@/actions/ink-inventory.actions'
import { InkInventoryView }    from '@/components/inventory/inks/ink-inventory-view'
import { redirect }            from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function InkInventoryPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const canManage  = ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role)
  const canRequest = user.role === 'PRODUCER'

  const lots = await getInkInventory()

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Inventario — Tintas</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mt-1">
          Lotes activos, ubicaciones y solicitudes de material
        </p>
      </div>

      <InkInventoryView
        initialLots={lots}
        canManage={canManage}
        canRequest={canRequest}
      />
    </div>
  )
}
