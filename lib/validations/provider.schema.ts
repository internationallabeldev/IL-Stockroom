import { z } from 'zod'

export const providerSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(7, 'Teléfono inválido'),
  whatsapp: z.string().min(7, 'WhatsApp inválido').nullable().optional(),
  address: z.string().min(5, 'La dirección es requerida'),
  contact_person: z.string().nullable().optional(),
  provider_type: z.enum(['INK_SUPPLIER', 'PAPER_SUPPLIER', 'BOTH']),
  logo_url: z.string().url('URL de logo inválida').nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
})

export type ProviderFormValues = z.infer<typeof providerSchema>
