'use client'

import { useState } from 'react'
import { Mail, Phone, MessageCircle, Pencil, Power } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { toggleProviderStatus, type Provider } from '@/actions/providers.actions'

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  INK_SUPPLIER:    { label: 'Tintas',       color: '#008dc2' },
  PAPER_SUPPLIER:  { label: 'Papel',        color: '#5f5e59' },
  SUPPLY_SUPPLIER: { label: 'Consumibles',  color: '#7c3aed' },
  BOTH:            { label: 'Múltiples',    color: '#1A1A1A' },
}

type Props = {
  provider: Provider
  canEdit: boolean
  onView: (provider: Provider) => void
  onEdit: (provider: Provider) => void
}

export function ProviderCard({ provider, canEdit, onView, onEdit }: Props) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const type = TYPE_LABELS[provider.provider_type]

  async function handleToggle() {
    setLoading(true)
    const res = await toggleProviderStatus(provider.id)
    if (res.error) toast.error(res.error)
    else {
      // La lista lee del cache de React Query; invalidar para reflejar el cambio.
      await queryClient.invalidateQueries({ queryKey: ['providers'] })
      toast.success(provider.enabled ? 'Proveedor desactivado' : 'Proveedor activado')
    }
    setLoading(false)
  }

  return (
    <div
      className={`bg-card border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-border dark:border-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-white/20 dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.09)] p-6 flex flex-col gap-4 transition-all duration-200 ${!provider.enabled ? 'opacity-50 shadow-none hover:translate-y-0' : ''
        }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={() => onView(provider)}
          className="flex items-center gap-3 min-w-0 text-left hover:opacity-70 transition-opacity"
        >
          {provider.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={provider.logo_url}
              alt={provider.name}
              className="size-10 object-contain shrink-0 border border-border"
            />
          ) : (
            <div className="size-10 shrink-0 bg-muted flex items-center justify-center border border-border">
              <span className="font-heading font-bold text-base text-foreground/40">
                {provider.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="cursor-pointer font-heading font-bold text-[15px] leading-tight text-foreground truncate">{provider.name}</p>
            {provider.contact_person && (
              <p className="text-[11px] text-muted-foreground/80 truncate">{provider.contact_person}</p>
            )}
          </div>
        </button>
        <span
          className="shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border"
          style={{ color: type.color, borderColor: type.color + '33', backgroundColor: type.color + '14' }}
        >
          {type.label}
        </span>
      </div>

      {/* Contact */}
      <div className="space-y-1.5 border-t border-border/50 pt-4">
        <a
          href={`mailto:${provider.email}`}
          className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Mail className="size-3 shrink-0" />
          <span className="truncate">{provider.email}</span>
        </a>
        <a
          href={`tel:${provider.phone}`}
          className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Phone className="size-3 shrink-0" />
          <span>{provider.phone}</span>
        </a>
        {provider.whatsapp && (
          <a
            href={`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-[#25D366] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24"><path fill="currentColor" d="M8.886 7.17c.183.005.386.015.579.443c.128.285.343.81.519 1.238c.137.333.249.607.277.663c.064.128.104.275.02.448l-.028.058a1.4 1.4 0 0 1-.23.37l-.143.17c-.085.104-.17.206-.242.278c-.129.128-.262.266-.114.522s.668 1.098 1.435 1.777a6.6 6.6 0 0 0 1.903 1.2q.105.045.17.076c.257.128.41.108.558-.064c.149-.173.643-.749.817-1.005c.168-.256.34-.216.578-.128c.238.089 1.504.71 1.761.837l.143.07c.179.085.3.144.352.23c.064.109.064.62-.148 1.222c-.218.6-1.267 1.176-1.742 1.22l-.135.016c-.436.052-.988.12-2.956-.655c-2.426-.954-4.027-3.32-4.35-3.799l-.053-.076l-.006-.008c-.147-.197-1.048-1.402-1.048-2.646c0-1.19.587-1.81.854-2.092l.047-.05a.95.95 0 0 1 .687-.32c.173 0 .347 0 .495.005"></path><path fill="currentColor" fillRule="evenodd" d="M2.184 21.331a.4.4 0 0 0 .487.494l4.607-1.204a10 10 0 0 0 4.76 1.207h.004c5.486 0 9.958-4.446 9.958-9.912a9.83 9.83 0 0 0-2.914-7.011A9.92 9.92 0 0 0 12.042 2c-5.486 0-9.958 4.446-9.958 9.911c0 1.739.458 3.447 1.33 4.954zm2.677-4.068a1.5 1.5 0 0 0-.148-1.15a8.4 8.4 0 0 1-1.129-4.202c0-4.63 3.793-8.411 8.458-8.411c2.27 0 4.388.877 5.986 2.468a8.33 8.33 0 0 1 2.472 5.948c0 4.63-3.793 8.412-8.458 8.412h-.005a8.5 8.5 0 0 1-4.044-1.026a1.5 1.5 0 0 0-1.094-.132l-2.762.721z" clipRule="evenodd"></path></svg>            <span>{provider.whatsapp}</span>
          </a>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground/70 truncate">{provider.address}</p>

      {/* Actions */}
      {canEdit && (
        <div className="flex gap-2 border-t border-border/50 pt-3">
          <button
            onClick={() => onEdit(provider)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-border bg-muted/60 text-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors"
          >
            <Pencil className="size-3" />
            Editar
          </button>
          <button
            onClick={handleToggle}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-border/60 text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            <Power className="size-3" />
            {provider.enabled ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      )}
    </div>
  )
}
