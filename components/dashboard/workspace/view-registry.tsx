'use client'

import type { ReactNode } from 'react'
import { Droplet, FileText, type LucideIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getInkInventory } from '@/actions/ink-inventory.actions'
import { getPaperInventory } from '@/actions/paper-inventory.actions'
import {
  getInkCatalogWithStock,
  getPaperCatalogWithStock,
  getRequisitions,
} from '@/actions/requisitions.actions'
import { getPurchaseOrders } from '@/actions/purchase-orders.actions'
import { getProviders } from '@/actions/providers.actions'
import { getInkCatalog } from '@/actions/ink-catalog.actions'
import { getPaperCatalog } from '@/actions/paper-catalog.actions'
import { getSupplyCategories } from '@/actions/supplies.actions'
import { InkInventoryView } from '@/components/inventory/inks/ink-inventory-view'
import { PaperInventoryView } from '@/components/inventory/papers/paper-inventory-view'
import { RequisitionsList } from '@/components/requisitions/requisitions-list'
import { OrdersList } from '@/components/orders/orders-list'
import { InkCatalogList } from '@/components/catalog/inks/ink-catalog-list'
import { PaperCatalogList } from '@/components/catalog/papers/paper-catalog-list'
import { ProvidersList } from '@/components/providers/providers-list'
import { SuppliesView } from '@/components/supplies/supplies-view'
import { getUsers } from '@/actions/users.actions'
import { getAuditLog, getAuditStats } from '@/actions/audit.actions'
import { getPendingQualityReceipts, getAllReceipts } from '@/actions/receipts.actions'
import { OutputsHistoryList } from '@/components/outputs-history/outputs-history-list'
import { UsersList } from '@/components/users/users-list'
import { AuditLogList } from '@/components/audit/audit-log-list'
import { ReceiptsPageTabs } from '@/app/dashboard/receipts/_components/receipts-page-tabs'
import { ReceiptsStatsBar } from '@/components/receipts/receipts-stats-bar'
import type { Database } from '@/types/database.types'

export type Role = Database['public']['Enums']['user_role']

type PaneProps = { role: Role; userId: string }

const isWh = (r: Role) => r === 'ADMIN' || r === 'WAREHOUSE_MANAGER'

function PaneLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse" />)}
    </div>
  )
}

// Each pane fetches its own data (the same queryKeys the views use internally,
// so react-query dedupes and the cache is shared across panes) and derives perms
// from the session role — exactly what each page.tsx used to inject server-side.

function InventoryInksPane({ role }: PaneProps) {
  const lots    = useQuery({ queryKey: ['ink-inventory'],     queryFn: () => getInkInventory() })
  const catalog = useQuery({ queryKey: ['ink-catalog-stock'], queryFn: getInkCatalogWithStock })
  if (lots.isPending || catalog.isPending) return <PaneLoading />
  return (
    <InkInventoryView
      initialLots={lots.data ?? []}
      inkCatalog={catalog.data ?? []}
      canManage={isWh(role)}
      canRequest={role !== 'USER'}
    />
  )
}

function InventoryPaperPane({ role }: PaneProps) {
  const lots    = useQuery({ queryKey: ['paper-inventory'],     queryFn: getPaperInventory })
  const catalog = useQuery({ queryKey: ['paper-catalog-stock'], queryFn: getPaperCatalogWithStock })
  if (lots.isPending || catalog.isPending) return <PaneLoading />
  return (
    <PaperInventoryView
      initialLots={lots.data ?? []}
      paperCatalog={catalog.data ?? []}
      canManage={isWh(role)}
      canRequest={role !== 'USER'}
    />
  )
}

