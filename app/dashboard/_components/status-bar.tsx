'use client'

import { useEffect, useState } from 'react'

export function StatusBar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString('es-MX', { hour12: false }))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <footer className="fixed bottom-0 left-16 right-0 z-30 h-10 bg-[#fdf9f0] border-t border-[#1A1A1A]/15 px-8 flex items-center justify-between">
      <div className="flex gap-6 items-center text-[10px] font-bold uppercase tracking-widest">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#008dc2] inline-block" />
          Sistema activo
        </span>
        <span className="text-[#1A1A1A]/40">Latencia: 12ms</span>
        <span className="text-[#1A1A1A]/40">Carga: 42%</span>
      </div>
      <div className="font-mono text-[11px] text-[#1A1A1A]/50 tracking-wider">
        {time}
      </div>
    </footer>
  )
}
