import type { CSSProperties } from 'react'

export const PRODUCTS = [
  { num: '01', name: 'Etiquetas', desc: 'Etiquetas de alta precisión para todo tipo de envase y empaque industrial o comercial.' },
  { num: '02', name: 'Booklet Label', desc: 'Etiquetas tipo booklet con múltiples páginas para información técnica y regulatoria extensa.' },
  { num: '03', name: 'Plegadizo', desc: 'Cajas plegadizas con diseño estructural y acabados que comunican calidad en el punto de venta.' },
  { num: '04', name: 'Manga Termoencogible', desc: 'Mangas de contracción térmica de cobertura total para branding de 360° sobre el envase.' },
] as const

/* cada especialidad es una "placa" de impresión: C · M · Y · K */
export const SPECIALTIES: {
  plate: string
  accent: string
  name: string[]
  desc: string
  texture: CSSProperties
}[] = [
  {
    plate: 'C',
    accent: '#00AEEF',
    name: ['HOT', 'STAMPING'],
    desc: 'Estampado en caliente para acabados metálicos de lujo sobre cualquier sustrato.',
    texture: {
      backgroundImage:
        'repeating-linear-gradient(115deg, rgba(0,0,0,0.45) 0 2px, transparent 2px 16px), linear-gradient(135deg, #00131C 0%, #006B94 35%, #7FDBFF 50%, #00AEEF 62%, #001824 100%)',
    },
  },
  {
    plate: 'M',
    accent: '#EC008C',
    name: ['COLD', 'FOIL'],
    desc: 'Aplicación de foil en frío con resolución de imagen de alta definición.',
    texture: {
      backgroundImage:
        'repeating-linear-gradient(65deg, rgba(0,0,0,0.45) 0 2px, transparent 2px 16px), linear-gradient(315deg, #1C0011 0%, #94005B 35%, #FF7FD0 50%, #EC008C 62%, #240018 100%)',
    },
  },
  {
    plate: 'Y',
    accent: '#FFE600',
    name: ['EMBOSSING'],
    desc: 'Relieve y grabado en bajo o alto relieve para tactilidad y distinción visual.',
    texture: {
      backgroundImage:
        'radial-gradient(circle, rgba(255,230,0,0.45) 1.5px, transparent 2.5px), linear-gradient(180deg, #161300 0%, #2A2400 100%)',
      backgroundSize: '26px 26px, 100% 100%',
    },
  },
  {
    plate: 'K',
    accent: '#F5F2EA',
    name: ['LAMINADO'],
    desc: 'Laminación brillante, mate o soft-touch que protege e intensifica los colores.',
    texture: {
      backgroundImage:
        'linear-gradient(100deg, transparent 38%, rgba(245,242,234,0.22) 49%, rgba(245,242,234,0.05) 52%, transparent 62%), linear-gradient(180deg, #0B0B0B 0%, #1E1E1E 100%)',
    },
  },
]

export const PARTNERS = ['Gallus', 'Siegwerk Group', 'SGS — GMI Certified'] as const

export const CERTIFICATIONS = ['ISO 9001', 'PROFEPA — Industria Limpia', 'GMI Certified Printer'] as const

export const NAV_LINKS = [
  { href: '#nosotros', label: 'Nosotros' },
  { href: '#productos', label: 'Productos' },
  { href: '#especialidades', label: 'Tecnología' },
  { href: '#contacto', label: 'Contacto' },
] as const
