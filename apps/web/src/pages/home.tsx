import { useRef, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { EventoConNombres } from '@repo/shared'
import { Calendar, MapPin, Zap, ChevronRight, ChevronLeft, Ticket } from 'lucide-react'
import { isLoggedIn } from '@/lib/auth'
import { parseDate } from '@/lib/date'


export function HomePage() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)

  const { data: eventos = [], isLoading } = useQuery<EventoConNombres[]>({
    queryKey: ['eventos'],
    queryFn: () => api.get('/eventos'),
  })

  const goTo = useCallback((idx: number) => {
    if (!trackRef.current) return
    const cards = trackRef.current.children
    if (!cards[idx]) return
    ;(cards[idx] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    setCurrent(idx)
  }, [])

  const prev = () => goTo(Math.max(0, current - 1))
  const next = () => goTo(Math.min(eventos.length - 1, current + 1))

  return (
    <div>
      {/* Hero — guests only */}
      {!isLoggedIn() && (
        <div className="max-w-7xl mx-auto px-4 pt-8 sm:pt-12 pb-0">
          <div className="relative mb-10 rounded-2xl overflow-hidden border border-[#1a2540] p-8 md:p-16">
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
        </div>
      )}

      {/* Events carousel section */}
      <div className="py-8 sm:py-12">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between mb-6">
          <h2 className="section-title text-2xl sm:text-3xl">Próximos Partidos</h2>
          <span className="text-[#6b7a9c] text-sm font-mono">{eventos.length} eventos</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center gap-4 px-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-72 w-[85vw] max-w-[520px] shrink-0 animate-pulse" />
            ))}
          </div>
        ) : eventos.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4">
            <div className="card p-16 text-center">
              <p className="text-[#6b7a9c]">No hay eventos disponibles aún.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Carousel track */}
            <div
              ref={trackRef}
              className="flex gap-4 overflow-x-auto pb-2
                         scroll-smooth snap-x snap-mandatory
                         [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
                         px-[max(1rem,calc(50vw-260px))]"
              onScroll={(e) => {
                const el = e.currentTarget
                const cardW = (el.firstChild as HTMLElement)?.offsetWidth ?? 520
                const gap = 16
                const idx = Math.round(el.scrollLeft / (cardW + gap))
                setCurrent(Math.max(0, Math.min(idx, eventos.length - 1)))
              }}
            >
              {eventos.map((evento, i) => (
                <EventoCard key={evento.id} evento={evento} active={i === current} />
              ))}
            </div>

            {/* Navigation */}
            <div className="max-w-7xl mx-auto px-4 mt-5 flex items-center justify-center gap-4">
              <button
                onClick={prev}
                disabled={current === 0}
                className="w-10 h-10 rounded-xl border border-[#1a2540] flex items-center justify-center
                           text-[#6b7a9c] hover:text-[#e8edf8] hover:border-[#39ff1440]
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {eventos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === current
                        ? 'w-6 h-2 bg-[#39ff14]'
                        : 'w-2 h-2 bg-[#1a2540] hover:bg-[#3a4a6b]'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                disabled={current === eventos.length - 1}
                className="w-10 h-10 rounded-xl border border-[#1a2540] flex items-center justify-center
                           text-[#6b7a9c] hover:text-[#e8edf8] hover:border-[#39ff1440]
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function EventoCard({ evento, active }: { evento: EventoConNombres; active: boolean }) {
  const fecha = parseDate(evento.fecha)
  const flagLocal = evento.bandera_equipo_local ?? '🏳️'
  const flagVisitante = evento.bandera_equipo_visitante ?? '🏳️'

  return (
    <Link
      to="/eventos/$id"
      params={{ id: String(evento.id) }}
      className={`block shrink-0 w-[85vw] max-w-[520px] snap-center rounded-2xl border
                  transition-all duration-500 overflow-hidden group
                  ${active
                    ? 'border-[#39ff1440] shadow-[0_0_60px_#39ff1412] scale-100 opacity-100'
                    : 'border-[#1a2540] scale-[0.94] opacity-60 hover:opacity-80'
                  }`}
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full transition-all duration-500 ${active ? 'bg-[#39ff14]' : 'bg-[#1a2540]'}`} />

      <div className="bg-[#090f20] p-6 sm:p-8">
        {/* Date + venue row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border
                            ${active ? 'bg-[#39ff1410] border-[#39ff1430]' : 'bg-[#0d1529] border-[#1a2540]'}`}>
              <span className={`font-display font-black text-lg leading-none ${active ? 'text-[#39ff14]' : 'text-[#6b7a9c]'}`}>
                {fecha.getDate().toString().padStart(2, '0')}
              </span>
              <span className="font-display font-bold text-[9px] tracking-widest text-[#6b7a9c] uppercase">
                {fecha.toLocaleString('es', { month: 'short' })}
              </span>
            </div>
            <div>
              <div className="text-xs text-[#6b7a9c] font-mono">
                {fecha.toLocaleString('es', { weekday: 'long' })}
              </div>
              <div className="text-xs text-[#3a4a6b] font-mono">{evento.hora?.slice(0, 5)}h</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[#6b7a9c] text-xs">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[140px]">{evento.nombre_estadio}</span>
          </div>
        </div>

        {/* VS section */}
        <div className="flex items-center gap-4 mb-8">
          {/* Local */}
          <div className="flex-1 text-center">
            <div className="text-5xl mb-2">{flagLocal}</div>
            <div className="font-display font-extrabold text-sm uppercase tracking-tight text-[#e8edf8] leading-tight">
              {evento.nombre_equipo_local}
            </div>
          </div>

          {/* VS */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div className="font-display font-black text-2xl text-[#3a4a6b] leading-none">VS</div>
            <div className="w-px h-8 bg-[#1a2540]" />
          </div>

          {/* Visitante */}
          <div className="flex-1 text-center">
            <div className="text-5xl mb-2">{flagVisitante}</div>
            <div className="font-display font-extrabold text-sm uppercase tracking-tight text-[#e8edf8] leading-tight">
              {evento.nombre_equipo_visitante}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-display font-bold uppercase tracking-wide
                         transition-all duration-300 border
                         ${active
                           ? 'bg-[#39ff14] text-[#050914] border-[#39ff14] group-hover:shadow-[0_0_20px_#39ff1440]'
                           : 'bg-transparent text-[#6b7a9c] border-[#1a2540]'
                         }`}>
          <Ticket className="w-4 h-4" />
          Ver entradas
        </div>
      </div>
    </Link>
  )
}
