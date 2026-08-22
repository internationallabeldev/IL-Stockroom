import { cn } from '@/lib/utils'

type Props = React.ComponentProps<'div'> & {
  variant?: 'shimmer' | 'pulse-cmyk'
}

/**
 * Skeleton temático del sistema (identidad CMYK / imprenta). Reemplazo del
 * Skeleton genérico de shadcn para los loading states — piloto en proveedores.
 *
 * - variant="shimmer"    → gradiente diagonal CMYK corriendo de izquierda a
 *                          derecha (como tinta corriendo). Ideal para barras y
 *                          superficies grandes.
 * - variant="pulse-cmyk" → pulse cuyo color de fondo cicla por los 4 colores
 *                          CMYK a muy baja opacidad. Ideal para piezas pequeñas
 *                          (píldoras, iconos, badges).
 *
 * El ciclo de color es 100% CSS (ver app/globals.css). No usa un timer JS ni
 * depende del ciclo de --cmyk-accent, que no corre en el dashboard. Respeta
 * prefers-reduced-motion (el shimmer cae a un pulse plano sin gradiente).
 */
export function CmykSkeleton({ className, variant = 'shimmer', ...props }: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        variant === 'shimmer' ? 'cmyk-skeleton-shimmer' : 'cmyk-skeleton-pulse',
        className,
      )}
      {...props}
    />
  )
}