function RequisitionsInksPane({ role }: PaneProps) {
  const reqs         = useQuery({ queryKey: ['requisitions'],        queryFn: () => getRequisitions() })
  const inkCatalog   = useQuery({ queryKey: ['ink-catalog-stock'],   queryFn: getInkCatalogWithStock })
  const paperCatalog = useQuery({ queryKey: ['paper-catalog-stock'], queryFn: getPaperCatalogWithStock })
  if (reqs.isPending || inkCatalog.isPending || paperCatalog.isPending) return <PaneLoading />
  return (
    <RequisitionsList
      initialRequisitions={reqs.data ?? []}
      canCreate={role !== 'USER'}
      canManage={isWh(role)}
      userRole={role}
      inkCatalog={inkCatalog.data ?? []}
      paperCatalog={paperCatalog.data ?? []}
      materialType="INK"
    />
  )
}

function RequisitionsPaperPane({ role }: PaneProps) {
  const reqs         = useQuery({ queryKey: ['requisitions'],        queryFn: () => getRequisitions() })
  const inkCatalog   = useQuery({ queryKey: ['ink-catalog-stock'],   queryFn: getInkCatalogWithStock })
  const paperCatalog = useQuery({ queryKey: ['paper-catalog-stock'], queryFn: getPaperCatalogWithStock })
  if (reqs.isPending || inkCatalog.isPending || paperCatalog.isPending) return <PaneLoading />
  return (
    <RequisitionsList
      initialRequisitions={reqs.data ?? []}
      canCreate={role !== 'USER'}
      canManage={isWh(role)}
      userRole={role}
      inkCatalog={inkCatalog.data ?? []}
      paperCatalog={paperCatalog.data ?? []}
      materialType="PAPER"
    />
  )
}

function OrdersInksPane({ role }: PaneProps) {
  const orders       = useQuery({ queryKey: ['purchase-orders', 'INK'], queryFn: () => getPurchaseOrders({ material_type: 'INK' }) })
  const providers    = useQuery({ queryKey: ['providers'],     queryFn: () => getProviders() })
  const inkCatalog   = useQuery({ queryKey: ['ink-catalog'],   queryFn: getInkCatalog })
  const paperCatalog = useQuery({ queryKey: ['paper-catalog'], queryFn: getPaperCatalog })
  if (orders.isPending || providers.isPending || inkCatalog.isPending || paperCatalog.isPending) return <PaneLoading />
  return (
    <OrdersList
      initialOrders={orders.data ?? []}
      materialType="INK"
      providers={providers.data ?? []}
      inkCatalog={inkCatalog.data ?? []}
      paperCatalog={paperCatalog.data ?? []}
      canCreate={role === 'ADMIN' || role === 'PURCHASER'}
      canReceive={isWh(role)}
    />
  )
}

function OrdersPaperPane({ role }: PaneProps) {
  const orders       = useQuery({ queryKey: ['purchase-orders', 'PAPER'], queryFn: () => getPurchaseOrders({ material_type: 'PAPER' }) })
  const providers    = useQuery({ queryKey: ['providers'],     queryFn: () => getProviders() })
  const inkCatalog   = useQuery({ queryKey: ['ink-catalog'],   queryFn: getInkCatalog })
  const paperCatalog = useQuery({ queryKey: ['paper-catalog'], queryFn: getPaperCatalog })
  if (orders.isPending || providers.isPending || inkCatalog.isPending || paperCatalog.isPending) return <PaneLoading />
  return (
    <OrdersList
      initialOrders={orders.data ?? []}
      materialType="PAPER"
      providers={providers.data ?? []}
      inkCatalog={inkCatalog.data ?? []}
      paperCatalog={paperCatalog.data ?? []}
      canCreate={role === 'ADMIN' || role === 'PURCHASER'}
      canReceive={isWh(role)}
    />
  )
}

// ── Catálogo ────────────────────────────────────────────────────────────────

function CatalogInksPane({ role }: PaneProps) {
  const items     = useQuery({ queryKey: ['ink-catalog'], queryFn: () => getInkCatalog() })
  const providers = useQuery({ queryKey: ['providers'],   queryFn: () => getProviders() })
  if (items.isPending || providers.isPending) return <PaneLoading />
  return <InkCatalogList items={items.data ?? []} providers={providers.data ?? []} canEdit={isWh(role)} />
}

