import type { Metadata } from 'next'
import { LandingExperience } from '@/components/landing/landing-experience'

export const metadata: Metadata = {
  title: 'International Label — Materiales de Empaque de Alta Calidad',
  description:
    'Empresa 100% mexicana especializada en etiquetas, plegadizos y mangas termoencogibles con tecnología de vanguardia.',
}

export default function LandingPage() {
  return <LandingExperience />
}
