import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { EventoDetalle, Sector, HabilitarSectoresDTO } from '@repo/shared'
import { Calendar, MapPin, Plus, Loader2, CheckCircle, Layers, Shield, Users } from 'lucide-react'

type Asignacion = {
  numero_legajo: string
  email_funcionario: string
  nombre_sector: string
  total_entradas: number
  entradas_validadas: number
  validacion_completa: boolean
}

export function AdminEventoDetailPage() {
  const { id } = useParams({ from: '/admin/eventos/$id' })
  const qc = useQueryClient()

  const { data: evento, isLoading } = useQuery<EventoDetalle>({
    queryKey: ['evento-admin', id],
    queryFn: () => api.get(`/eventos/${id}`),
  })

  const { data: sectoresDisponibles = [] } = useQuery<Sector[]>({
    queryKey: ['estadio-sectores', evento?.id_estadio],
    queryFn: () => api.get(`/estadios/${evento!.id_estadio}/sectores`),
    enabled: !!evento,
  })

  const { data: asignaciones = [] } = useQuery<Asignacion[]>({
    queryKey: ['evento-asignaciones', id],
    queryFn: () => api.get(`/eventos/${id}/asignaciones`),
  })

  const { data: funcionarios = [] } = useQuery<{ numero_legajo: string; email: string }[]>({
    queryKey: ['admin-funcionarios'],
    queryFn: () => api.get('/admin/funcionarios'),
  })

  const [sectoresForm, setSectoresForm] = useState<{ id_sector: number; costo_entrada: string }[]>([])
  const [showHabilitar, setShowHabilitar] = useState(false)

  const habilitarMutation = useMutation({
    mutationFn: (data: HabilitarSectoresDTO) => api.post(`/eventos/${id}/sectores`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evento-admin', id] })
      setShowHabilitar(false)
      setSectoresForm([])
    },
  })

  const [asignarForm, setAsignarForm] = useState({ id_sector: 0, numero_legajo: '' })
  const asignarMutation = useMutation({
    mutationFn: (data: { id_sector: number; numero_legajo: string }) =>
      api.post(`/eventos/${id}/asignar-funcionario`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evento-asignaciones', id] })
      setAsignarForm({ id_sector: 0, numero_legajo: '' })
    },
  })

  if (isLoading) return (
    <div className="p-8 space-y-4">
      <div className="card h-40 animate-pulse" />
      <div className="grid grid-cols-2 gap-4">
        <div className="card h-48 animate-pulse" />
        <div className="card h-48 animate-pulse" />
      </div>
    </div>
  )

  if (!evento) return <div className="p-8 text-center text-[#6b7a9c]">Evento no encontrado.</div>

  const fecha = new Date(evento.fecha)
  const sectoresNoHabilitados = sectoresDisponibles.filter(
    s => !evento.sectores?.find(se => se.id === s.id)
  )

  const habilitarValid =
    sectoresForm.length > 0 &&
    sectoresForm.every(f => f.costo_entrada.trim() !== '' && Number(f.costo_entrada) > 0)
  const asignarValid = asignarForm.id_sector > 0 && asignarForm.numero_legajo.trim() !== ''

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="card card-glow p-6 mb-6">
        <div className="badge-amber mb-3">
          {fecha.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}{evento.hora?.toString().slice(0, 5)}h
        </div>
        <h1 className="font-display font-black text-4xl uppercase tracking-tight leading-none mb-3">
          <span className="text-[#39ff14]">{evento.nombre_equipo_local}</span>
          <span className="text-[#6b7a9c] mx-3 text-2xl">vs</span>
          {evento.nombre_equipo_visitante}
        </h1>
        <div className="flex items-center gap-1.5 text-[#6b7a9c] text-sm">
          <MapPin className="w-4 h-4" />{evento.nombre_estadio}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sectores habilitados */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#6b7a9c] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#39ff14]" />Sectores habilitados
            </h2>
            {sectoresNoHabilitados.length > 0 && (
              <button onClick={() => setShowHabilitar(!showHabilitar)}
                className="btn-outline flex items-center gap-1 py-1.5 px-3 text-xs">
                <Plus className="w-3 h-3" />Habilitar
              </button>
            )}
          </div>

          {showHabilitar && (
            <div className="card p-4 mb-3 border-[#39ff1420]">
              <p className="text-xs text-[#6b7a9c] mb-3">Seleccioná sectores y precio:</p>
              {sectoresNoHabilitados.map(s => {
                const idx = sectoresForm.findIndex(f => f.id_sector === s.id)
                const checked = idx >= 0
                return (
                  <div key={s.id} className="flex items-center gap-2 mb-2">
                    <input type="checkbox" id={`s-${s.id}`} checked={checked}
                      onChange={e => {
                        if (e.target.checked) setSectoresForm(f => [...f, { id_sector: s.id, costo_entrada: '' }])
                        else setSectoresForm(f => f.filter(x => x.id_sector !== s.id))
                      }} className="accent-[#39ff14]" />
                    <label htmlFor={`s-${s.id}`} className="text-sm flex-1">{s.nombre}</label>
                    {checked && (
                      <input type="number" placeholder="Precio" className="input-field w-24 py-1 text-sm"
                        value={sectoresForm[idx]!.costo_entrada}
                        onChange={e => setSectoresForm(f => f.map((x, i) => i === idx ? { ...x, costo_entrada: e.target.value } : x))} />
                    )}
                  </div>
                )
              })}
              <button
                onClick={() => habilitarMutation.mutate({
                  sectores: sectoresForm.map(f => ({ id_sector: f.id_sector, costo_entrada: Number(f.costo_entrada) }))
                })}
                disabled={!habilitarValid || habilitarMutation.isPending}
                className="btn-pitch w-full py-1.5 text-xs flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {habilitarMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Guardar
              </button>
            </div>
          )}

          <div className="space-y-2">
            {(!evento.sectores || evento.sectores.length === 0) ? (
              <div className="card p-6 text-center text-[#6b7a9c] text-sm">Sin sectores habilitados</div>
            ) : evento.sectores.map(s => {
              const vendidas = Number(s.entradas_vendidas)
              const pct = (vendidas / s.capacidad_maxima) * 100
              return (
                <div key={s.id} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-bold text-sm uppercase">{s.nombre}</span>
                    <span className="font-display font-black text-[#39ff14]">${Number(s.costo_entrada).toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-[#0d1529] rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-[#39ff14] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-[#6b7a9c]">{vendidas} / {s.capacidad_maxima} vendidas</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Asignar funcionario */}
        <div>
          <h2 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#6b7a9c] flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-[#39ff14]" />Asignar funcionario
          </h2>
          <div className="card p-5">
            <div className="space-y-3">
              <div>
                <label className="label">Sector</label>
                <select className="input-field" value={asignarForm.id_sector}
                  onChange={e => setAsignarForm(f => ({ ...f, id_sector: Number(e.target.value) }))}>
                  <option value={0}>Seleccioná sector...</option>
                  {evento.sectores?.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Funcionario</label>
                <select className="input-field" value={asignarForm.numero_legajo}
                  onChange={e => setAsignarForm(f => ({ ...f, numero_legajo: e.target.value }))}>
                  <option value="">Seleccioná funcionario...</option>
                  {funcionarios.map(f => (
                    <option key={f.numero_legajo} value={f.numero_legajo}>
                      {f.numero_legajo} — {f.email}
                    </option>
                  ))}
                </select>
              </div>
              {asignarMutation.isError && (
                <p className="text-red-400 text-xs">{(asignarMutation.error as Error).message}</p>
              )}
              {asignarMutation.isSuccess && (
                <div className="flex items-center gap-2 text-[#39ff14] text-sm">
                  <CheckCircle className="w-4 h-4" />Funcionario asignado
                </div>
              )}
              <button
                onClick={() => asignarMutation.mutate(asignarForm)}
                disabled={!asignarValid || asignarMutation.isPending}
                className="btn-pitch w-full flex items-center justify-center gap-2 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {asignarMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Asignar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Funcionarios asignados */}
      <div>
        <h2 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#6b7a9c] flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-[#39ff14]" />Funcionarios asignados
        </h2>

        {asignaciones.length === 0 ? (
          <div className="card p-8 text-center text-[#6b7a9c] text-sm">Sin funcionarios asignados</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a2540]">
                  <th className="text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">Legajo</th>
                  <th className="text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">Email</th>
                  <th className="text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">Sector</th>
                  <th className="text-right px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">Habilitados</th>
                  <th className="text-right px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">Validados</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {asignaciones.map((a, i) => {
                  const total = Number(a.total_entradas)
                  const validadas = Number(a.entradas_validadas)
                  const pct = total > 0 ? (validadas / total) * 100 : 0
                  return (
                    <tr key={`${a.numero_legajo}-${a.nombre_sector}`}
                      className={i < asignaciones.length - 1 ? 'border-b border-[#1a2540]' : ''}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-[#0d1529] border border-[#1a2540] px-2 py-0.5 rounded text-[#e8edf8]">
                          {a.numero_legajo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6b7a9c] font-mono">{a.email_funcionario}</td>
                      <td className="px-4 py-3">
                        <span className="font-display font-bold text-xs uppercase">{a.nombre_sector}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-display font-black text-base text-[#e8edf8]">{total}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1 bg-[#0d1529] rounded-full overflow-hidden">
                            <div className="h-full bg-[#39ff14] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-display font-bold text-sm text-[#39ff14]">{validadas}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {a.validacion_completa
                          ? <span className="badge-pitch text-[10px]">✓ completo</span>
                          : <span className="badge-amber text-[10px]">en curso</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
