'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { UserPlus, Loader2, Copy, Check, Link } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { inviteUserSchema, type InviteUserValues } from '@/lib/validations/user.schema'
import { inviteUser } from '@/actions/users.actions'

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'PURCHASER', label: 'Compras' },
  { value: 'WAREHOUSE_MANAGER', label: 'Almacén' },
  { value: 'PRODUCER', label: 'Producción' },
  { value: 'USER', label: 'Usuario' },
]

type Result = { email: string; inviteLink?: string }

type Props = {
  open: boolean
  onClose: () => void
}

export function InviteUserForm({ open, onClose }: Props) {
  const [result, setResult] = useState<Result | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteUserValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { role: 'USER' },
  })

  async function onSubmit(values: InviteUserValues) {
    const res = await inviteUser(values)
    if (res.error) {
      toast.error(res.error)
      return
    }
    setResult({ email: values.email, inviteLink: res.inviteLink })
    reset()
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose() {
    setResult(null)
    setCopied(false)
    reset()
    onClose()
  }

  const inputCls = 'w-full h-9 border border-foreground/20 bg-card px-3 text-xs outline-none focus:border-foreground/50 transition-colors'
  const labelCls = 'block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background border border-border shadow-xl max-w-md p-0">
        <DialogHeader className="px-8 pt-8 pb-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-8 bg-foreground flex items-center justify-center shrink-0">
              <UserPlus className="size-3.5 text-background" />
            </div>
            <DialogTitle className="font-heading text-base font-black uppercase tracking-tight">
              Invitar usuario
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-8 py-6">
          {result ? (
            <div className="py-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 bg-green-100 dark:bg-green-950/40 border border-green-300 dark:border-green-700 flex items-center justify-center shrink-0">
                  <Check className="size-4 text-green-700 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                    Usuario creado
                  </p>
                  <p className="text-[11px] text-muted-foreground">{result.email}</p>
                </div>
              </div>

              {result.inviteLink && (
                <div className="mt-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Link className="size-3 text-muted-foreground" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Link de activación
                    </p>
                  </div>
                  <div className="bg-muted border border-border p-3 flex items-start gap-2">
                    <p className="text-[10px] font-mono text-foreground break-all flex-1 leading-relaxed">
                      {result.inviteLink}
                    </p>
                    <button
                      onClick={() => copyLink(result.inviteLink!)}
                      className="shrink-0 size-7 flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                      title="Copiar link"
                    >
                      {copied
                        ? <Check className="size-3.5 text-green-600 dark:text-green-400" />
                        : <Copy className="size-3.5 text-muted-foreground" />
                      }
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Comparte este link con el usuario por WhatsApp, email u otro medio. Expira en 24 horas.
                  </p>
                </div>
              )}

              <button
                onClick={() => { setResult(null); setCopied(false) }}
                className="mt-5 text-[10px] font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors"
              >
                Invitar otro
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nombre</label>
                  <input
                    {...register('first_name')}
                    className={inputCls}
                    placeholder="Juan"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-[10px] text-red-600">{errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Apellido</label>
                  <input
                    {...register('last_name')}
                    className={inputCls}
                    placeholder="García"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-[10px] text-red-600">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className={inputCls}
                  placeholder="juan@empresa.com"
                />
                {errors.email && (
                  <p className="mt-1 text-[10px] text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Rol</label>
                <select
                  {...register('role')}
                  className={inputCls + ' appearance-none'}
                >
                  {ROLE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-[10px] text-red-600">{errors.role.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-9 border border-border text-[10px] font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-9 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="size-3.5" />
                      Generar invitación
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
