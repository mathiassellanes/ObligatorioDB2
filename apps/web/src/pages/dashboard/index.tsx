import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { EntradaConEvento, TransferenciaConEvento, EventoConNombres } from '@repo/shared'
import {
  Ticket, QrCode, MapPin, CalendarClock, Inbox,
} from 'lucide-react'

const VER_TODOS_TOPE = 4

/** Event start as a real datetime (fecha is a date, hora is "HH:MM:SS"). */
function eventDate(e: { fecha_evento: string | Date; hora_evento?: string }) {
  const d = new Date(e.fecha_evento)
  const [h, m] = (e.hora_evento ?? '').split(':')
  if (h) d.setHours(Number(h), Number(m) || 0, 0, 0)
  return d
}

function cuentaRegresiva(target: Date) {
  const ms = target.getTime() - Date.now()
  if (ms <= 0) return 'Hoy'
  const dias = Math.floor(ms / 86_400_000)
  if (dias >= 1) return `en ${dias} día${dias === 1 ? '' : 's'}`
  const horas = Math.max(1, Math.floor(ms / 3_600_000))
  return `en ${horas} hora${horas === 1 ? '' : 's'}`
}

/**
 * Storefront-first dashboard (Alt A): comprar manda. La columna principal son
 * los próximos partidos (con tope + "ver todos"), y "mis entradas" vive en una
 * isla flotante a la derecha que da acceso de un toque al QR del próximo.
 */
