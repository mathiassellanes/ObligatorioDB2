import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { Equipo, EventoConNombres } from '@repo/shared'
import { Calendar, MapPin, ChevronRight } from 'lucide-react'

const TEAM_FLAGS: Record<string, string> = {
  'Uruguay': '🇺🇾', 'Argentina': '🇦🇷', 'Brasil': '🇧🇷', 'Francia': '🇫🇷',
  'Alemania': '🇩🇪', 'España': '🇪🇸', 'Portugal': '🇵🇹', 'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'USA': '🇺🇸', 'México': '🇲🇽', 'Canadá': '🇨🇦',
}

export function AdminEquipoDetailPage() {
  const { id } = useParams({ from: '/admin/equipos/$id' })

  const { data: equipo, isLoading } = useQuery<Equipo>({
    queryKey: ['equipo', id],
    queryFn: () => api.get(`/equipos/${id}`),
  })

  const { data: eventos = [] } = useQuery<EventoConNombres[]>({
    queryKey: ['equipo-eventos', id],
    queryFn: () => api.get(`/equipos/${id}/eventos`),
  })

  if (isLoading) return (
    <div className="p-8 space-y-4">
      <div className="card h-32 animate-pulse" />
      <div className="card h-64 animate-pulse" />
    </div>
  )

  if (!equipo) return <div className="p-8 text-center text-[#6b7a9c]">Equipo no encontrado.</div>

  const flag = TEAM_FLAGS[equipo.nombre] ?? '🏳️'
  const wins = eventos.filter(e => e.nombre_equipo_local === equipo.nombre).length

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="card card-glow p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="text-6xl">{flag}</div>
          <div>
            <h1 className="font-display font-black text-4xl uppercase tracking-tight">{equipo.nombre}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-[#6b7a9c]">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{eventos.length} partidos</span>
              <span className="badge-pitch">{wins} como local</span>
            </div>
          </div>
        </div>
      </div>

      {/* Partidos */}
      <h2 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#6b7a9c] mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[#39ff14]" />Partidos
      </h2>

      {eventos.length === 0 ? (
        <div className="card p-10 text-center text-[#6b7a9c] text-sm">Sin partidos programados</div>
      ) : (
        <div className="space-y-2">
          {eventos.map((ev) => {
            const isLocal = ev.nombre_equipo_local === equipo.nombre
            return (
              <Link key={ev.id} to="/admin/eventos/$id" params={{ id: String(ev.id) }}
                className="card p-4 flex items-center gap-4 hover:border-[#39ff1430] transition-colors group">
                <div className={`badge-${isLocal ? 'pitch' : 'amber'} shrink-0`}>
                  {isLocal ? 'Local' : 'Visitante'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-extrabold text-sm uppercase">
                    <span className="text-[#39ff14]">{ev.nombre_equipo_local}</span>
                    <span className="text-[#6b7a9c] mx-2 font-normal normal-case text-xs">vs</span>
                    {ev.nombre_equipo_visitante}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6b7a9c] mt-0.5">
                    <MapPin className="w-3 h-3" />{ev.nombre_estadio}
                    <span>·</span>{new Date(ev.fecha).toLocaleDateString('es-UY')}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#3a4a6b] group-hover:text-[#39ff14] transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
