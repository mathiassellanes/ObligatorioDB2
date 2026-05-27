import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { EventoConNombres } from '@repo/shared'
import { Calendar, MapPin, Zap, ChevronRight } from 'lucide-react'

export function HomePage() {
  const { data: eventos, isLoading } = useQuery<EventoConNombres[]>({
    queryKey: ['eventos'],
    queryFn: () => api.get('/eventos'),
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="relative mb-16 stadium-bg rounded-2xl overflow-hidden border border-[#1a2540] p-10 md:p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[#050914] via-[#090f20] to-[#050914]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#39ff14] opacity-[0.03] rounded-full blur-3xl" />
        <div className="relative">
          <div className="badge-pitch inline-flex items-center gap-1.5 mb-4">
            <Zap className="w-3 h-3" />
            FIFA World Cup 2026
          </div>
          <h1 className="font-display font-black text-6xl md:text-8xl uppercase tracking-tight text-[#e8edf8] leading-none mb-4">
            Conseguí tu<br />
            <span className="text-[#39ff14]">entrada</span>
          </h1>
          <p className="text-[#6b7a9c] text-lg max-w-lg mb-8 font-body">
            Sistema oficial de ticketing dinámico. QR rotativo, transferencias seguras,
            validación en puerta.
          </p>
          <Link to="/register" className="btn-pitch inline-flex items-center gap-2">
            Registrarse gratis
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Eventos */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title text-3xl">Próximos Partidos</h2>
          <span className="text-[#6b7a9c] text-sm font-mono">
            {eventos?.length ?? 0} eventos
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-48 animate-pulse" />
            ))}
          </div>
        ) : eventos?.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-[#6b7a9c]">No hay eventos disponibles aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventos?.map((evento, i) => (
              <EventoCard key={evento.id} evento={evento} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EventoCard({ evento, index }: { evento: EventoConNombres; index: number }) {
  const fecha = new Date(evento.fecha)
  const dia = fecha.getDate().toString().padStart(2, '0')
  const mes = fecha.toLocaleString('es', { month: 'short' }).toUpperCase()

  return (
    <Link
      to="/eventos/$id"
      params={{ id: String(evento.id) }}
      className="card card-glow group block hover:border-[#39ff1440] transition-all duration-300
                 hover:shadow-[0_0_30px_#39ff1408] animate-fade-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      <div className="p-5">
        {/* Date badge */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex flex-col items-center bg-[#0d1529] rounded-xl p-3 min-w-[56px] border border-[#1a2540]">
            <span className="font-display font-black text-2xl leading-none text-[#39ff14]">{dia}</span>
            <span className="font-display font-bold text-xs tracking-widest text-[#6b7a9c] mt-0.5">{mes}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="badge-pitch">Ver entradas</div>
            <span className="font-mono text-xs text-[#6b7a9c]">
              {evento.hora?.slice(0, 5)}h
            </span>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-3 mb-4">
          <span className="font-display font-extrabold text-xl uppercase tracking-tight text-[#e8edf8] group-hover:text-[#39ff14] transition-colors">
            {evento.nombre_equipo_local}
          </span>
          <span className="font-display font-semibold text-sm text-[#6b7a9c] shrink-0">vs</span>
          <span className="font-display font-extrabold text-xl uppercase tracking-tight text-[#e8edf8]">
            {evento.nombre_equipo_visitante}
          </span>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-1.5 text-[#6b7a9c] text-xs">
          <MapPin className="w-3 h-3" />
          <span className="font-body truncate">{evento.nombre_estadio}</span>
        </div>
      </div>

      <div className="px-5 pb-4">
        <div className="h-px bg-gradient-to-r from-transparent via-[#1a2540] to-transparent" />
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-1 text-[#6b7a9c] text-xs">
            <Calendar className="w-3 h-3" />
            <span>Disponible</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#6b7a9c] group-hover:text-[#39ff14] group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  )
}