function CatalogPaperPane({ role }: PaneProps) {
  const items     = useQuery({ queryKey: ['paper-catalog'], queryFn: () => getPaperCatalog() })
  const providers = useQuery({ queryKey: ['providers'],     queryFn: () => getProviders() })
  if (items.isPending || providers.isPending) return <PaneLoading />
  return <PaperCatalogList items={items.data ?? []} providers={providers.data ?? []} canEdit={isWh(role)} />
}

// ── Single-pane sections (no material) ────────────────────────────────────────

function ProvidersPane({ role }: PaneProps) {
  const providers = useQuery({ queryKey: ['providers'],             queryFn: () => getProviders() })
  const orders    = useQuery({ queryKey: ['purchase-orders', 'all'], queryFn: () => getPurchaseOrders() })
  if (providers.isPending || orders.isPending) return <PaneLoading />
  return <ProvidersList providers={providers.data ?? []} orders={orders.data ?? []} canEdit={role === 'ADMIN' || role === 'PURCHASER'} />
}

function SuppliesPane({ role }: PaneProps) {
  const categories = useQuery({ queryKey: ['supply-categories'], queryFn: () => getSupplyCategories() })
  if (categories.isPending) return <PaneLoading />
  return <SuppliesView categories={categories.data ?? []} canEdit={isWh(role)} />
}

function OutputsPane({ role }: PaneProps) {
  const reqs = useQuery({ queryKey: ['outputs-history'], queryFn: () => getRequisitions({ statuses: ['FULFILLED', 'PARTIAL'] }) })
  if (reqs.isPending) return <PaneLoading />
  return <OutputsHistoryList initialRequisitions={reqs.data ?? []} userRole={role} />
}

function UsersPane({ userId }: PaneProps) {
  const users = useQuery({ queryKey: ['users'], queryFn: () => getUsers() })
  if (users.isPending) return <PaneLoading />
  return <UsersList initialUsers={users.data ?? []} currentUserId={userId} />
}

function AuditPane(_: PaneProps) {
  const log   = useQuery({ queryKey: ['audit-log'],   queryFn: () => getAuditLog({ page: 1, pageSize: 50 }) })
  const stats = useQuery({ queryKey: ['audit-stats'], queryFn: () => getAuditStats() })
  const users = useQuery({ queryKey: ['users'],       queryFn: () => getUsers() })
  if (log.isPending || stats.isPending || users.isPending) return <PaneLoading />
  return (
    <AuditLogList
      initialData={log.data?.data ?? []}
      initialTotal={log.data?.total ?? 0}
      initialStats={stats.data!}
      users={users.data ?? []}
    />
  )
}

// ── Recepciones (material) ────────────────────────────────────────────────────

function ReceiptsPane({ role, material }: PaneProps & { material: 'INK' | 'PAPER' }) {
  const pending = useQuery({ queryKey: ['pending-quality'],  queryFn: () => getPendingQualityReceipts() })
  const history = useQuery({ queryKey: ['receipts-history'], queryFn: () => getAllReceipts() })
  if (pending.isPending || history.isPending) return <PaneLoading />
  const hist = history.data!
  return (
    <ReceiptsPageTabs
      defaultMaterial={material}
      canEdit={isWh(role)}
      initialPending={pending.data!}
      initialHistory={hist}
      statsBar={<ReceiptsStatsBar initialInk={hist.inkReceipts} initialPaper={hist.paperReceipts} material={material} />}
    />
  )
}

const ReceiptsInksPane  = (props: PaneProps) => <ReceiptsPane {...props} material="INK" />
const ReceiptsPaperPane = (props: PaneProps) => <ReceiptsPane {...props} material="PAPER" />

export type WorkspaceMaterial = 'inks' | 'paper'

