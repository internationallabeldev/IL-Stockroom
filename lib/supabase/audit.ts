import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Registers the current user in the PostgreSQL session so the audit trigger
 * can capture `performed_by`. Call this immediately before any mutation in a
 * Server Action. Falls back to auth.uid() inside the trigger for requests that
 * carry a user JWT (regular createClient).
 */
export async function setAuditUser(supabase: SupabaseClient, userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc('set_current_user_id', { user_id: userId })
}
