import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { EventoConNombres } from '@repo/shared'
import { Calendar, MapPin, ChevronRight, Ticket, Search } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { parseDate, dateStr, todayStr as getTodayStr } from '@/lib/date'

type TimeFilter = 'todos' | 'hoy' | 'finde'

function esHoy(d: Date) {
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}
function esFinde(d: Date) {
  const day = d.getDay()
  return day === 0 || day === 6
}

export function EventosListPage() {
  const { data: eventos = [], isLoading } = useQuery<EventoConNombres[]>({
    queryKey: ['eventos'],
    queryFn: () => api.get('/eventos'),
  })

  const [query, setQuery] = useState('')
  const [time, setTime] = useState<TimeFilter>('todos')
  const [estadio, setEstadio] = useState<string | null>(null)
  const [pais, setPais] = useState<string | null>(null)

  const todayStr = getTodayStr()
  const { proximos, pasados } = useMemo(() => {
    const sorted = [...eventos].sort((a, b) => dateStr(a.fecha).localeCompare(dateStr(b.fecha)))
    return {
      proximos: sorted.filter((e) => dateStr(e.fecha) >= todayStr),
      pasados: sorted.filter((e) => dateStr(e.fecha) < todayStr).reverse(),
    }
  }, [eventos, todayStr])

  // Estadios disponibles entre los próximos, para los chips de filtro.
  const estadios = useMemo(
    () => [...new Set(proximos.map((e) => e.nombre_estadio))].sort(),
    [proximos],
  )

  // Países (equipos) que juegan en los próximos partidos.
  const paises = useMemo(
    () => [...new Set(proximos.flatMap((e) => [e.nombre_equipo_local, e.nombre_equipo_visitante]))].sort(),
    [proximos],
  )

  // Próximos partidos tras aplicar búsqueda + filtros.
  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return proximos.filter((e) => {
      if (estadio && e.nombre_estadio !== estadio) return false
      if (pais && e.nombre_equipo_local !== pais && e.nombre_equipo_visitante !== pais) return false
      const d = parseDate(e.fecha)
      if (time === 'hoy' && !esHoy(d)) return false
      if (time === 'finde' && !esFinde(d)) return false
      if (q) {
        const hay = `${e.nombre_equipo_local} ${e.nombre_equipo_visitante} ${e.nombre_estadio}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [proximos, query, time, estadio, pais])

  const filtrando = query.trim() !== '' || time !== 'todos' || estadio !== null || pais !== null

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <PageHeader
        title="Partidos"
        subtitle={`${eventos.length} partido${eventos.length !== 1 ? 's' : ''} del Mundial 2026`}
        icon={Calendar}
        action={
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <div className="flex items-center gap-2 bg-[#090f20] border border-[#1a2540] rounded-xl px-3 py-2
                            focus-within:border-[#39ff14]/40 transition-colors w-44">
              <Search className="w-4 h-4 text-[#6b7a9c] shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar…"
                className="bg-transparent outline-none text-sm text-[#e8edf8] placeholder:text-[#6b7a9c] w-full"
              />
            </div>
            <select className="input-field !py-2 w-auto text-sm" value={time} onChange={(e) => setTime(e.target.value as TimeFilter)}>
              <option value="todos">Cuándo: todos</option>
              <option value="hoy">Hoy</option>
              <option value="finde">Fin de semana</option>
            </select>
            <select className="input-field !py-2 w-auto text-sm" value={pais ?? ''} onChange={(e) => setPais(e.target.value || null)}>
              <option value="">Todos los países</option>
              {paises.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
            </select>
            <select className="input-field !py-2 w-auto text-sm" value={estadio ?? ''} onChange={(e) => setEstadio(e.target.value || null)}>
              <option value="">Todos los estadios</option>
              {estadios.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
            </select>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      ) : eventos.length === 0 ? (
        <div className="card p-16 text-center">
          <Calendar className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
          <p className="text-[#6b7a9c]">No hay partidos disponibles aún.</p>
        </div>
      ) : (
        <>
          {filtrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtrados.map((ev) => <EventoCard key={ev.id} evento={ev} />)}
            </div>
          ) : (
            <div className="card p-12 text-center text-[#6b7a9c]">
              Ningún partido coincide con tu búsqueda.
            </div>
          )}

          {!filtrando && pasados.length > 0 && (
            <>
              <div className="label mt-10 mb-3">Finalizados</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-50">
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
  const fecha = parseDate(evento.fecha)
  return (
    <Link
      to="/eventos/$id"
      params={{ id: String(evento.id) }}
      className="card card-glow p-3.5 group hover:ring-1 hover:ring-[#39ff14]/30 transition-all"
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="font-mono text-[11px] text-[#6b7a9c]">
          {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
          {' · '}{evento.hora?.toString().slice(0, 5)}h
        </span>
        <span className="flex items-center gap-1 text-[11px] text-[#6b7a9c] truncate">
          <MapPin className="w-3 h-3 shrink-0" />{evento.nombre_estadio}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{evento.bandera_equipo_local ?? '🏳️'}</span>
        <div className="flex-1 min-w-0">
          <span className={`font-display font-extrabold text-sm uppercase leading-tight block truncate ${past ? 'text-[#6b7a9c]' : 'text-[#39ff14]'}`}>
            {evento.nombre_equipo_local}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{evento.bandera_equipo_visitante ?? '🏳️'}</span>
        <div className="flex-1 min-w-0">
          <span className="font-display font-extrabold text-sm uppercase leading-tight block truncate text-[#e8edf8]">
            {evento.nombre_equipo_visitante}
          </span>
        </div>
      </div>
      {!past && (
        <span className="flex items-center gap-1 mt-1 text-[#39ff14] text-[11px] font-display font-bold uppercase tracking-wide
                         group-hover:translate-x-0.5 transition-transform">
          <Ticket className="w-3 h-3" />Ver entradas <ChevronRight className="w-3 h-3" />
        </span>
      )}
    </Link>
  )
}
