import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { EntradaConEvento, TransferenciaConEvento, EventoConNombres } from '@repo/shared'
import {
  Ticket, QrCode, ArrowRightLeft, MapPin, CalendarClock, Inbox, ChevronRight,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

/** Event start as a real datetime (fecha is a date, hora is "HH:MM:SS"). */
function eventDate(e: { fecha_evento: string | Date; hora_evento?: string }) {
  const d = new Date(e.fecha_evento)
  const [h, m] = (e.hora_evento ?? '').split(':')
  if (h) d.setHours(Number(h), Number(m) || 0, 0, 0)
  return d
}

function cuentaRegresiva(target: Date) {
  const ms = target.getTime() - Date.now()
  if (ms <= 0) return { value: 'Hoy', unit: 'en juego' }
  const dias = Math.floor(ms / 86_400_000)
  if (dias >= 1) return { value: String(dias), unit: dias === 1 ? 'día' : 'días' }
  const horas = Math.max(1, Math.floor(ms / 3_600_000))
  return { value: String(horas), unit: horas === 1 ? 'hora' : 'horas' }
}

export function DashboardPage() {
  const { data: entradas = [], isLoading } = useQuery<EntradaConEvento[]>({
    queryKey: ['mis-entradas'],
    queryFn: () => api.get('/entradas'),
  })
  const { data: pendientes = [] } = useQuery<TransferenciaConEvento[]>({
    queryKey: ['transferencias-pendientes'],
    queryFn: () => api.get('/transferencias/pendientes'),
  })
  const { data: eventos = [] } = useQuery<EventoConNombres[]>({
    queryKey: ['eventos'],
    queryFn: () => api.get('/eventos'),
  })

  // Derived once per data change, not on every unrelated render.
  const { activas, proxima, resto } = useMemo(() => {
    const activas = entradas
      .filter((e) => !e.consumida)
      .sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime())
    const now = Date.now()
    const proxima = activas.find((e) => eventDate(e).getTime() >= now) ?? activas[0]
    return { activas, proxima, resto: activas.filter((e) => e.id !== proxima?.id) }
  }, [entradas])

  // Upcoming events to discover/buy (soonest first).
  const proximosEventos = useMemo(() => {
    const now = Date.now()
    return eventos
      .filter((e) => new Date(e.fecha).getTime() >= now)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 4)
  }, [eventos])

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="card h-44 animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <PageHeader
        title="Mis Entradas"
        subtitle="Tu próximo partido y entradas activas"
        icon={Ticket}
        action={
          <div className="badge-pitch flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5" />
            {activas.length} activa{activas.length !== 1 ? 's' : ''}
          </div>
        }
      />

      {/* Transferencias entrantes esperando respuesta — accionable */}
      {pendientes.length > 0 && (
        <Link
          to="/u/transferencias"
          className="flex items-center gap-3 mb-6 rounded-xl px-4 py-3 bg-[#ffb800]/10 border border-[#ffb800]/30
                     hover:bg-[#ffb800]/15 transition-colors group"
        >
          <Inbox className="w-5 h-5 text-[#ffb800] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[#ffb800] font-display font-bold text-sm uppercase tracking-wide">
              {pendientes.length} transferencia{pendientes.length !== 1 ? 's' : ''} esperando tu respuesta
            </p>
            <p className="text-[#ffb800]/70 text-xs">Aceptá o rechazá entradas que te quieren pasar</p>
          </div>
          <ChevronRight className="w-4 h-4 text-[#ffb800] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {activas.length === 0 ? (
        <div className="card p-16 text-center">
          <Ticket className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
          <p className="text-[#6b7a9c] mb-4">No tenés entradas activas.</p>
          <Link to="/" className="btn-pitch inline-block">Ver eventos</Link>
        </div>
      ) : (
        <>
          {proxima && <HeroProximo entrada={proxima} />}

          {resto.length > 0 && (
            <>
              <div className="label mt-10 mb-3">
                {resto.length === 1 ? 'Otra entrada' : 'Otras entradas'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resto.map((entrada) => <EntradaCard key={entrada.id} entrada={entrada} />)}
              </div>
            </>
          )}
        </>
      )}

      {/* Discovery: próximos eventos para comprar */}
      {proximosEventos.length > 0 && (
        <section className="mt-12">
          <div className="label mb-3">Próximos eventos</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proximosEventos.map((ev) => <EventoCard key={ev.id} evento={ev} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function EventoCard({ evento }: { evento: EventoConNombres }) {
  const fecha = new Date(evento.fecha)
  return (
    <Link
      to="/eventos/$id"
      params={{ id: String(evento.id) }}
      className="card card-glow p-5 group hover:ring-1 hover:ring-[#39ff14]/30 transition-all"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="badge-amber">
          {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
          {' · '}{evento.hora?.toString().slice(0, 5)}h
        </span>
      </div>
      <h3 className="font-display font-extrabold text-lg uppercase leading-tight mb-3">
        <span className="text-[#39ff14]">{evento.nombre_equipo_local}</span>
        <span className="text-[#6b7a9c] mx-2 text-base">vs</span>
        {evento.nombre_equipo_visitante}
      </h3>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-[#6b7a9c]">
          <MapPin className="w-3 h-3" />{evento.nombre_estadio}
        </span>
        <span className="flex items-center gap-1 text-[#39ff14] text-xs font-display font-bold uppercase tracking-wide
                         group-hover:translate-x-0.5 transition-transform">
          Comprar <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  )
}

function HeroProximo({ entrada }: { entrada: EntradaConEvento }) {
  const fecha = eventDate(entrada)
  const cd = cuentaRegresiva(fecha)

  return (
    <div className="card card-glow ring-1 ring-[#39ff14]/40 p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex-1 min-w-0">
          <span className="badge-pitch">Tu próximo partido</span>
          <h2 className="font-display font-black text-3xl sm:text-4xl uppercase leading-[0.95] mt-3 mb-3">
            <span className="text-[#39ff14]">{entrada.nombre_equipo_local}</span>
            <span className="text-[#6b7a9c] mx-2 text-2xl">vs</span>
            {entrada.nombre_equipo_visitante}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[#6b7a9c]">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4" />
              {fecha.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short' })}
              {' · '}{entrada.hora_evento?.toString().slice(0, 5)}h
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />{entrada.nombre_estadio}
            </span>
            <span className="flex items-center gap-1.5">
              <Ticket className="w-4 h-4" />Sector {entrada.nombre_sector}
            </span>
          </div>
        </div>

        {/* Countdown */}
        <div className="sm:border-l sm:border-[#1a2540] sm:pl-6 text-center shrink-0">
          <div className="label mb-1">Faltan</div>
          <div className="font-display font-black text-5xl text-[#39ff14] leading-none">{cd.value}</div>
          <div className="label mt-1">{cd.unit}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6 sm:max-w-md">
        <Link to="/qr/$id" params={{ id: String(entrada.id) }}
          className="btn-pitch flex items-center gap-2 py-2.5 px-4 text-sm flex-1 justify-center">
          <QrCode className="w-4 h-4" />Ver QR de acceso
        </Link>
        <Link to="/u/transferencias"
          className="btn-outline flex items-center gap-2 py-2.5 px-4 text-sm justify-center">
          <ArrowRightLeft className="w-4 h-4" />Transferir
        </Link>
      </div>
    </div>
  )
}

function EntradaCard({ entrada }: { entrada: EntradaConEvento }) {
  const fecha = eventDate(entrada)

  return (
    <div className="card card-glow p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="badge-amber mb-2">
            {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
            {' · '}{entrada.hora_evento?.toString().slice(0, 5)}h
          </div>
          <h3 className="font-display font-extrabold text-lg uppercase leading-tight">
            <span className="text-[#39ff14]">{entrada.nombre_equipo_local}</span>
            <span className="text-[#6b7a9c] mx-2 text-base">vs</span>
            {entrada.nombre_equipo_visitante}
          </h3>
        </div>
        <div className="font-mono text-xs text-[#6b7a9c] bg-[#0d1529] px-2 py-1 rounded border border-[#1a2540]">
          #{entrada.id}
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-[#6b7a9c]">
          <MapPin className="w-3 h-3" />{entrada.nombre_estadio}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#6b7a9c]">
          <Ticket className="w-3 h-3" />Sector {entrada.nombre_sector}
        </div>
      </div>

      <div className="h-px bg-[#1a2540] mb-4" />

      <div className="flex items-center gap-2">
        <Link to="/qr/$id" params={{ id: String(entrada.id) }}
          className="btn-pitch flex items-center gap-1.5 py-2 px-4 text-xs flex-1 justify-center">
          <QrCode className="w-3.5 h-3.5" />Ver QR
        </Link>
        <Link to="/u/transferencias"
          className="btn-outline flex items-center gap-1.5 py-2 px-4 text-xs flex-1 justify-center">
          <ArrowRightLeft className="w-3.5 h-3.5" />Transferir
        </Link>
      </div>
    </div>
  )
}
