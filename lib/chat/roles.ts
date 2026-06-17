import type { Database } from '@/types/database.types'

export type Role = Database['public']['Enums']['user_role']

/** Single source of truth for role display names (Spanish). */
export const ROLE_LABEL: Record<Role, string> = {
  ADMIN:             'Admin',
  PURCHASER:         'Compras',
  WAREHOUSE_MANAGER: 'Almacén',
  PRODUCER:          'Producción',
  USER:              'Usuario',
}

/** Stable order for listing roles (most → least privileged). */
export const ROLE_ORDER: Role[] = ['ADMIN', 'PURCHASER', 'WAREHOUSE_MANAGER', 'PRODUCER', 'USER']

const ROLE_SET = new Set<string>(ROLE_ORDER)

export function isRole(value: string): value is Role {
  return ROLE_SET.has(value)
}

// ── Role @mentions ───────────────────────────────────────────────────────────
// A role mention reuses the user-mention machinery: it's a Tiptap mention node
// whose `data-id` is `role:<ROLE>` instead of a user id. The server expands it to
// every enabled user holding that role.

export const ROLE_MENTION_PREFIX = 'role:'

export function roleMentionId(role: Role): string {
  return `${ROLE_MENTION_PREFIX}${role}`
}

/** Returns the Role for a `role:<ROLE>` mention id, or null if it isn't one. */
export function parseRoleMentionId(id: string): Role | null {
  if (!id.startsWith(ROLE_MENTION_PREFIX)) return null
  const role = id.slice(ROLE_MENTION_PREFIX.length)
  return isRole(role) ? role : null
}
