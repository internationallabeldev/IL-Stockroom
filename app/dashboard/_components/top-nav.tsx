'use client'

import { Search, Bell, User, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

export function TopNav({ userName }: { userName: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="fixed top-0 z-50 h-16 w-full bg-[#F5F2EA] border-b border-[#1A1A1A]/15 flex items-center justify-between px-8">
      <span className="font-heading font-bold text-xl tracking-tighter select-none">
        IL - STOCKROOM
      </span>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#1A1A1A]/40" />
          <input
            type="search"
            placeholder="Buscar operaciones..."
            className="h-8 w-56 border border-[#1A1A1A]/20 bg-[#fdf9f0] pl-8 pr-3 text-xs outline-none transition-colors focus:border-[#1A1A1A]/40 placeholder:text-[#1A1A1A]/40"
          />
        </div>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex size-8 items-center justify-center hover:bg-[#E5E1D8] dark:hover:bg-white/10 transition-colors"
        >
          <Sun className="size-4 text-[#1A1A1A]/60 dark:hidden" />
          <Moon className="size-4 hidden text-white/60 dark:block" />
        </button>
        <button className="flex size-8 items-center justify-center hover:bg-[#E5E1D8] dark:hover:bg-white/10 transition-colors">
          <Bell className="size-4 text-[#1A1A1A]/60 dark:text-white/60" />
        </button>
        <div className="flex items-center gap-2 border-l border-[#1A1A1A]/15 pl-3">
          <User className="size-4 text-[#1A1A1A]/70" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#1A1A1A]">
            {userName}
          </span>
        </div>
      </div>
    </header>
  )
}
