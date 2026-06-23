import { CmykSkeleton } from '@/components/ui/cmyk-skeleton'

// Patrón "registro de color": rombos CMYK casi invisibles para el placeholder
// del logo del proveedor, en vez de un gris sólido. Duplicado aquí de forma
// independiente (mismo lenguaje visual que components/auth/cmyk-pattern.tsx)
// para mantener el piloto aislado y fácil de borrar.
function RegistrationPattern() {
  const pts = (cx: number, cy: number, h: number) =>
    `${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}`
  const CMYK = ['#00AEEF', '#EC008C', '#FFE600', '#1A1A1A'] as const
  return (
    <svg className="absolute inset-0 size-full" aria-hidden>
      <defs>
        <pattern id="prov-skel-registration" width="16" height="16" patternUnits="userSpaceOnUse">
          <polygon points={pts(4, 4, 4)}   fill="none" stroke={CMYK[0]} strokeWidth={0.5} strokeOpacity={0.2} />
          <polygon points={pts(12, 4, 4)}  fill="none" stroke={CMYK[1]} strokeWidth={0.5} strokeOpacity={0.2} />
          <polygon points={pts(4, 12, 4)}  fill="none" stroke={CMYK[2]} strokeWidth={0.5} strokeOpacity={0.2} />
          <polygon points={pts(12, 12, 4)} fill="none" stroke={CMYK[3]} strokeWidth={0.5} strokeOpacity={0.14} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#prov-skel-registration)" />
    </svg>
  )
}

/**
 * Skeleton que replica el layout de provider-card.tsx: mismo contenedor,
 * padding y estructura (header con logo + nombre + badge, bloque de contacto
 * de 3 líneas, dirección y botones de acción). El logo usa el patrón de
 * registro de color; el resto usa CmykSkeleton (shimmer para texto, pulse-cmyk
 * para piezas pequeñas).
 */
export function ProviderCardSkeleton() {
  return (
    <div className="bg-card border border-border/50 shadow-sm dark:border-white/10 p-6 flex flex-col gap-4">
      {/* Header: logo + nombre/contacto + badge de tipo */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo: placeholder con patrón de registro de color */}
          <div className="relative size-10 shrink-0 overflow-hidden border border-border bg-muted/40">
            <RegistrationPattern />
          </div>
          <div className="min-w-0 space-y-1.5">
            <CmykSkeleton className="h-3.5 w-32" />
            <CmykSkeleton variant="pulse-cmyk" className="h-2.5 w-20" />
          </div>
        </div>
        {/* Badge de tipo */}
        <CmykSkeleton variant="pulse-cmyk" className="h-4 w-16 shrink-0" />
      </div>

      {/* Contacto: email, teléfono, whatsapp */}
      <div className="space-y-2 border-t border-border/50 pt-4">
        {[40, 28, 32].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <CmykSkeleton variant="pulse-cmyk" className="size-3 shrink-0 rounded-sm" />
            <CmykSkeleton className="h-2.5" style={{ width: `${w * 0.25}rem` }} />
          </div>
        ))}
      </div>

      {/* Dirección */}
      <CmykSkeleton className="h-2.5 w-3/4" />

      {/* Acciones */}
      <div className="flex gap-2 border-t border-border/50 pt-3">
        <CmykSkeleton className="h-7 flex-1" />
        <CmykSkeleton className="h-7 flex-1" />
      </div>
    </div>
  )
}
