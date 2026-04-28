import { z } from 'zod'

export type DeliveryAddress = {
  calle: string
  ext: string
  int: string
  colonia: string
  ciudad: string
  estado: string
  cp: string
}

export const EMPTY_ADDRESS: DeliveryAddress = {
  calle: '', ext: '', int: '', colonia: '', ciudad: '', estado: '', cp: '',
}

export function formatDeliveryAddress(a: DeliveryAddress): string {
  const street  = `${a.calle.trim()} ${a.ext.trim()}`.trim()
  const intPart = a.int.trim()     ? `, Int. ${a.int.trim()}`       : ''
  const col     = a.colonia.trim() ? `, Col. ${a.colonia.trim()}`    : ''
  const city    = a.ciudad.trim()  ? `, ${a.ciudad.trim()}`          : ''
  const state   = a.estado.trim()  ? `, ${a.estado.trim()}`          : ''
  const zip     = a.cp.trim()      ? `, C.P. ${a.cp.trim()}`         : ''
  return `${street}${intPart}${col}${city}${state}${zip}`
}

export function parseDeliveryAddress(str: string): DeliveryAddress {
  try {
    const parts  = str.split(', ')
    const cpIdx  = parts.findIndex(p => p.startsWith('C.P. '))
    const cp     = cpIdx >= 0 ? parts[cpIdx].replace('C.P. ', '') : ''
    const estado = cpIdx >= 1 ? parts[cpIdx - 1] : ''
    const ciudad = cpIdx >= 2 ? parts[cpIdx - 2] : ''
    const colIdx = parts.findIndex(p => p.startsWith('Col. '))
    const colonia = colIdx >= 0 ? parts[colIdx].replace('Col. ', '') : ''
    const intIdx  = parts.findIndex(p => p.startsWith('Int. '))
    const int_    = intIdx >= 0 ? parts[intIdx].replace('Int. ', '') : ''
    const streetEnd = Math.min(...[colIdx, cpIdx, intIdx].filter(i => i > 0))
    const streetStr = parts.slice(0, isFinite(streetEnd) ? streetEnd : parts.length).join(', ')
    const lastSpace = streetStr.lastIndexOf(' ')
    const calle = lastSpace > 0 ? streetStr.slice(0, lastSpace) : streetStr
    const ext   = lastSpace > 0 ? streetStr.slice(lastSpace + 1) : ''
    return { calle, ext, int: int_, colonia, ciudad, estado, cp }
  } catch {
    return { ...EMPTY_ADDRESS, calle: str }
  }
}

export const MEXICAN_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango',
  'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
  'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
  'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
  'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
] as const

export const INK_ITEM_SCHEMA = z.object({
  ink_catalog_id: z.number().int().positive('Selecciona una tinta'),
  units_ordered:  z.number().int().min(1, 'Mínimo 1 unidad'),
  kg_per_unit:    z.number().positive('Debe ser mayor a 0'),
  item_notes:     z.string().nullable().optional(),
})

export const PAPER_ITEM_SCHEMA = z.object({
  paper_catalog_id:   z.number().int().positive('Selecciona un papel'),
  units_ordered:      z.number().int().min(1, 'Mínimo 1 unidad'),
  length_m_per_unit:  z.number().positive('Debe ser mayor a 0'),
  width_m:            z.number().positive('Debe ser mayor a 0'),
  item_notes:         z.string().nullable().optional(),
})

export const createPurchaseOrderSchema = z.object({
  provider_id:            z.number().int().positive('Selecciona un proveedor'),
  material_type:          z.enum(['INK', 'PAPER']),
  request_date:           z.string().min(1, 'La fecha es requerida'),
  expected_delivery_date: z.string().nullable().optional(),
  payment_method:         z.string().min(1, 'Método de pago requerido'),
  shipment_method:        z.string().min(1, 'Método de envío requerido'),
  delivery_place:         z.string().min(1, 'Lugar de entrega requerido'),
  notes:                  z.string().nullable().optional(),
  ink_items:              z.array(INK_ITEM_SCHEMA).optional(),
  paper_items:            z.array(PAPER_ITEM_SCHEMA).optional(),
}).refine(
  d => d.material_type === 'INK'
    ? (d.ink_items?.length ?? 0) > 0
    : (d.paper_items?.length ?? 0) > 0,
  { message: 'Agrega al menos un artículo', path: ['items'] }
)

export const updatePurchaseOrderSchema = z.object({
  expected_delivery_date: z.string().nullable().optional(),
  payment_method:         z.string().min(1).optional(),
  shipment_method:        z.string().min(1).optional(),
  delivery_place:         z.string().min(1).optional(),
  notes:                  z.string().nullable().optional(),
  ink_items:              z.array(INK_ITEM_SCHEMA).optional(),
  paper_items:            z.array(PAPER_ITEM_SCHEMA).optional(),
})

export type CreatePurchaseOrderValues = z.infer<typeof createPurchaseOrderSchema>
export type UpdatePurchaseOrderValues = z.infer<typeof updatePurchaseOrderSchema>
export type InkItemValues   = z.infer<typeof INK_ITEM_SCHEMA>
export type PaperItemValues = z.infer<typeof PAPER_ITEM_SCHEMA>

export const PAYMENT_METHODS  = ['Transferencia', 'Cheque', 'Efectivo', 'Crédito 30 días', 'Crédito 60 días'] as const
export const SHIPMENT_METHODS = ['Proveedor entrega', 'Recolección en planta', 'Paquetería', 'Mensajería'] as const
