'use client'

import { motion } from 'framer-motion'

// Tarjeta centrada con glassmorphism técnico, oscura — sin radio, línea de
// acento de un solo color vinculada a --cmyk-accent (la placa activa en el
// fondo), animada (scaleX 0 → 1) al montar.
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-[min(480px,92vw)] rounded-none border border-white/10 bg-[#0A0A0A]/75 p-12 backdrop-blur-[24px] backdrop-saturate-[1.8] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_64px_rgba(0,0,0,0.6),0_0_80px_rgba(0,174,239,0.04)]"
    >
      <motion.div
        className="absolute left-0 top-0 h-0.5 w-full origin-left bg-(--cmyk-accent)"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      {children}
    </div>
  )
}
