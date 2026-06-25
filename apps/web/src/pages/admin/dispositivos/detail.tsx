import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { EventoConNombres, Equipo } from '@repo/shared'
import { Smartphone, Calendar, MapPin, Plus, Trash2, Loader2, Copy, Check, User, Pencil } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { parseDate, dateStr, todayStr as getTodayStr } from '@/lib/date'

type EventoDispositivo = {
  id_evento: number
  numero_legajo: string
  email_funcionario: string
  fecha_evento: string
  hora_evento: string
  nombre_estadio: string
  nombre_equipo_local: string
  nombre_equipo_visitante: string
  bandera_equipo_local: string
  bandera_equipo_visitante: string
}

type DispositivoDetalle = {
  id: string
  nombre: string
  numero_legajo: string
  email: string
  eventos: EventoDispositivo[]
}

type Funcionario = { numero_legajo: string; email: string }

export function AdminDispositivoDetailPage() {
  const { id } = useParams({ from: '/admin/dispositivos/$id' })
  const qc = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [form, setForm] = useState({ id_evento: 0, numero_legajo: '' })

  const { data: dispositivo, isLoading } = useQuery<DispositivoDetalle>({
    queryKey: ['dispositivo', id],
    queryFn: () => api.get(`/admin/dispositivos/${id}`),
  })

  const { data: eventos = [] } = useQuery<EventoConNombres[]>({
    queryKey: ['eventos'],
    queryFn: () => api.get('/eventos'),
  })

  const { data: funcionarios = [] } = useQuery<Funcionario[]>({
    queryKey: ['admin-funcionarios'],
    queryFn: () => api.get('/admin/funcionarios'),
  })

  const vincularMutation = useMutation({
    mutationFn: (data: typeof form) => api.post(`/admin/dispositivos/${id}/eventos`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispositivo', id] })
      setForm({ id_evento: 0, numero_legajo: '' })
      setShowModal(false)
    },
  })

  const editarMutation = useMutation({
    mutationFn: (nombre: string) => api.put(`/admin/dispositivos/${id}`, { nombre }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispositivo', id] })
      qc.invalidateQueries({ queryKey: ['admin-dispositivos'] })
      setShowEditModal(false)
    },
  })

  const desvincularMutation = useMutation({
    mutationFn: (id_evento: number) => api.delete(`/admin/dispositivos/${id}/eventos/${id_evento}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dispositivo', id] }),
  })

  function copyId() {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) return (
    <div className="p-8 space-y-4">
      <div className="card h-32 animate-pulse" />
      <div className="card h-64 animate-pulse" />
    </div>
  )

  if (!dispositivo) return <div className="p-8 text-center text-[#6b7a9c]">Dispositivo no encontrado.</div>

  const todayStr = getTodayStr()
  const proximos = dispositivo.eventos.filter(e => dateStr(e.fecha_evento) >= todayStr)
  const pasados = dispositivo.eventos.filter(e => dateStr(e.fecha_evento) < todayStr)

  const eventosVinculados = new Set(dispositivo.eventos.map(e => e.id_evento))
  const eventosDisponibles = eventos.filter(e => !eventosVinculados.has(e.id))

  return (
    <div className="p-8 max-w-4xl">
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Vincular a evento" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Evento</label>
            <select className="input-field" value={form.id_evento}
              onChange={e => setForm(f => ({ ...f, id_evento: Number(e.target.value) }))}>
              <option value={0}>Seleccioná evento...</option>
              {eventosDisponibles.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.bandera_equipo_local ?? '🏳️'} {ev.nombre_equipo_local} vs {ev.bandera_equipo_visitante ?? '🏳️'} {ev.nombre_equipo_visitante}
                  {' · '}{String(ev.fecha).slice(0, 10)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Funcionario asignado</label>
            <select className="input-field" value={form.numero_legajo}
              onChange={e => setForm(f => ({ ...f, numero_legajo: e.target.value }))}>
              <option value="">Seleccioná funcionario...</option>
              {funcionarios.map(f => (
                <option key={f.numero_legajo} value={f.numero_legajo}>
                  {f.numero_legajo} — {f.email}
                </option>
              ))}
            </select>
          </div>
          {vincularMutation.isError && (
            <p className="text-red-400 text-sm">{(vincularMutation.error as Error).message}</p>
          )}
          <button
            onClick={() => vincularMutation.mutate(form)}
            disabled={form.id_evento <= 0 || form.numero_legajo === '' || vincularMutation.isPending}
            className="btn-pitch w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {vincularMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Vincular
          </button>
        </div>
      </Modal>

      {/* Edit nombre modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar dispositivo" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input className="input-field" value={editNombre} onChange={e => setEditNombre(e.target.value)}
              placeholder="Ej: Puerta Norte, Escáner A1..." />
          </div>
          {editarMutation.isError && (
            <p className="text-red-400 text-sm">{(editarMutation.error as Error).message}</p>
          )}
          <button
            onClick={() => editarMutation.mutate(editNombre)}
            disabled={editNombre.trim() === '' || editarMutation.isPending}
            className="btn-pitch w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {editarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Guardar
          </button>
        </div>
      </Modal>

      {/* Header */}
      <div className="card card-glow p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0d1529] border border-[#1a2540] flex items-center justify-center shrink-0">
            <Smartphone className="w-7 h-7 text-[#39ff14]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-extrabold text-lg uppercase tracking-wide">
                {dispositivo.nombre || <span className="text-[#3a4a6b] italic font-normal normal-case text-base">Sin nombre</span>}
              </span>
              <button onClick={() => { setEditNombre(dispositivo.nombre); setShowEditModal(true) }}
                className="text-[#3a4a6b] hover:text-[#39ff14] transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <code className="font-mono text-xs text-[#6b7a9c] truncate">{dispositivo.id}</code>
              <button onClick={copyId} className="text-[#3a4a6b] hover:text-[#39ff14] transition-colors shrink-0">
                {copied ? <Check className="w-3.5 h-3.5 text-[#39ff14]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm bg-[#0d1529] border border-[#1a2540] px-2 py-0.5 rounded text-[#39ff14]">
                {dispositivo.numero_legajo}
              </span>
              <span className="text-sm text-[#6b7a9c]">{dispositivo.email}</span>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-pitch flex items-center gap-1.5 py-2 px-3 text-sm shrink-0">
            <Plus className="w-4 h-4" />Vincular evento
          </button>
        </div>
      </div>

      {/* Próximos */}
      {proximos.length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] font-display font-bold uppercase tracking-widest text-[#3a4a6b] mb-3">Próximos</div>
          <div className="space-y-2">
            {proximos.map(ev => <EventoRow key={ev.id_evento} ev={ev} onDesvincular={() => desvincularMutation.mutate(ev.id_evento)} />)}
          </div>
        </div>
      )}

      {/* Pasados */}
      {pasados.length > 0 && (
        <div>
          <div className="text-[10px] font-display font-bold uppercase tracking-widest text-[#3a4a6b] mb-3">Pasados</div>
          <div className="space-y-2 opacity-60">
            {pasados.map(ev => <EventoRow key={ev.id_evento} ev={ev} onDesvincular={() => desvincularMutation.mutate(ev.id_evento)} />)}
          </div>
        </div>
      )}

      {dispositivo.eventos.length === 0 && (
        <div className="card p-16 text-center">
          <Calendar className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
          <p className="text-[#6b7a9c] text-sm">Sin eventos vinculados.</p>
          <button onClick={() => setShowModal(true)} className="btn-pitch mt-4 inline-flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />Vincular primer evento
          </button>
        </div>
      )}
    </div>
  )
}

function EventoRow({ ev, onDesvincular }: { ev: EventoDispositivo; onDesvincular: () => void }) {
  const fecha = parseDate(ev.fecha_evento)
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-[#0d1529] rounded-xl flex items-center justify-center border border-[#1a2540] shrink-0">
        <Calendar className="w-4 h-4 text-[#6b7a9c]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-extrabold text-sm uppercase flex items-center gap-1.5 flex-wrap">
          <span>{ev.bandera_equipo_local}</span>
          <span className="text-[#39ff14]">{ev.nombre_equipo_local}</span>
          <span className="text-[#6b7a9c] font-normal normal-case text-xs">vs</span>
          <span>{ev.bandera_equipo_visitante}</span>
          <span>{ev.nombre_equipo_visitante}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#6b7a9c] mt-0.5 flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {fecha.toLocaleDateString('es-UY')} · {String(ev.hora_evento).slice(0, 5)}h
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />{ev.nombre_estadio}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />{ev.email_funcionario}
            <span className="font-mono text-[10px] bg-[#0d1529] border border-[#1a2540] px-1.5 py-0.5 rounded ml-1">
              {ev.numero_legajo}
            </span>
          </span>
        </div>
      </div>
      <button onClick={onDesvincular} className="text-[#3a4a6b] hover:text-red-400 transition-colors shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
