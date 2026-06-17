'use client'

// "scroll para continuar ↓" — bottom-right on the first screen, gently pulsing.
export function WelcomeNavHint() {
  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/40 animate-pulse md:bottom-10 md:right-12">
      Scroll para continuar
      <span className="text-(--cmyk-accent)">↓</span>
    </div>
  )
}
