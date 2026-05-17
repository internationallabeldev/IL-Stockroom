import type { Metadata } from 'next'
import { LoginForm } from './_components/login-form'

export const metadata: Metadata = {
  title: 'Acceso — IL Stockroom',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex">

      {/* Left — brand panel (intentionally always dark) */}
      <div className="hidden lg:flex w-80 shrink-0 flex-col justify-between bg-[#1A1A1A] text-[#F5F2EA] p-10">
        <div>
          <span className="font-heading font-bold text-xl tracking-tighter">IL_STOCKROOM</span>
        </div>
        <div>
          <p className="font-heading text-3xl font-bold leading-tight mb-4">
            Gestión de<br />inventario para<br />imprenta.
          </p>
          <div className="space-y-2 text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/40">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#008dc2] inline-block" />
              Control de tintas CMYK
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#008dc2] inline-block" />
              Órdenes de compra
            </div>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#008dc2] inline-block" />
              Requisiciones y stock
            </div>
          </div>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/20">
          Uso interno exclusivo
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center px-8">
        <div className="w-full max-w-sm">

          <div className="mb-10 lg:hidden">
            <span className="font-heading font-bold text-xl tracking-tighter">IL_STOCKROOM</span>
          </div>

          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Iniciar sesión
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Ingresa tus credenciales de acceso
            </p>
          </div>

          <div className="border border-border bg-card p-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-foreground/30">
            IL Stockroom · Sistema de Inventario
          </p>
        </div>
      </div>
    </div>
  )
}
