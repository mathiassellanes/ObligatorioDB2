import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { EventoConNombres } from '@repo/shared'
import { Calendar, MapPin, Zap, ChevronRight, ChevronLeft } from 'lucide-react'
import { isLoggedIn } from '@/lib/auth'

const FLAGS: Record<string, string> = {
  'Uruguay': '🇺🇾', 'Argentina': '🇦🇷', 'Brasil': '🇧🇷', 'Francia': '🇫🇷',
  'Alemania': '🇩🇪', 'España': '🇪🇸', 'Portugal': '🇵🇹', 'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'USA': '🇺🇸', 'México': '🇲🇽', 'Canadá': '🇨🇦',
}

export function HomePage() {
  const sliderRef = useRef<HTMLDivElement>(null)

  const { data: eventos = [], isLoading } = useQuery<EventoConNombres[]>({
    queryKey: ['eventos'],
    queryFn: () => api.get('/eventos'),
  })

  function scroll(dir: 'left' | 'right') {
    sliderRef.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero — guests only */}
      {!isLoggedIn() && (
        <div className="relative mb-12 rounded-2xl overflow-hidden border border-[#1a2540] p-8 md:p-16">
          <div className="absolute inset-0 bg-gradient-to-br from-[#050914] via-[#090f20] to-[#050914]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#39ff14] opacity-[0.03] rounded-full blur-3xl" />
          <div className="relative">
            <div className="badge-pitch inline-flex items-center gap-1.5 mb-4">
              <Zap className="w-3 h-3" />FIFA World Cup 2026
            </div>
            <h1 className="font-display font-black text-5xl md:text-8xl uppercase tracking-tight text-[#e8edf8] leading-none mb-4">
              Conseguí tu<br /><span className="text-[#39ff14]">entrada</span>
            </h1>
            <p className="text-[#6b7a9c] text-base md:text-lg max-w-lg mb-8">
              Sistema oficial de ticketing dinámico. QR rotativo, transferencias seguras, validación en puerta.
            </p>
            <div className="flex items-center gap-3">
              <Link to="/register" className="btn-pitch inline-flex items-center gap-2">
                Registrarse gratis<ChevronRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="btn-outline inline-flex items-center gap-2 py-2.5 px-5">Ingresar</Link>
            </div>
          </div>
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title text-2xl sm:text-3xl">Próximos Partidos</h2>
        <div className="flex items-center gap-2">
          <span className="text-[#6b7a9c] text-sm font-mono hidden sm:block">{eventos.length} eventos</span>
          <button onClick={() => scroll('left')}
            className="w-8 h-8 rounded-lg border border-[#1a2540] flex items-center justify-center
                       text-[#6b7a9c] hover:text-[#e8edf8] hover:border-[#39ff1440] transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll('right')}
            className="w-8 h-8 rounded-lg border border-[#1a2540] flex items-center justify-center
                       text-[#6b7a9c] hover:text-[#e8edf8] hover:border-[#39ff1440] transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-52 w-72 shrink-0 animate-pulse" />)}
        </div>
      ) : eventos.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-[#6b7a9c]">No hay eventos disponibles aún.</p>
        </div>
      ) : (
        <div
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory
                     [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {eventos.map((evento, i) => (
            <EventoCard key={evento.id} evento={evento} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function EventoCard({ evento, index }: { evento: EventoConNombres; index: number }) {
  const fecha = new Date(evento.fecha)
  const dia = fecha.getDate().toString().padStart(2, '0')
  const mes = fecha.toLocaleString('es', { month: 'short' }).toUpperCase()
  const flagLocal = FLAGS[evento.nombre_equipo_local] ?? '🏳️'
  const flagVisitante = FLAGS[evento.nombre_equipo_visitante] ?? '🏳️'

  return (
    <Link
      to="/eventos/$id"
      params={{ id: String(evento.id) }}
      className="card card-glow group block shrink-0 w-[280px] sm:w-[300px] snap-start
                 hover:border-[#39ff1440] transition-all duration-300
                 hover:shadow-[0_0_30px_#39ff1408]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="p-5">
        {/* Date + time */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 bg-[#0d1529] rounded-xl px-3 py-2 border border-[#1a2540]">
            <span className="font-display font-black text-xl leading-none text-[#39ff14]">{dia}</span>
            <div className="flex flex-col">
              <span className="font-display font-bold text-[10px] tracking-widest text-[#6b7a9c] uppercase">{mes}</span>
              <span className="font-mono text-[10px] text-[#3a4a6b]">{evento.hora?.slice(0, 5)}h</span>
            </div>
          </div>
          <span className="badge-pitch text-[10px]">Ver entradas</span>
        </div>

        {/* Teams with flags */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{flagLocal}</span>
          <div className="flex-1 min-w-0">
            <div className="font-display font-extrabold text-sm uppercase tracking-tight text-[#e8edf8]
                            group-hover:text-[#39ff14] transition-colors truncate">
              {evento.nombre_equipo_local}
            </div>
          </div>
        </div>
        <div className="text-xs text-[#3a4a6b] font-display font-bold uppercase tracking-widest pl-9 mb-1">vs</div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{flagVisitante}</span>
          <div className="flex-1 min-w-0">
            <div className="font-display font-extrabold text-sm uppercase tracking-tight text-[#e8edf8] truncate">
              {evento.nombre_equipo_visitante}
            </div>
          </div>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-1.5 text-[#6b7a9c] text-xs">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{evento.nombre_estadio}</span>
        </div>
      </div>

      <div className="px-5 pb-4">
        <div className="h-px bg-gradient-to-r from-transparent via-[#1a2540] to-transparent" />
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-1 text-[#6b7a9c] text-xs">
            <Calendar className="w-3 h-3" />
            <span>{fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#6b7a9c] group-hover:text-[#39ff14] group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  )
}
