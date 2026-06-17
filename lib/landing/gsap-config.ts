'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
  ScrollTrigger.config({ ignoreMobileResize: true })
}

export { gsap, ScrollTrigger, useGSAP }

/* media conditions shared by every section's gsap.matchMedia() */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)'
export const MOTION_REDUCE = '(prefers-reduced-motion: reduce)'
export const DESKTOP = '(min-width: 768px)'

export const INK = '#1A1A1A'
export const PAPER = '#F5F2EA'
export const CMYK = ['#00AEEF', '#EC008C', '#FFE600'] as const
