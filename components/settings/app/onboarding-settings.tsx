'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateSettings } from '@/actions/app-settings.actions'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { AppSettings } from '@/types/app-settings.types'

const MAX = 280
const DEFAULT_MSG = 'Bienvenido al sistema de gestión de inventario de International Label.'

export function OnboardingSettings({ settings }: { settings: AppSettings }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState(settings.onboarding.welcome_message)

  const dirty = message.trim() !== settings.onboarding.welcome_message.trim()
  const preview = message.trim() || DEFAULT_MSG

  function save() {
    startTransition(async () => {
      const res = await updateSettings('onboarding', { welcome_message: message.trim() })
      if (res.error) toast.error(res.error)
      else toast.success('Mensaje de bienvenida guardado')
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-widest">Mensaje de bienvenida</Label>
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, MAX))}
          rows={4}
          placeholder={DEFAULT_MSG}
        />
        <div className="flex items-center justify-between">
          <p className="text-[9px] text-muted-foreground">
            Este mensaje lo verán los usuarios nuevos al entrar por primera vez al sistema.
          </p>
          <span className="text-[9px] font-mono text-muted-foreground">{message.length}/{MAX}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Vista previa</Label>
        <blockquote className="border-l-2 border-foreground pl-4 py-1 text-sm text-foreground/80 italic leading-relaxed">
          “{preview}”
        </blockquote>
        {!message.trim() && (
          <p className="text-[9px] text-muted-foreground">
            Si lo dejas vacío se usará el mensaje por defecto.
          </p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          size="sm"
          onClick={save}
          disabled={isPending || !dirty}
          className="text-[10px] uppercase tracking-widest h-8"
        >
          {isPending ? 'Guardando...' : 'Guardar mensaje'}
        </Button>
      </div>
    </div>
  )
}
