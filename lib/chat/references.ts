// Taxonomy for the chat "/" reference picker: domain → section → element.
// Keys are stable identifiers (used in the typed path /tinta/inventario/…);
// labels are what the user sees in Spanish.

export type RefDomain = 'tinta' | 'papel' | 'suministro'
export type RefSection = 'catalogo' | 'inventario' | 'orden' | 'requisicion' | 'salida'

export const REF_DOMAINS: { key: RefDomain; label: string }[] = [
  { key: 'tinta', label: 'Tinta' },
  { key: 'papel', label: 'Papel' },
  { key: 'suministro', label: 'Suministro' },
]

const MATERIAL_SECTIONS: { key: RefSection; label: string }[] = [
  { key: 'catalogo', label: 'Catálogo' },
  { key: 'inventario', label: 'Inventario' },
  { key: 'orden', label: 'Órdenes de compra' },
  { key: 'requisicion', label: 'Requisiciones' },
  { key: 'salida', label: 'Salidas' },
]

export const REF_SECTIONS: Record<RefDomain, { key: RefSection; label: string }[]> = {
  tinta: MATERIAL_SECTIONS,
  papel: MATERIAL_SECTIONS,
  suministro: [{ key: 'inventario', label: 'Inventario' }],
}

export const DOMAIN_LABEL: Record<RefDomain, string> = {
  tinta: 'Tinta',
  papel: 'Papel',
  suministro: 'Suministro',
}

export const SECTION_LABEL: Record<RefSection, string> = {
  catalogo: 'Catálogo',
  inventario: 'Inventario',
  orden: 'Órdenes de compra',
  requisicion: 'Requisiciones',
  salida: 'Salidas',
}

export function isRefDomain(s: string): s is RefDomain {
  return s === 'tinta' || s === 'papel' || s === 'suministro'
}

export function isRefSection(domain: RefDomain, s: string): s is RefSection {
  return REF_SECTIONS[domain].some(sec => sec.key === s)
}
