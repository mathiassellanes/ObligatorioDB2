import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Modal } from '@/components/ui/modal'
import { Smartphone, Plus, Trash2, Loader2, Copy, Check } from 'lucide-react'
import type { EventoConNombres } from '@repo/shared'

type Dispositivo = {
  id: string
  numero_legajo: string
  email: string
  id_evento: number
  nombre_equipo_local: string
  nombre_equipo_visitante: string
  fecha_evento: string
}
type Funcionario = { numero_legajo: string; email: string }

const EMPTY = { numero_legajo: '', id_evento: 0 }

export function AdminDispositivosPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [copied, setCopied] = useState<string | null>(null)

  const { data: dispositivos = [], isLoading } = useQuery<Dispositivo[]>({
    queryKey: ['admin-dispositivos'],
    queryFn: () => api.get('/admin/dispositivos'),
  })
  const { data: funcionarios = [] } = useQuery<Funcionario[]>({
    queryKey: ['admin-funcionarios'],
    queryFn: () => api.get('/admin/funcionarios'),
  })
  const { data: eventos = [] } = useQuery<EventoConNombres[]>({
    queryKey: ['eventos'],
    queryFn: () => api.get('/eventos'),
  })

  const crearMutation = useMutation({
    mutationFn: (data: typeof EMPTY) => api.post('/admin/dispositivos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-dispositivos'] })
      setForm(EMPTY)
      setShowModal(false)
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/dispositivos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-dispositivos'] }),
  })

  function copyId(id: string) {
    navigator.clipboard.writeText(id)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title text-3xl">Dispositivos</h1>
          <p className="text-[#6b7a9c] text-sm mt-1">{dispositivos.length} dispositivos registrados</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-pitch flex items-center gap-1.5 py-2 px-4 text-sm">
          <Plus className="w-4 h-4" />Nuevo dispositivo
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : dispositivos.length === 0 ? (
        <div className="card p-16 text-center">
          <Smartphone className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
          <p className="text-[#6b7a9c]">Sin dispositivos registrados.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a2540]">
                <th className="text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">UUID</th>
                <th className="text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">Funcionario</th>
                <th className="text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">Evento</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {dispositivos.map((d, i) => (
                <tr key={d.id} className={i < dispositivos.length - 1 ? 'border-b border-[#1a2540]' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs text-[#6b7a9c] truncate max-w-[160px]">{d.id}</code>
                      <button onClick={() => copyId(d.id)} className="text-[#3a4a6b] hover:text-[#39ff14] transition-colors shrink-0">
                        {copied === d.id
                          ? <Check className="w-3.5 h-3.5 text-[#39ff14]" />
                          : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-[#0d1529] border border-[#1a2540] px-2 py-0.5 rounded text-[#39ff14]">
                        {d.numero_legajo}
                      </span>
                      <span className="text-xs text-[#6b7a9c] hidden sm:block">{d.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#e8edf8]">
                    {d.nombre_equipo_local} vs {d.nombre_equipo_visitante}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => eliminarMutation.mutate(d.id)}
                      disabled={eliminarMutation.isPending}
                      className="text-[#3a4a6b] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo dispositivo" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Funcionario</label>
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
          <div>
            <label className="label">Evento</label>
            <select className="input-field" value={form.id_evento}
              onChange={e => setForm(f => ({ ...f, id_evento: Number(e.target.value) }))}>
              <option value={0}>Seleccioná evento...</option>
              {eventos.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.nombre_equipo_local} vs {ev.nombre_equipo_visitante}
                </option>
              ))}
            </select>
          </div>
          {crearMutation.isError && (
            <p className="text-red-400 text-sm">{(crearMutation.error as Error).message}</p>
          )}
          <button
            onClick={() => crearMutation.mutate(form)}
            disabled={!form.numero_legajo || !form.id_evento || crearMutation.isPending}
            className="btn-pitch w-full flex items-center justify-center gap-2"
          >
            {crearMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear dispositivo
          </button>
        </div>
      </Modal>
    </div>
  )
}
