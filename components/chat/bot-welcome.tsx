'use client'

import { useMemo } from 'react'
import { Bot } from 'lucide-react'

/** Time-of-day greeting in es-MX. */
function greeting(hour: number): string {
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Dynamic openers — one is picked at random each time the empty chat renders,
 *  so the assistant feels alive (à la Claude.ai) instead of a static placeholder. */
const PROMPTS = [
  '¿Qué quieres consultar del inventario hoy?',
  '¿Reviso el stock de alguna tinta o papel?',
  '¿Buscamos una orden de compra o requisición?',
  '¿Necesitas saber qué está por agotarse?',
  '¿Te ayudo a encontrar un proveedor?',
  '¿Qué movimientos de inventario quieres revisar?',
  'Pregúntame por stock, órdenes, requisiciones o proveedores.',
  '¿Echamos un ojo a los suministros bajos?',
]

export function BotWelcome({ userName }: { userName?: string }) {
  // Resolved once per mount: a fresh greeting + prompt each time the chat opens empty.
  const { hello, prompt } = useMemo(
    () => ({
      hello: greeting(new Date().getHours()),
      prompt: PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
    }),
    [],
  )

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-violet-500/10">
        <Bot className="size-6 text-violet-500" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {hello}
          {userName ? `, ${userName}` : ''} 👋
        </p>
        <p className="text-[11px] text-muted-foreground">{prompt}</p>
      </div>
    </div>
  )
}
