import { getSessionUser } from '@/actions/auth.actions'
import { MoreHorizontal } from 'lucide-react'

const activeOrders = [
  { id: '#OC-8821', supplier: 'Tintas Norma SA',   progress: 78, delivery: '14:30' },
  { id: '#OC-8824', supplier: 'Papel Express',      progress: 45, delivery: '15:15' },
  { id: '#OC-8829', supplier: 'Suministros Print',  progress: 12, delivery: '17:45' },
]

const inkLevels = [
  { label: 'Cyan',     pct: 64, color: '#008dc2' },
  { label: 'Magenta',  pct: 21, color: '#ba1a1a', warn: true },
  { label: 'Amarillo', pct: 89, color: '#ca8a04' },
  { label: 'Negro',    pct: 47, color: '#1A1A1A' },
]

const machineStatus = [
  { id: 'Offset-04A',  detail: 'TEMP: 42°C | RPM: 1200', status: 'Activo',    ok: true  },
  { id: 'Offset-04B',  detail: 'TEMP: 39°C | RPM: 1150', status: 'Activo',    ok: true  },
  { id: 'Digital-02',  detail: 'CÓDIGO ERROR: E-129',     status: 'Alerta',    ok: false },
  { id: 'Binder-01',   detail: 'STANDBY',                 status: 'Listo',     ok: true  },
]

export default async function DashboardPage() {
  const user = await getSessionUser()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const name = user?.email?.split('@')[0] ?? ''

  return (
    <div className="px-8 pt-8 pb-16">
      {/* Page header */}
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-[#1A1A1A]">
            Panel de Operaciones
          </h1>
          <p className="text-lg text-[#5f5e59] mt-1">
            {greeting}, <span className="text-[#008dc2] font-bold capitalize">{name}</span>
            {' '}— 3 órdenes activas
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2 border border-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-[#F5F2EA] transition-colors">
            Exportar logs
          </button>
          <button className="px-5 py-2 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">
            Estado del sistema
          </button>
        </div>
      </header>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* Active orders — 8 cols */}
        <section className="col-span-8 bg-[#fdf9f0] border border-[#1A1A1A]/15 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-medium">Órdenes Activas</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
              Ejecución prioritaria
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1A1A1A]/15">
                  {['Orden', 'Proveedor', 'Progreso', 'Entrega est.', ''].map(h => (
                    <th key={h} className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeOrders.map(({ id, supplier, progress, delivery }, i) => (
                  <tr
                    key={id}
                    className={`border-b border-[#1A1A1A]/10 transition-colors hover:bg-[#E5E1D8]/30 ${i % 2 === 1 ? 'bg-[#E5E1D8]/10' : ''}`}
                  >
                    <td className="py-4 font-mono text-[13px] font-medium tracking-wider">{id}</td>
                    <td className="py-4 text-sm">{supplier}</td>
                    <td className="py-4 w-48">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#E5E1D8] overflow-hidden">
                          <div className="h-full bg-[#008dc2]" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="font-mono text-xs w-8 text-right">{progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 font-mono text-[13px]">{delivery}</td>
                    <td className="py-4 text-right">
                      <button className="text-[#008dc2] hover:text-[#1A1A1A] transition-colors">
                        <MoreHorizontal className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick actions — 4 cols */}
        <section className="col-span-4 bg-[#1A1A1A] text-[#F5F2EA] p-6 flex flex-col justify-between border border-[#1A1A1A]">
          <div>
            <h2 className="font-heading text-2xl font-medium mb-2">Acciones Rápidas</h2>
            <p className="text-sm text-[#F5F2EA]/60 mb-8">Controles de operación directa</p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Nueva Requisición', icon: '→' },
              { label: 'Recepción de Material', icon: '→' },
            ].map(({ label, icon }) => (
              <button
                key={label}
                className="w-full py-3.5 px-5 border border-[#F5F2EA]/30 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest hover:bg-[#F5F2EA] hover:text-[#1A1A1A] transition-all group"
              >
                <span>{label}</span>
                <span className="group-hover:translate-x-0.5 transition-transform">{icon}</span>
              </button>
            ))}
            <button className="w-full py-3.5 px-5 bg-[#ba1a1a] border border-[#ba1a1a] flex justify-between items-center text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
              <span>Alerta de Stock</span>
              <span>⚠</span>
            </button>
          </div>
        </section>

        {/* Ink telemetry — 7 cols */}
        <section className="col-span-7 bg-[#fdf9f0] border border-[#1A1A1A]/15 p-6">
          <h2 className="font-heading text-2xl font-medium mb-8">Telemetría de Tintas</h2>
          <div className="grid grid-cols-4 gap-6 mb-8">
            {inkLevels.map(({ label, pct, color, warn }) => (
              <div key={label} className="text-center">
                <div className="h-28 w-full bg-[#E5E1D8] relative mb-3">
                  <div
                    className="absolute bottom-0 left-0 w-full transition-all"
                    style={{ height: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
                <p className={`font-mono text-lg font-medium ${warn ? 'text-[#ba1a1a]' : ''}`}>
                  {pct}%
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#1A1A1A]/15 pt-5 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
                Stock de papel (A4 Grueso)
              </p>
              <p className="font-heading text-2xl font-medium mt-0.5">
                42,502 <span className="text-base font-normal text-[#5f5e59]">hojas</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
                Agotamiento estimado
              </p>
              <p className="font-mono text-lg mt-0.5">~4.5 Horas</p>
            </div>
          </div>
        </section>

        {/* Machine health — 5 cols */}
        <section className="col-span-5 bg-[#fdf9f0] border border-[#1A1A1A]/15 p-6 flex flex-col">
          <h2 className="font-heading text-2xl font-medium mb-6">Estado de Máquinas</h2>
          <div className="flex-1 space-y-3">
            {machineStatus.map(({ id, detail, status, ok }) => (
              <div
                key={id}
                className={`flex items-center justify-between p-4 border-l-4 bg-[#E5E1D8]/20 ${ok ? 'border-[#008dc2]' : 'border-[#ba1a1a]'}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="size-2.5 shrink-0"
                    style={{ backgroundColor: ok ? '#008dc2' : '#ba1a1a' }}
                  />
                  <div>
                    <p className="font-bold text-sm">{id}</p>
                    <p className="font-mono text-[11px] text-[#5f5e59] mt-0.5">{detail}</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: ok ? '#008dc2' : '#ba1a1a' }}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