export const MATERIAL_META: Record<WorkspaceMaterial, { label: string; icon: LucideIcon }> = {
  inks:  { label: 'Tintas', icon: Droplet  },
  paper: { label: 'Papel',  icon: FileText },
}

type PaneComponent = (props: PaneProps) => ReactNode

export type WorkspaceSectionDef = {
  key: string
  label: string
  /** If set, only these roles may select the section (mirrors sidebar access). */
  roles?: Role[]
} & (
  /** Material-based: one pane per material, shows the ink/paper toggle. */
  | { panes: Record<WorkspaceMaterial, PaneComponent>; pane?: undefined }
  /** Single: one pane, no material toggle. */
  | { pane: PaneComponent; panes?: undefined }
)

export const WORKSPACE_SECTIONS: WorkspaceSectionDef[] = [
  { key: 'inventory',    label: 'Inventario',    roles: ['ADMIN', 'WAREHOUSE_MANAGER', 'PRODUCER', 'USER'], panes: { inks: InventoryInksPane,    paper: InventoryPaperPane    } },
  { key: 'requisitions', label: 'Requisiciones', roles: ['ADMIN', 'WAREHOUSE_MANAGER', 'PRODUCER'],         panes: { inks: RequisitionsInksPane, paper: RequisitionsPaperPane } },
  { key: 'orders',       label: 'Órdenes',       roles: ['ADMIN', 'PURCHASER'],                             panes: { inks: OrdersInksPane,       paper: OrdersPaperPane       } },
  { key: 'catalog',      label: 'Catálogo',      roles: ['ADMIN', 'WAREHOUSE_MANAGER', 'PURCHASER'],        panes: { inks: CatalogInksPane,      paper: CatalogPaperPane      } },
  { key: 'receipts',     label: 'Recepciones',   roles: ['ADMIN', 'WAREHOUSE_MANAGER', 'PURCHASER'],        panes: { inks: ReceiptsInksPane,     paper: ReceiptsPaperPane     } },
  { key: 'providers',    label: 'Proveedores',   roles: ['ADMIN', 'PURCHASER'],                             pane: ProvidersPane },
  { key: 'supplies',     label: 'Suministros',   roles: ['ADMIN', 'WAREHOUSE_MANAGER'],                     pane: SuppliesPane  },
  { key: 'outputs',      label: 'Salidas',       roles: ['ADMIN', 'WAREHOUSE_MANAGER', 'PRODUCER'],         pane: OutputsPane },
  { key: 'users',        label: 'Usuarios',      roles: ['ADMIN'],                                          pane: UsersPane  },
  { key: 'audit',        label: 'Auditoría',     roles: ['ADMIN'],                                          pane: AuditPane  },
]

export const WORKSPACE_SECTION_MAP: Record<string, WorkspaceSectionDef> =
  Object.fromEntries(WORKSPACE_SECTIONS.map(s => [s.key, s]))

export function workspaceSectionsForRole(role: Role): WorkspaceSectionDef[] {
  return WORKSPACE_SECTIONS.filter(s => !s.roles || s.roles.includes(role))
}

/** Parse a `section-material` URL token into its parts, with role-aware fallback. */
export function parsePaneValue(
  value: string | null,
  sections: WorkspaceSectionDef[],
): { section: string; material: WorkspaceMaterial } {
  const fallback = sections[0]?.key ?? ''
  if (!value) return { section: fallback, material: 'inks' }
  const dash     = value.lastIndexOf('-')
  const section  = dash >= 0 ? value.slice(0, dash) : value
  const rawMat   = dash >= 0 ? value.slice(dash + 1) : 'inks'
  const material: WorkspaceMaterial = rawMat === 'paper' ? 'paper' : 'inks'
  const isValid  = sections.some(s => s.key === section)
  return { section: isValid ? section : fallback, material }
}

export const paneValue = (section: string, material: WorkspaceMaterial) => `${section}-${material}`
