import { z } from 'zod'

export const SUPPLY_TYPES = ['INK', 'PAPER', 'SUPPLIES'] as const
export type SupplyType = typeof SUPPLY_TYPES[number]

export const providerSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(7, 'Teléfono inválido'),
  whatsapp: z.string().min(7, 'WhatsApp inválido').nullable().optional(),
  address: z.string().min(5, 'La dirección es requerida'),
  contact_person: z.string().nullable().optional(),
  provider_type: z.enum(['INK_SUPPLIER', 'PAPER_SUPPLIER', 'SUPPLY_SUPPLIER', 'BOTH']),
  logo_url: z.string().url('URL de logo inválida').nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  supply_types: z.array(z.enum(SUPPLY_TYPES)).nullable().optional(),
}).refine(
  (data) => data.provider_type !== 'BOTH' || (Array.isArray(data.supply_types) && data.supply_types.length >= 2),
  { message: 'Selecciona al menos 2 tipos para proveedor múltiple', path: ['supply_types'] }
)

export type ProviderFormValues = z.infer<typeof providerSchema>
