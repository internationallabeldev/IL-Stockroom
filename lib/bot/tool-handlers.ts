import { createAdminClient } from '@/lib/supabase/admin'

/** Arguments a tool may receive (all optional, validated loosely — the model fills them). */
type ToolArgs = {
  ink_name?: string
  paper_name?: string
  category?: string
  only_low_stock?: boolean
  only_critical?: boolean
  status?: string
  material_type?: string
  provider_type?: string
  days?: number
}

/** Normalize a free-text search term from the model/user: strips the `/` left by
 *  reference chips and any chars that break PostgREST's `.or()` syntax (`,()`).
 *  Returns undefined when nothing usable remains. */
function cleanTerm(s?: string): string | undefined {
  if (!s) return undefined
  const t = s.replace(/[/(),]/g, ' ').replace(/\s+/g, ' ').trim()
  return t || undefined
}

/** Execute a read-only bot tool and return its result as a JSON string.
 *  Uses the service-role client (bypasses RLS) but only ever SELECTs non-sensitive
 *  inventory data — never users' credentials, tokens or keys. */
export async function executeTool(
  toolName: string,
  args: ToolArgs,
  _requestingUserId: string,
): Promise<string> {
  const supabase = createAdminClient()

  try {
    switch (toolName) {
      case 'get_ink_stock': {
        let query = supabase
          .from('ink_catalog')
          .select('name, code, ink_type, current_stock_kg, min_stock_kg, providers(name, phone, email, contact_person)')
          .eq('enabled', true)
          .order('name')
        const inkTerm = cleanTerm(args.ink_name)
        if (inkTerm) query = query.or(`name.ilike.%${inkTerm}%,code.ilike.%${inkTerm}%`)

        const { data, error } = await query
        if (error) return JSON.stringify({ error: error.message })
        let rows = (data ?? []).map(({ providers, ...r }) => ({
          ...r,
          below_min: (r.current_stock_kg ?? 0) < (r.min_stock_kg ?? 0),
          provider: providers ?? null,
        }))
        if (args.only_low_stock) rows = rows.filter(r => r.below_min)
        return JSON.stringify(rows)
      }

      case 'get_paper_stock': {
        let query = supabase
          .from('paper_catalog')
          .select('name, code, material, weight_gsm, current_stock_m2, min_stock_m2, providers(name, phone, email, contact_person)')
          .eq('enabled', true)
          .order('name')
        const paperTerm = cleanTerm(args.paper_name)
        if (paperTerm) query = query.or(`name.ilike.%${paperTerm}%,code.ilike.%${paperTerm}%`)

        const { data, error } = await query
        if (error) return JSON.stringify({ error: error.message })
        let rows = (data ?? []).map(({ providers, ...r }) => ({
          ...r,
          below_min: (r.current_stock_m2 ?? 0) < (r.min_stock_m2 ?? 0),
          provider: providers ?? null,
        }))
        if (args.only_low_stock) rows = rows.filter(r => r.below_min)
        return JSON.stringify(rows)
      }

      case 'get_supply_stock': {
        const { data, error } = await supabase
          .from('supply_items')
          .select('name, unit, quantity_current, quantity_minimum, quantity_warning, supply_categories(name)')
          .eq('enabled', true)
          .order('name')
        if (error) return JSON.stringify({ error: error.message })
        let rows = (data ?? []).map(r => ({
          name: r.name,
          unit: r.unit,
          quantity_current: r.quantity_current,
          quantity_minimum: r.quantity_minimum,
          category: (r.supply_categories as { name: string } | null)?.name ?? null,
          critical: r.quantity_current <= r.quantity_minimum,
        }))
        const catTerm = cleanTerm(args.category)
        if (catTerm) {
          const term = catTerm.toLowerCase()
          rows = rows.filter(r => r.category?.toLowerCase().includes(term))
        }
        if (args.only_critical) rows = rows.filter(r => r.critical)
        return JSON.stringify(rows)
      }

      case 'get_pending_requisitions': {
        const statuses = (args.status ? [args.status] : ['PENDING', 'APPROVED', 'PARTIAL']) as never[]
        const { data, error } = await supabase
          .from('production_requisitions')
          .select('requisition_number, material_type, status, production_order, request_date, requested_by:users!production_requisitions_requested_by_fkey(nickname, first_name, last_name)')
          .in('status', statuses)
          .order('request_date', { ascending: true })
        if (error) return JSON.stringify({ error: error.message })
        const rows = (data ?? []).map(r => {
          const u = r.requested_by as { nickname: string | null; first_name: string; last_name: string } | null
          return {
            requisition_number: r.requisition_number,
            material_type: r.material_type,
            status: r.status,
            production_order: r.production_order,
            request_date: r.request_date,
            requested_by: u ? u.nickname || `${u.first_name} ${u.last_name}` : null,
          }
        })
        return JSON.stringify(rows)
      }

      case 'get_purchase_orders': {
        let query = supabase
          .from('purchase_orders')
          .select('order_number, material_type, status, request_date, expected_delivery_date, providers(name)')
          .order('request_date', { ascending: false })
          .limit(50)
        if (args.status) query = query.eq('status', args.status as never)
        if (args.material_type) query = query.eq('material_type', args.material_type as never)

        const { data, error } = await query
        if (error) return JSON.stringify({ error: error.message })
        const rows = (data ?? []).map(r => ({
          order_number: r.order_number,
          material_type: r.material_type,
          status: r.status,
          request_date: r.request_date,
          expected_delivery_date: r.expected_delivery_date,
          provider: (r.providers as { name: string } | null)?.name ?? null,
        }))
        return JSON.stringify(rows)
      }

      case 'get_low_stock_alerts': {
        const [inks, papers, supplies] = await Promise.all([
          supabase.from('ink_catalog').select('name, code, current_stock_kg, min_stock_kg').eq('enabled', true),
          supabase.from('paper_catalog').select('name, code, current_stock_m2, min_stock_m2').eq('enabled', true),
          supabase.from('supply_items').select('name, unit, quantity_current, quantity_minimum').eq('enabled', true),
        ])
        return JSON.stringify({
          inks: (inks.data ?? [])
            .filter(r => (r.current_stock_kg ?? 0) < (r.min_stock_kg ?? 0))
            .map(r => ({ name: r.name, code: r.code, current_kg: r.current_stock_kg, min_kg: r.min_stock_kg })),
          papers: (papers.data ?? [])
            .filter(r => (r.current_stock_m2 ?? 0) < (r.min_stock_m2 ?? 0))
            .map(r => ({ name: r.name, code: r.code, current_m2: r.current_stock_m2, min_m2: r.min_stock_m2 })),
          supplies: (supplies.data ?? [])
            .filter(r => r.quantity_current <= r.quantity_minimum)
            .map(r => ({ name: r.name, current: r.quantity_current, min: r.quantity_minimum, unit: r.unit })),
        })
      }

      case 'get_recent_movements': {
        const days = typeof args.days === 'number' && args.days > 0 ? args.days : 7
        const since = new Date(Date.now() - days * 86400000).toISOString()
        const type = args.material_type
        const result: Record<string, unknown> = {}

        if (!type || type === 'INK') {
          const [receipts, outputs] = await Promise.all([
            supabase.from('ink_receipts').select('internal_batch, kg_received, receipt_date').gte('created_at', since).order('created_at', { ascending: false }).limit(25),
            supabase.from('ink_outputs').select('kg_delivered, output_date').gte('created_at', since).order('created_at', { ascending: false }).limit(25),
          ])
          result.ink_receipts = receipts.data ?? []
          result.ink_outputs = outputs.data ?? []
        }
        if (!type || type === 'PAPER') {
          const [receipts, outputs] = await Promise.all([
            supabase.from('paper_receipts').select('internal_batch, length_m, width_m, receipt_date').gte('created_at', since).order('created_at', { ascending: false }).limit(25),
            supabase.from('paper_outputs').select('length_m_delivered, width_m_delivered, output_date').gte('created_at', since).order('created_at', { ascending: false }).limit(25),
          ])
          result.paper_receipts = receipts.data ?? []
          result.paper_outputs = outputs.data ?? []
        }
        if (!type || type === 'SUPPLY') {
          const { data } = await supabase
            .from('supply_movements')
            .select('movement_type, quantity, quantity_after, created_at, supply_items(name)')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(25)
          result.supply_movements = (data ?? []).map(r => ({
            movement_type: r.movement_type,
            quantity: r.quantity,
            quantity_after: r.quantity_after,
            created_at: r.created_at,
            item: (r.supply_items as { name: string } | null)?.name ?? null,
          }))
        }
        return JSON.stringify(result)
      }

      case 'get_providers': {
        let query = supabase
          .from('providers')
          .select('name, provider_type, contact_person, phone, email')
          .eq('enabled', true)
          .order('name')
        if (args.provider_type) query = query.eq('provider_type', args.provider_type as never)

        const { data, error } = await query
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify(data ?? [])
      }

      default:
        return JSON.stringify({ error: `Herramienta no reconocida: ${toolName}` })
    }
  } catch (e) {
    return JSON.stringify({ error: e instanceof Error ? e.message : 'Error ejecutando la herramienta' })
  }
}
