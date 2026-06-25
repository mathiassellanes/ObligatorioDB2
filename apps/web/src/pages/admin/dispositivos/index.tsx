import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Modal } from '@/components/ui/modal'
import { Smartphone, Plus, Trash2, Loader2, Copy, Check, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

type Dispositivo = {
  id: string
  nombre: string
  numero_legajo: string
  email: string
  total_eventos: number
}
type Funcionario = { numero_legajo: string; email: string }

export function AdminDispositivosPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [nombre, setNombre] = useState('')
  const [numero_legajo, setNumeroLegajo] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const { data: dispositivos = [], isLoading } = useQuery<Dispositivo[]>({
    queryKey: ['admin-dispositivos'],
    queryFn: () => api.get('/admin/dispositivos'),
  })
  const { data: funcionarios = [] } = useQuery<Funcionario[]>({
    queryKey: ['admin-funcionarios'],
    queryFn: () => api.get('/admin/funcionarios'),
  })

  const crearMutation = useMutation({
    mutationFn: () => api.post('/admin/dispositivos', { numero_legajo, nombre }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-dispositivos'] })
      setNombre('')
      setNumeroLegajo('')
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
      <PageHeader
        title="Dispositivos"
        subtitle={`${dispositivos.length} dispositivos registrados`}
        icon={Smartphone}
        action={
          <button onClick={() => setShowModal(true)} className="btn-pitch flex items-center gap-1.5 py-2 px-4 text-sm">
            <Plus className="w-4 h-4" />Nuevo dispositivo
          </button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : dispositivos.length === 0 ? (
        <div className="card p-16 text-center">
          <Smartphone className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
          <p className="text-[#6b7a9c]">Sin dispositivos registrados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dispositivos.map((d) => (
            <div key={d.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#0d1529] border border-[#1a2540] flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 text-[#6b7a9c]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-white">{d.nombre || <span className="text-[#3a4a6b] italic">Sin nombre</span>}</span>
                  <code className="font-mono text-xs text-[#6b7a9c] truncate max-w-[140px]">{d.id}</code>
                  <button onClick={() => copyId(d.id)} className="text-[#3a4a6b] hover:text-[#39ff14] transition-colors shrink-0">
                    {copied === d.id ? <Check className="w-3.5 h-3.5 text-[#39ff14]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs bg-[#0d1529] border border-[#1a2540] px-2 py-0.5 rounded text-[#39ff14]">
                    {d.numero_legajo}
                  </span>
                  <span className="text-xs text-[#6b7a9c]">{d.email}</span>
                  <span className="badge-pitch text-[10px]">{d.total_eventos} eventos</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to="/admin/dispositivos/$id" params={{ id: d.id }}
                  className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1 hover:border-[#39ff1440]">
                  Ver detalle <ChevronRight className="w-3 h-3" />
                </Link>
                <button onClick={() => eliminarMutation.mutate(d.id)}
                  disabled={eliminarMutation.isPending}
                  className="text-[#3a4a6b] hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo dispositivo" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input className="input-field" placeholder="Ej: Puerta Norte, Escáner A1..." value={nombre}
              onChange={e => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="label">Funcionario</label>
            <select className="input-field" value={numero_legajo}
              onChange={e => setNumeroLegajo(e.target.value)}>
              <option value="">Seleccioná funcionario...</option>
              {funcionarios.map(f => (
                <option key={f.numero_legajo} value={f.numero_legajo}>
                  {f.numero_legajo} — {f.email}
                </option>
              ))}
            </select>
            <p className="text-[#6b7a9c] text-xs mt-2">Se genera un UUID único. Vinculás los eventos desde el detalle.</p>
          </div>
          {crearMutation.isError && (
            <p className="text-red-400 text-sm">{(crearMutation.error as Error).message}</p>
          )}
          <button
            onClick={() => crearMutation.mutate()}
            disabled={nombre.trim() === '' || numero_legajo.trim() === '' || crearMutation.isPending}
            className="btn-pitch w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {crearMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear dispositivo
          </button>
        </div>
      </Modal>
    </div>
  )
}
