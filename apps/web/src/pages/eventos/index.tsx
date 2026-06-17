import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { EventoConNombres } from '@repo/shared'
import { Calendar, MapPin, ChevronRight, Ticket } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

export function EventosListPage() {
  const { data: eventos = [], isLoading } = useQuery<EventoConNombres[]>({
    queryKey: ['eventos'],
    queryFn: () => api.get('/eventos'),
  })

  const now = Date.now()
  const { proximos, pasados } = useMemo(() => {
    const sorted = [...eventos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    return {
      proximos: sorted.filter((e) => new Date(e.fecha).getTime() >= now),
      pasados: sorted.filter((e) => new Date(e.fecha).getTime() < now).reverse(),
    }
  }, [eventos])

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <PageHeader
        title="Eventos"
        subtitle={`${eventos.length} partido${eventos.length !== 1 ? 's' : ''} del Mundial 2026`}
        icon={Calendar}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      ) : eventos.length === 0 ? (
        <div className="card p-16 text-center">
          <Calendar className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
          <p className="text-[#6b7a9c]">No hay eventos disponibles aún.</p>
        </div>
      ) : (
        <>
          {proximos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proximos.map((ev) => <EventoCard key={ev.id} evento={ev} />)}
            </div>
          )}

          {pasados.length > 0 && (
            <>
              <div className="label mt-10 mb-3">Finalizados</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
                {pasados.map((ev) => <EventoCard key={ev.id} evento={ev} past />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function EventoCard({ evento, past }: { evento: EventoConNombres; past?: boolean }) {
  const fecha = new Date(evento.fecha)
  return (
    <Link
      to="/eventos/$id"
      params={{ id: String(evento.id) }}
      className="card card-glow p-5 group hover:ring-1 hover:ring-[#39ff14]/30 transition-all"
    >
      <div className="badge-amber mb-3">
        {fecha.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short' })}
        {' · '}{evento.hora?.toString().slice(0, 5)}h
      </div>
      <h3 className="font-display font-extrabold text-lg uppercase leading-tight mb-3">
        <span className={past ? 'text-[#6b7a9c]' : 'text-[#39ff14]'}>{evento.nombre_equipo_local}</span>
        <span className="text-[#6b7a9c] mx-2 text-base">vs</span>
        {evento.nombre_equipo_visitante}
      </h3>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-[#6b7a9c]">
          <MapPin className="w-3 h-3" />{evento.nombre_estadio}
        </span>
        {!past && (
          <span className="flex items-center gap-1 text-[#39ff14] text-xs font-display font-bold uppercase tracking-wide
                           group-hover:translate-x-0.5 transition-transform">
            <Ticket className="w-3.5 h-3.5" />Ver entradas <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </Link>
  )
}
