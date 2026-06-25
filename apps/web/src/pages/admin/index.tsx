import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Estadio, Equipo, EventoConNombres, CreateEventoDTO } from '@repo/shared'
import { Shield, Plus, Building2, Users, Calendar, BarChart3, Loader2, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/date'
import { PageHeader } from '@/components/ui/page-header'

export function AdminPage() {
  const [tab, setTab] = useState<'eventos' | 'estadios' | 'reportes'>('eventos')

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <PageHeader
        title="Panel Admin"
        subtitle="Gestión de infraestructura y eventos"
        icon={Shield}
      />

      <div className="flex gap-1 mb-6 bg-[#090f20] p-1 rounded-xl border border-[#1a2540]">
        {([['eventos', 'Eventos', Calendar], ['estadios', 'Estadios', Building2], ['reportes', 'Reportes', BarChart3]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 flex-1 py-2 rounded-lg text-sm font-display font-bold uppercase tracking-wide justify-center transition-all ${
              tab === key ? 'bg-[#39ff14] text-[#050914]' : 'text-[#6b7a9c] hover:text-[#e8edf8]'
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {tab === 'eventos' && <EventosTab />}
      {tab === 'estadios' && <EstadiosTab />}
      {tab === 'reportes' && <ReportesTab />}
    </div>
  )
}

function EventosTab() {
  const qc = useQueryClient()
  const { data: eventos = [], isLoading } = useQuery<EventoConNombres[]>({
    queryKey: ['eventos'],
    queryFn: () => api.get('/eventos'),
  })
  const { data: estadios = [] } = useQuery<Estadio[]>({ queryKey: ['estadios'], queryFn: () => api.get('/estadios') })
  const { data: equipos = [] } = useQuery<Equipo[]>({ queryKey: ['equipos'], queryFn: () => api.get('/equipos') })

  const [form, setForm] = useState({ fecha: '', hora: '', id_estadio: 0, id_equipo_local: 0, id_equipo_visitante: 0 })
  const [show, setShow] = useState(false)

  const crearMutation = useMutation({
    mutationFn: (data: CreateEventoDTO) => api.post('/eventos', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['eventos'] }); setShow(false) },
  })

  const valid =
    form.fecha.trim() !== '' && form.hora.trim() !== '' &&
    form.id_estadio > 0 && form.id_equipo_local > 0 && form.id_equipo_visitante > 0

  return (
    <div>
      <div className="flex justify-between mb-4">
        <span className="text-[#6b7a9c] text-sm">{eventos.length} eventos programados</span>
        <button onClick={() => setShow(!show)} className="btn-pitch flex items-center gap-1.5 py-2 px-4 text-xs">
          <Plus className="w-3.5 h-3.5" />Nuevo evento
        </button>
      </div>

      {show && (
        <div className="card p-5 mb-4 border-[#39ff1430]">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-[#39ff14] mb-4">Nuevo evento</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Fecha</label>
              <input type="date" className="input-field" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} /></div>
            <div><label className="label">Hora</label>
              <input type="time" className="input-field" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} /></div>
            <div><label className="label">Estadio</label>
              <select className="input-field" value={form.id_estadio} onChange={e => setForm(f => ({ ...f, id_estadio: Number(e.target.value) }))}>
                <option value={0}>Seleccionar...</option>
                {estadios.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select></div>
            <div><label className="label">Equipo Local</label>
              <select className="input-field" value={form.id_equipo_local} onChange={e => setForm(f => ({ ...f, id_equipo_local: Number(e.target.value) }))}>
                <option value={0}>Seleccionar...</option>
                {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select></div>
            <div className="col-span-2"><label className="label">Equipo Visitante</label>
              <select className="input-field" value={form.id_equipo_visitante} onChange={e => setForm(f => ({ ...f, id_equipo_visitante: Number(e.target.value) }))}>
                <option value={0}>Seleccionar...</option>
                {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select></div>
          </div>
          {crearMutation.isError && <p className="text-red-400 text-xs mt-3">{(crearMutation.error as Error).message}</p>}
          <button onClick={() => crearMutation.mutate(form as unknown as CreateEventoDTO)}
            disabled={!valid || crearMutation.isPending}
            className="btn-pitch mt-4 flex items-center gap-2 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {crearMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Crear evento
          </button>
        </div>
      )}

      {isLoading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
        : eventos.map(ev => (
          <div key={ev.id} className="card p-4 mb-2 flex items-center gap-4">
            <div className="w-10 h-10 bg-[#0d1529] rounded-lg flex items-center justify-center border border-[#1a2540] shrink-0">
              <Calendar className="w-4 h-4 text-[#6b7a9c]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-extrabold text-sm uppercase">
                {ev.nombre_equipo_local} <span className="text-[#6b7a9c] font-400 normal-case">vs</span> {ev.nombre_equipo_visitante}
              </div>
              <div className="text-xs text-[#6b7a9c]">{ev.nombre_estadio} · {formatDate(ev.fecha)}</div>
            </div>
          </div>
        ))}
    </div>
  )
}

function EstadiosTab() {
  const { data: estadios = [], isLoading } = useQuery<Estadio[]>({
    queryKey: ['estadios'],
    queryFn: () => api.get('/estadios'),
  })
  return (
    <div className="space-y-2">
      {isLoading ? [...Array(4)].map((_, i) => <div key={i} className="card h-14 animate-pulse" />) :
        estadios.map(e => (
          <div key={e.id} className="card p-4 flex items-center gap-3">
            <Building2 className="w-4 h-4 text-[#6b7a9c]" />
            <span className="font-display font-bold text-sm uppercase">{e.nombre}</span>
          </div>
        ))}
    </div>
  )
}

function ReportesTab() {
  const { data: eventos = [] } = useQuery<{ id: number; nombre_equipo_local: string; nombre_equipo_visitante: string; total_entradas: number }[]>({
    queryKey: ['reporte-eventos'],
    queryFn: () => api.get('/reportes/eventos-mas-vendidos'),
  })
  const { data: compradores = [] } = useQuery<{ email: string; total_entradas: number; monto_gastado: number }[]>({
    queryKey: ['reporte-compradores'],
    queryFn: () => api.get('/reportes/ranking-compradores'),
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#6b7a9c] mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#39ff14]" />Eventos más vendidos
        </h3>
        <div className="space-y-2">
          {eventos.map((ev, i) => (
            <div key={ev.id} className="card p-3 flex items-center gap-3">
              <span className="font-display font-black text-[#39ff14] text-lg w-6">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-display font-bold uppercase truncate">
                  {ev.nombre_equipo_local} vs {ev.nombre_equipo_visitante}
                </div>
              </div>
              <span className="badge-pitch">{ev.total_entradas}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#6b7a9c] mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#amber]" />Ranking compradores
        </h3>
        <div className="space-y-2">
          {compradores.map((c, i) => (
            <div key={c.email} className="card p-3 flex items-center gap-3">
              <span className="font-display font-black text-[#ffb800] text-lg w-6">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate font-mono">{c.email}</div>
              </div>
              <span className="badge-amber">{c.total_entradas} ent.</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
