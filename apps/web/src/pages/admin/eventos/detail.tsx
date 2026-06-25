import { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { EventoDetalle, Sector, HabilitarSectoresDTO } from '@repo/shared'
import { Calendar, MapPin, Loader2, CheckCircle, Layers, Shield, Users, Trash2 } from 'lucide-react'
import { parseDate } from '@/lib/date'

type Asignacion = {
  numero_legajo: string
  id_sector: number
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

  const { data: dispositivos = [] } = useQuery<{ id: string; nombre: string; numero_legajo: string; email: string }[]>({
    queryKey: ['admin-dispositivos'],
    queryFn: () => api.get('/admin/dispositivos'),
  })

  const [sectoresForm, setSectoresForm] = useState<{ id_sector: number; costo_entrada: string; enabled: boolean }[]>([])

  useEffect(() => {
    if (!sectoresDisponibles.length) return
    setSectoresForm(
      sectoresDisponibles.map(s => {
        const habilitado = evento?.sectores?.find(se => se.id === s.id)
        return { id_sector: s.id, costo_entrada: habilitado ? String(habilitado.costo_entrada) : '', enabled: !!habilitado }
      })
    )
  }, [sectoresDisponibles.length, evento?.id])

  const habilitarMutation = useMutation({
    mutationFn: (data: HabilitarSectoresDTO) => api.post(`/eventos/${id}/sectores`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['evento-admin', id] }) },
  })

  const deshabilitarSectorMutation = useMutation({
    mutationFn: (id_sector: number) => api.delete(`/eventos/${id}/sectores/${id_sector}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['evento-admin', id] }) },
  })

  const desasignarMutation = useMutation({
    mutationFn: (a: { id_sector: number; numero_legajo: string }) =>
      api.delete(`/eventos/${id}/asignar-funcionario`, a),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evento-asignaciones', id] }),
  })

  const [asignarForm, setAsignarForm] = useState({ id_sector: 0, numero_legajo: '', id_dispositivo: '' })
  const asignarMutation = useMutation({
    mutationFn: (data: { id_sector: number; numero_legajo: string; id_dispositivo: string }) =>
      api.post(`/eventos/${id}/asignar-funcionario`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evento-asignaciones', id] })
      qc.invalidateQueries({ queryKey: ['admin-dispositivos'] })
      setAsignarForm({ id_sector: 0, numero_legajo: '', id_dispositivo: '' })
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

  const fecha = parseDate(evento.fecha)
  const dispositivosFuncionario = dispositivos.filter(d => d.numero_legajo === asignarForm.numero_legajo)
  const asignarValid = asignarForm.id_sector > 0 && asignarForm.numero_legajo.trim() !== '' && asignarForm.id_dispositivo.trim() !== ''

  // Detectar cambios vs estado guardado
  const sectoresConCambios = sectoresForm.filter(f => {
    const guardado = evento.sectores?.find(se => se.id === f.id_sector)
    const estabaHabilitado = !!guardado
    if (f.enabled !== estabaHabilitado) return true
    if (f.enabled && guardado && String(guardado.costo_entrada) !== f.costo_entrada) return true
    return false
  })
  const hayCambios = sectoresConCambios.length > 0

  async function guardarSectores() {
    const aHabilitar = sectoresForm.filter(f => f.enabled && f.costo_entrada.trim() !== '' && Number(f.costo_entrada) > 0)
    const aDeshabilitar = sectoresForm.filter(f => {
      if (f.enabled) return false
      return !!evento.sectores?.find(se => se.id === f.id_sector)
    })
    if (aHabilitar.length > 0) {
      await habilitarMutation.mutateAsync({ sectores: aHabilitar.map(f => ({ id_sector: f.id_sector, costo_entrada: Number(f.costo_entrada) })) })
    }
    for (const f of aDeshabilitar) {
      await deshabilitarSectorMutation.mutateAsync(f.id_sector)
    }
  }
  const guardandoSectores = habilitarMutation.isPending || deshabilitarSectorMutation.isPending

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="card card-glow p-6 mb-6">
        <div className="badge-amber mb-3">
          {fecha.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}{evento.hora?.toString().slice(0, 5)}h
        </div>
        <h1 className="font-display font-black text-3xl uppercase tracking-tight leading-none mb-3 flex items-center gap-2 flex-wrap">
          <span className="text-3xl">{evento.bandera_equipo_local ?? '🏳️'}</span>
          <span className="text-[#39ff14]">{evento.nombre_equipo_local}</span>
          <span className="text-[#6b7a9c] text-xl font-normal normal-case">vs</span>
          <span className="text-3xl">{evento.bandera_equipo_visitante ?? '🏳️'}</span>
          <span>{evento.nombre_equipo_visitante}</span>
        </h1>
        <div className="flex items-center gap-1.5 text-[#6b7a9c] text-sm">
          <MapPin className="w-4 h-4" />{evento.nombre_estadio}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sectores */}
        <div>
          <h2 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#6b7a9c] flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-[#39ff14]" />Sectores
          </h2>

          {sectoresDisponibles.length === 0 ? (
            <div className="card p-6 text-center text-[#6b7a9c] text-sm">El estadio no tiene sectores creados</div>
          ) : (
            <div className="card p-4 space-y-3">
              {sectoresDisponibles.map(s => {
                const idx = sectoresForm.findIndex(f => f.id_sector === s.id)
                const form = sectoresForm[idx]
                const enabled = form?.enabled ?? false
                const vendidas = Number(evento.sectores?.find(se => se.id === s.id)?.entradas_vendidas ?? 0)
                const cap = s.capacidad_maxima
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={e => setSectoresForm(f => f.map((x, i) => i === idx ? { ...x, enabled: e.target.checked } : x))}
                      className="w-4 h-4 accent-[#39ff14] shrink-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-display font-bold text-sm uppercase ${!enabled ? 'text-[#3a4a6b]' : ''}`}>{s.nombre}</span>
                        {enabled && vendidas > 0 && (
                          <span className="text-[10px] text-[#6b7a9c] font-mono">{vendidas}/{cap}</span>
                        )}
                      </div>
                      {enabled && vendidas > 0 && (
                        <div className="h-1 bg-[#0d1529] rounded-full overflow-hidden mt-1 w-24">
                          <div className="h-full bg-[#39ff14] rounded-full" style={{ width: `${(vendidas / cap) * 100}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-sm ${!enabled ? 'text-[#3a4a6b]' : 'text-[#6b7a9c]'}`}>$</span>
                      <input type="number" placeholder="Precio"
                        disabled={!enabled}
                        className="input-field w-24 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        value={form?.costo_entrada ?? ''}
                        onChange={e => setSectoresForm(f => f.map((x, i) => i === idx ? { ...x, costo_entrada: e.target.value } : x))}
                      />
                    </div>
                  </div>
                )
              })}
              {hayCambios && (
                <button
                  onClick={guardarSectores}
                  disabled={guardandoSectores}
                  className="btn-pitch w-full py-2 text-xs flex items-center justify-center gap-1.5 mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
                  {guardandoSectores ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Guardar cambios
                </button>
              )}
            </div>
          )}
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
                  onChange={e => setAsignarForm(f => ({ ...f, numero_legajo: e.target.value, id_dispositivo: '' }))}>
                  <option value="">Seleccioná funcionario...</option>
                  {funcionarios.map(f => (
                    <option key={f.numero_legajo} value={f.numero_legajo}>
                      {f.numero_legajo} — {f.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Dispositivo <span className="text-red-400">*</span></label>
                {asignarForm.numero_legajo === '' ? (
                  <p className="text-[#3a4a6b] text-xs mt-1">Primero seleccioná un funcionario</p>
                ) : dispositivosFuncionario.length === 0 ? (
                  <p className="text-amber-400 text-xs mt-1">Este funcionario no tiene dispositivos. Creá uno en la sección Dispositivos.</p>
                ) : (
                  <select className="input-field" value={asignarForm.id_dispositivo}
                    onChange={e => setAsignarForm(f => ({ ...f, id_dispositivo: e.target.value }))}>
                    <option value="">Seleccioná dispositivo...</option>
                    {dispositivosFuncionario.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nombre || d.id.slice(0, 8)} — {d.email}
                      </option>
                    ))}
                  </select>
                )}
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
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => desasignarMutation.mutate({ id_sector: a.id_sector, numero_legajo: a.numero_legajo })}
                          className="text-[#3a4a6b] hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
