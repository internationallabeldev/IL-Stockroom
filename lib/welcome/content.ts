import type { LucideIcon } from 'lucide-react'
import {
  Truck, BookOpen, ShoppingCart, PackageCheck, Boxes, PackageMinus,
  ClipboardList, Package, Users, Settings, ScrollText, MessagesSquare,
} from 'lucide-react'
import type { Database } from '@/types/database.types'

export type UserRole = Database['public']['Enums']['user_role']

export type WelcomeModule = {
  label: string
  desc:  string
  icon:  LucideIcon
  href:  string
}

// Routes are pinned to pages that actually exist (some sections split ink/paper
// and have no landing route, so we link the ink variant). "Chat" is a global
// floating widget — it has no route, so it lands on the dashboard.
const M = {
  providers:    { label: 'Proveedores',      icon: Truck,         href: '/dashboard/providers' },
  catalog:      { label: 'Catálogos',        icon: BookOpen,      href: '/dashboard/catalog/inks' },
  orders:       { label: 'Órdenes de compra', icon: ShoppingCart, href: '/dashboard/orders/ink' },
  receipts:     { label: 'Recepciones',      icon: PackageCheck,  href: '/dashboard/receipts' },
  inventory:    { label: 'Inventario',       icon: Boxes,         href: '/dashboard/inventory' },
  outputs:      { label: 'Salidas',          icon: PackageMinus,  href: '/dashboard/outputs/history' },
  requisitions: { label: 'Requisiciones',    icon: ClipboardList, href: '/dashboard/requisitions' },
  supplies:     { label: 'Consumibles',      icon: Package,       href: '/dashboard/supplies' },
  users:        { label: 'Usuarios',         icon: Users,         href: '/dashboard/users' },
  settings:     { label: 'Configuración',    icon: Settings,      href: '/dashboard/settings/app' },
  audit:        { label: 'Auditoría',        icon: ScrollText,    href: '/dashboard/audit' },
  chat:         { label: 'Chat',             icon: MessagesSquare, href: '/dashboard' },
} as const

const mod = (base: typeof M[keyof typeof M], desc: string): WelcomeModule => ({ ...base, desc })

export const ROLE_MODULES: Record<UserRole, WelcomeModule[]> = {
  ADMIN: [
    mod(M.providers,    'Gestiona proveedores'),
    mod(M.catalog,      'Tintas y papeles'),
    mod(M.orders,       'Crea y da seguimiento'),
    mod(M.receipts,     'Recepción de materiales'),
    mod(M.inventory,    'Stock de tintas y papel'),
    mod(M.outputs,      'Historial de salidas'),
    mod(M.requisitions, 'Requisiciones de producción'),
    mod(M.supplies,     'Consumibles y alertas'),
    mod(M.users,        'Administra el equipo'),
    mod(M.settings,     'Ajustes del sistema'),
    mod(M.audit,        'Registro de actividad'),
    mod(M.chat,         'Comunícate con el equipo'),
  ],
  PURCHASER: [
    mod(M.providers,    'Consulta proveedores'),
    mod(M.catalog,      'Consulta tintas y papeles'),
    mod(M.orders,       'Gestiona órdenes de compra'),
    mod(M.receipts,     'Consulta recepciones'),
    mod(M.inventory,    'Consulta el inventario'),
    mod(M.supplies,     'Consulta consumibles'),
    mod(M.chat,         'Comunícate con el equipo'),
  ],
  WAREHOUSE_MANAGER: [
    mod(M.catalog,      'Gestiona tintas y papeles'),
    mod(M.receipts,     'Registra recepciones'),
    mod(M.inventory,    'Gestiona el inventario'),
    mod(M.outputs,      'Registra salidas'),
    mod(M.supplies,     'Gestiona consumibles'),
    mod(M.requisitions, 'Atiende requisiciones'),
    mod(M.chat,         'Comunícate con el equipo'),
  ],
  PRODUCER: [
    mod(M.inventory,    'Consulta y solicita material'),
    mod(M.requisitions, 'Crea y sigue tus requisiciones'),
    mod(M.supplies,     'Consulta consumibles'),
    mod(M.chat,         'Comunícate con el equipo'),
  ],
  USER: [
    mod(M.inventory,    'Consulta el inventario'),
    mod(M.orders,       'Consulta órdenes de compra'),
    mod(M.supplies,     'Consulta consumibles'),
    mod(M.chat,         'Comunícate con el equipo'),
  ],
}

export const ROLE_STEPS: Record<UserRole, string[]> = {
  ADMIN: [
    'Configura los datos de la empresa en Configuración',
    'Invita a tu equipo desde Usuarios',
    'Agrega proveedores y catálogos de materiales',
    'Explora el dashboard general',
  ],
  PURCHASER: [
    'Completa tu perfil (foto y apodo)',
    'Revisa el catálogo de tintas y papeles',
    'Crea tu primera orden de compra',
    'Únete al canal general del chat',
  ],
  WAREHOUSE_MANAGER: [
    'Completa tu perfil (foto y apodo)',
    'Revisa el inventario actual de tintas y papel',
    'Revisa las requisiciones pendientes',
    'Únete al canal general del chat',
  ],
  PRODUCER: [
    'Completa tu perfil (foto y apodo)',
    'Revisa el stock disponible de tintas y papel',
    'Crea tu primera requisición de material',
    'Únete al canal general del chat',
  ],
  USER: [
    'Completa tu perfil (foto y apodo)',
    'Explora el inventario actual',
    'Únete al canal general del chat',
  ],
}
