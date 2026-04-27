import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Bypasses RLS — only use in server actions that already enforce authorization
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
