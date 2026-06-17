import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

export function AdminReportesPage() {
  const { data: eventos = [] } = useQuery<{ id: number; nombre_equipo_local: string; nombre_equipo_visitante: string; total_entradas: number }[]>({
    queryKey: ['reporte-eventos'],
    queryFn: () => api.get('/reportes/eventos-mas-vendidos'),
  })
  const { data: compradores = [] } = useQuery<{ email: string; total_entradas: number; monto_gastado: number }[]>({
    queryKey: ['reporte-compradores'],
    queryFn: () => api.get('/reportes/ranking-compradores'),
  })

  const totalEntradas = eventos.reduce((a, b) => a + Number(b.total_entradas), 0)
  const totalRecaudado = compradores.reduce((a, b) => a + Number(b.monto_gastado), 0)

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader title="Reportes" subtitle="Analítica del sistema" icon={BarChart3} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card card-glow p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[#39ff14]/10 rounded-lg flex items-center justify-center border border-[#39ff14]/20">
              <TrendingUp className="w-4 h-4 text-[#39ff14]" />
            </div>
            <span className="text-xs font-display uppercase tracking-widest text-[#6b7a9c]">Total entradas</span>
          </div>
          <div className="font-display font-black text-4xl text-[#39ff14]">{totalEntradas.toLocaleString()}</div>
        </div>
        <div className="card card-glow p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[#ffb800]/10 rounded-lg flex items-center justify-center border border-[#ffb800]/20">
              <DollarSign className="w-4 h-4 text-[#ffb800]" />
            </div>
            <span className="text-xs font-display uppercase tracking-widest text-[#6b7a9c]">Total recaudado</span>
          </div>
          <div className="font-display font-black text-4xl text-[#ffb800]">${totalRecaudado.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eventos más vendidos */}
        <div>
          <h2 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#6b7a9c] mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#39ff14]" />Eventos más vendidos
          </h2>
          <div className="card overflow-hidden">
            {eventos.length === 0 ? (
              <div className="p-8 text-center text-[#6b7a9c] text-sm">Sin datos</div>
            ) : eventos.map((ev, i) => (
              <div key={ev.id} className={`flex items-center gap-4 px-4 py-3 ${i < eventos.length - 1 ? 'border-b border-[#1a2540]' : ''}`}>
                <span className="font-display font-black text-2xl text-[#39ff14] w-8 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-xs uppercase truncate">
                    {ev.nombre_equipo_local} vs {ev.nombre_equipo_visitante}
                  </div>
                </div>
                <span className="badge-pitch shrink-0">{Number(ev.total_entradas).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking compradores */}
        <div>
          <h2 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#6b7a9c] mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#ffb800]" />Ranking compradores
          </h2>
          <div className="card overflow-hidden">
            {compradores.length === 0 ? (
              <div className="p-8 text-center text-[#6b7a9c] text-sm">Sin datos</div>
            ) : compradores.map((c, i) => (
              <div key={c.email} className={`flex items-center gap-4 px-4 py-3 ${i < compradores.length - 1 ? 'border-b border-[#1a2540]' : ''}`}>
                <span className="font-display font-black text-2xl text-[#ffb800] w-8 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate font-mono text-[#e8edf8]">{c.email}</div>
                  <div className="text-xs text-[#6b7a9c]">${Number(c.monto_gastado).toLocaleString()} gastado</div>
                </div>
                <span className="badge-amber shrink-0">{c.total_entradas} ent.</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
