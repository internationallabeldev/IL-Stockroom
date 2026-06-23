'use client'

import { motion } from 'framer-motion'
import { ProviderCardSkeleton } from './provider-card-skeleton'

const COUNT = 6

/**
 * Grid de ProviderCardSkeleton que replica el grid real de ProvidersList
 * (mismas columnas responsive por container query). Las tarjetas entran con un
 * stagger sutil vía Framer Motion, como si la tinta fuera cargando fila a fila.
 */
export function ProvidersListSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando proveedores" className="@container">
      <div className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4 gap-4">
        {Array.from({ length: COUNT }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <ProviderCardSkeleton />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
