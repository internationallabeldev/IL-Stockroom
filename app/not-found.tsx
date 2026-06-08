import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F2EA] flex">
      <div className="hidden lg:flex w-80 shrink-0 flex-col justify-between bg-[#1A1A1A] text-[#F5F2EA] p-10">
        <span className="font-display font-bold text-xl tracking-tighter">IL_STOCKROOM</span>
        <div />
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/20">
          Uso interno exclusivo
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-8">
        <div className="text-center max-w-sm w-full">
          <div className="mb-10 lg:hidden">
            <span className="font-display font-bold text-xl tracking-tighter">IL_STOCKROOM</span>
          </div>

          <div className="border border-[#1A1A1A]/15 bg-[#fdf9f0] p-8">
            <p className="text-[72px] font-bold leading-none text-[#1A1A1A]/10 mb-4 font-display tracking-tight select-none">
              404
            </p>

            <h1 className="font-display text-xl font-black uppercase tracking-tight text-[#1A1A1A] mb-2">
              Página no encontrada
            </h1>

            <p className="text-sm text-[#5f5e59] mb-6">
              La ruta que ingresaste no existe o fue movida.
            </p>

            <Link
              href="/dashboard"
              className="block w-full h-9 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center justify-center"
            >
              Ir al dashboard
            </Link>

            <Link
              href="/login"
              className="block w-full h-9 mt-2 border border-[#1A1A1A]/20 text-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest hover:bg-[#1A1A1A]/5 transition-colors flex items-center justify-center"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
