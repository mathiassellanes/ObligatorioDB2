import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { EventoConNombres, Estadio, Equipo, CreateEventoDTO } from '@repo/shared'
import { Calendar, Plus, ChevronRight, Loader2, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

export function AdminEventosPage() {
  const qc = useQueryClient()
  const { data: eventos = [], isLoading } = useQuery<EventoConNombres[]>({
    queryKey: ['eventos'],
    queryFn: () => api.get('/eventos'),
  })
  const { data: estadios = [] } = useQuery<Estadio[]>({
    queryKey: ['admin-estadios'],
    queryFn: () => api.get('/admin/estadios'),
  })
  const { data: equipos = [] } = useQuery<Equipo[]>({
    queryKey: ['equipos'],
    queryFn: () => api.get('/equipos'),
  })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ fecha: '', hora: '', id_estadio: 0, id_equipo_local: 0, id_equipo_visitante: 0 })

  const crearMutation = useMutation({
    mutationFn: (data: CreateEventoDTO) => api.post('/eventos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventos'] })
      setShowForm(false)
      setForm({ fecha: '', hora: '', id_estadio: 0, id_equipo_local: 0, id_equipo_visitante: 0 })
    },
  })

  const valid =
    form.fecha.trim() !== '' && form.hora.trim() !== '' &&
    form.id_estadio > 0 && form.id_equipo_local > 0 && form.id_equipo_visitante > 0

  const upcoming = eventos.filter(e => new Date(e.fecha) >= new Date())
  const past = eventos.filter(e => new Date(e.fecha) < new Date())

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="Eventos"
        subtitle={`${eventos.length} eventos en total`}
        icon={Calendar}
        action={
          <button onClick={() => setShowForm(!showForm)} className="btn-pitch flex items-center gap-1.5 py-2 px-4 text-sm">
            <Plus className="w-4 h-4" />Nuevo evento
          </button>
        }
      />

      {showForm && (
        <div className="card card-glow p-6 mb-6">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-[#39ff14] mb-5">Nuevo evento</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Fecha</label>
              <input type="date" className="input-field" value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} /></div>
            <div><label className="label">Hora</label>
              <input type="time" className="input-field" value={form.hora}
                onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} /></div>
            <div className="col-span-2"><label className="label">Estadio</label>
              <select className="input-field" value={form.id_estadio}
                onChange={e => setForm(f => ({ ...f, id_estadio: Number(e.target.value) }))}>
                <option value={0}>Seleccioná un estadio...</option>
                {estadios.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select></div>
            <div><label className="label">Equipo Local</label>
              <select className="input-field" value={form.id_equipo_local}
                onChange={e => setForm(f => ({ ...f, id_equipo_local: Number(e.target.value) }))}>
                <option value={0}>Seleccioná...</option>
                {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select></div>
            <div><label className="label">Equipo Visitante</label>
              <select className="input-field" value={form.id_equipo_visitante}
                onChange={e => setForm(f => ({ ...f, id_equipo_visitante: Number(e.target.value) }))}>
                <option value={0}>Seleccioná...</option>
                {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select></div>
          </div>
          {crearMutation.isError && (
            <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm">
              {(crearMutation.error as Error).message}
            </div>
          )}
          <button onClick={() => crearMutation.mutate(form as unknown as CreateEventoDTO)}
            disabled={!valid || crearMutation.isPending}
            className="btn-pitch mt-4 flex items-center gap-2 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {crearMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear evento
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-6">
              <div className="text-[10px] font-display font-bold uppercase tracking-widest text-[#3a4a6b] mb-3">Próximos</div>
              <div className="space-y-2">{upcoming.map(ev => <EventoRow key={ev.id} ev={ev} />)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div className="text-[10px] font-display font-bold uppercase tracking-widest text-[#3a4a6b] mb-3">Pasados</div>
              <div className="space-y-2 opacity-60">{past.map(ev => <EventoRow key={ev.id} ev={ev} />)}</div>
            </div>
          )}
          {eventos.length === 0 && (
            <div className="card p-16 text-center">
              <Calendar className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
              <p className="text-[#6b7a9c]">Sin eventos creados.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EventoRow({ ev }: { ev: EventoConNombres }) {
  return (
    <Link to="/admin/eventos/$id" params={{ id: String(ev.id) }}
      className="card p-4 flex items-center gap-4 hover:border-[#39ff1430] transition-colors group block">
      <div className="w-10 h-10 bg-[#0d1529] rounded-xl flex items-center justify-center border border-[#1a2540] shrink-0">
        <Calendar className="w-4 h-4 text-[#6b7a9c]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-extrabold text-sm uppercase">
          <span className="text-[#39ff14]">{ev.nombre_equipo_local}</span>
          <span className="text-[#6b7a9c] mx-2 font-normal normal-case text-xs">vs</span>
          {ev.nombre_equipo_visitante}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6b7a9c] mt-0.5">
          <MapPin className="w-3 h-3" />{ev.nombre_estadio}
          <span>·</span>
          {new Date(ev.fecha).toLocaleDateString('es-UY')} · {ev.hora?.toString().slice(0, 5)}h
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-[#3a4a6b] group-hover:text-[#39ff14] transition-colors shrink-0" />
    </Link>
  )
}
