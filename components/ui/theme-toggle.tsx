'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="size-8" />

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="flex size-8 items-center justify-center hover:bg-[#E5E1D8] dark:hover:bg-white/10 transition-colors"
      aria-label="Cambiar tema"
    >
      {resolvedTheme === 'dark'
        ? <Sun className="size-4 text-[#1A1A1A]/60 dark:text-white/60" />
        : <Moon className="size-4 text-[#1A1A1A]/60" />
      }
    </button>
  )
}
