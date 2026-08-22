'use client'

import { motion } from 'framer-motion'
import { SPECIALTIES } from '@/lib/landing/data'

type Props = {
  index: number
  reduced: boolean
}

// Texturas de "placa" (C·M·Y·K) de la sección Tecnología del landing, como
// fondo ambiental. Cada cambio de placa conserva su animación de entrada
// original (wipe circular, igual que esp-texture en especialidades-section)
// en vez de un simple cross-fade — la placa anterior queda debajo, fija,
// mientras la nueva se revela encima.
export function CmykBackdropCycler({ index, reduced }: Props) {
  const prev = SPECIALTIES[(index - 1 + SPECIALTIES.length) % SPECIALTIES.length]
  const curr = SPECIALTIES[index]

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={prev.texture} />

      {reduced ? (
        <div className="absolute inset-0" style={curr.texture} />
      ) : (
        <motion.div
          key={curr.plate}
          className="absolute inset-0"
          style={curr.texture}
          initial={{ clipPath: 'circle(0% at 50% 45%)' }}
          animate={{ clipPath: 'circle(125% at 50% 45%)' }}
          transition={{ duration: 2.2, ease: 'easeInOut' }}
        />
      )}

      <div className="absolute inset-0 bg-[#1A1A1A]/85" />
    </div>
  )
}
