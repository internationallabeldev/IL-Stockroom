'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

type Props = {
  children:      React.ReactNode
  defaultTheme?: string
}

export function ThemeProvider({ children, defaultTheme = 'light' }: Props) {
  return (
    <NextThemesProvider attribute="class" defaultTheme={defaultTheme} enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}