export function DashboardPage() {
  const { data: entradas = [], isLoading: cargandoEntradas } = useQuery<EntradaConEvento[]>({
    queryKey: ['mis-entradas'],
    queryFn: () => api.get('/entradas'),
  })
  const { data: pendientes = [] } = useQuery<TransferenciaConEvento[]>({
    queryKey: ['transferencias-pendientes'],
    queryFn: () => api.get('/transferencias/pendientes'),
  })
  const { data: eventos = [], isLoading: cargandoEventos } = useQuery<EventoConNombres[]>({
    queryKey: ['eventos'],
    queryFn: () => api.get('/eventos'),
  })

  // Próximos partidos para comprar (los más cercanos primero), limitados.
  const proximosEventos = useMemo(() => {
    const now = Date.now()
    return eventos
      .filter((e) => new Date(e.fecha).getTime() >= now)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, VER_TODOS_TOPE)
  }, [eventos])

  // Mis entradas activas: próxima destacada + resto para la mini-lista.
  const { activas, proxima, resto } = useMemo(() => {
    const activas = entradas
      .filter((e) => !e.consumida)
      .sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime())
    const now = Date.now()
    const proxima = activas.find((e) => eventDate(e).getTime() >= now) ?? activas[0]
    return { activas, proxima, resto: activas.filter((e) => e.id !== proxima?.id).slice(0, 3) }
  }, [entradas])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-7 items-start">
        {/* IZQUIERDA — próximos partidos (comprar) */}
        <div>
          <div className="flex items-end justify-between mb-5">
            <h1 className="section-title text-2xl sm:text-3xl flex items-center gap-3">
              <span className="inline-block w-2 h-6 bg-[#39ff14] rounded-sm -skew-x-12" />
              Próximos partidos
            </h1>
            <Link
              to="/eventos"
              className="font-display font-bold uppercase text-sm tracking-wide text-[#39ff14]
                         border border-[#39ff14]/40 rounded-lg px-3 py-1.5 hover:bg-[#39ff14]/10 transition-colors"
            >
              Ver todos →
            </Link>
          </div>

          {cargandoEventos ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="card h-44 animate-pulse" />)}
            </div>
          ) : proximosEventos.length === 0 ? (
            <div className="card p-12 text-center text-[#6b7a9c]">No hay partidos disponibles aún.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {proximosEventos.map((ev) => <EventoBuyCard key={ev.id} evento={ev} />)}
            </div>
          )}
        </div>

        {/* DERECHA — isla flotante: mis entradas */}
        <aside className="lg:sticky lg:top-20 rounded-2xl border border-[#1a2540] p-[18px]
                          bg-gradient-to-b from-[#090f20] to-[#050914] shadow-[0_24px_60px_#00000060]">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-display font-bold uppercase text-lg flex items-center gap-2">
              <span className="inline-block w-1.5 h-[18px] bg-[#ffb800] rounded-sm -skew-x-12" />
              Mis entradas
            </h2>
            <span className="font-mono text-[11px] text-[#6b7a9c]">
              {activas.length} activa{activas.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Transferencias entrantes pendientes — accionable */}
          {pendientes.length > 0 && (
            <Link
              to="/u/transferencias"
              className="flex items-center gap-2.5 mb-3.5 rounded-xl px-3 py-2.5 bg-[#ffb800]/10
                         border border-[#ffb800]/30 hover:bg-[#ffb800]/15 transition-colors"
            >
              <Inbox className="w-4 h-4 text-[#ffb800] shrink-0" />
              <span className="text-[#ffb800] text-xs font-display font-bold uppercase tracking-wide">
                {pendientes.length} por aceptar
              </span>
            </Link>
          )}

          {cargandoEntradas ? (
            <div className="h-48 rounded-xl bg-[#0d1529] animate-pulse" />
          ) : !proxima ? (
            <div className="text-center py-8">
              <Ticket className="w-9 h-9 text-[#1a2540] mx-auto mb-3" />
              <p className="text-[#6b7a9c] text-sm mb-4">Todavía no tenés entradas.</p>
              <Link to="/eventos" className="btn-pitch inline-block text-sm py-2 px-4">Comprar entrada</Link>
            </div>
          ) : (
            <>
              <ProximaEntrada entrada={proxima} />
              {resto.map((e) => <MiniEntrada key={e.id} entrada={e} />)}
              <Link
                to="/u/entradas"
                className="block text-center mt-3.5 font-display font-bold uppercase text-[13px] text-[#6b7a9c]
                           border border-[#1a2540] rounded-xl py-2.5 hover:text-[#39ff14] hover:border-[#39ff14]/40 transition-colors"
              >
                Ver todas mis entradas →
              </Link>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

function EventoBuyCard({ evento }: { evento: EventoConNombres }) {
  const fecha = new Date(evento.fecha)
  return (
    <Link
      to="/eventos/$id"
      params={{ id: String(evento.id) }}
      className="card overflow-hidden group hover:ring-1 hover:ring-[#39ff14]/30
                 hover:-translate-y-0.5 transition-all"
    >
      <div className="h-[3px] bg-[#39ff14]" />
      <div className="p-5">
        <div className="flex items-center justify-between font-mono text-xs text-[#6b7a9c] mb-4">
          <span>
            {fecha.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' · '}{evento.hora?.toString().slice(0, 5)}h
          </span>
          <span className="flex items-center gap-1 truncate max-w-[120px]">
            <MapPin className="w-3 h-3 shrink-0" />{evento.nombre_estadio}
          </span>
        </div>
        <h3 className="font-display font-extrabold text-lg uppercase leading-tight text-center mb-4">
          <span className="text-[#39ff14]">{evento.nombre_equipo_local}</span>
          <span className="text-[#3a4a6b] mx-2 text-base">vs</span>
          {evento.nombre_equipo_visitante}
        </h3>
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#39ff14] text-[#050914]
                        font-display font-bold uppercase text-sm tracking-wide
                        group-hover:shadow-[0_0_20px_#39ff1440] transition-all">
          <Ticket className="w-4 h-4" />Comprar
        </div>
      </div>
    </Link>
  )
}

function ProximaEntrada({ entrada }: { entrada: EntradaConEvento }) {
  const fecha = eventDate(entrada)
  return (
    <div className="rounded-2xl border border-[#39ff14]/30 bg-[#0d1529] p-3.5 mb-3.5">
      <div className="font-mono text-[11px] uppercase tracking-wider text-[#39ff14] flex items-center gap-1.5 mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#39ff14] animate-pulse-glow" />
        Próximo · {cuentaRegresiva(fecha)}
      </div>
      <h3 className="font-display font-extrabold text-base uppercase leading-tight">
        <span className="text-[#39ff14]">{entrada.nombre_equipo_local}</span>
        <span className="text-[#3a4a6b] mx-1.5 text-sm">vs</span>
        {entrada.nombre_equipo_visitante}
      </h3>
      <div className="font-mono text-[11px] text-[#6b7a9c] mt-1 flex items-center gap-1.5">
        <CalendarClock className="w-3 h-3" />
        {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
        {' · '}{entrada.hora_evento?.toString().slice(0, 5)}h · {entrada.nombre_estadio}
      </div>
      <div className="font-mono text-[11px] text-[#6b7a9c] mt-0.5 flex items-center gap-1.5">
        <Ticket className="w-3 h-3" />Sector {entrada.nombre_sector}
      </div>
      <Link
        to="/qr/$id"
        params={{ id: String(entrada.id) }}
        className="btn-pitch flex items-center justify-center gap-2 py-2.5 mt-3 text-sm w-full"
      >
        <QrCode className="w-4 h-4" />Ver QR de acceso
      </Link>
    </div>
  )
}

function MiniEntrada({ entrada }: { entrada: EntradaConEvento }) {
  const fecha = eventDate(entrada)
  return (
    <Link
      to="/qr/$id"
      params={{ id: String(entrada.id) }}
      className="flex items-center gap-3 py-2.5 border-t border-[#111d35] group"
    >
      <div className="flex flex-col items-center justify-center w-[42px] h-[42px] rounded-[10px]
                      bg-[#0d1529] border border-[#1a2540] shrink-0">
        <span className="font-display font-bold text-[17px] leading-none">{fecha.getDate()}</span>
        <span className="font-display font-bold text-[9px] tracking-widest text-[#6b7a9c] uppercase">
          {fecha.toLocaleString('es', { month: 'short' })}
        </span>
      </div>
      <div className="min-w-0">
        <div className="font-display font-bold uppercase text-[15px] truncate group-hover:text-[#39ff14] transition-colors">
          {entrada.nombre_equipo_local} vs {entrada.nombre_equipo_visitante}
        </div>
        <div className="font-mono text-[11px] text-[#6b7a9c] truncate">
          {entrada.nombre_estadio} · {entrada.nombre_sector}
        </div>
      </div>
    </Link>
  )
}
