import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { Estadio, Sector } from '@repo/shared'
import { Building2, ChevronRight, Plus, Loader2, MapPin, Layers } from 'lucide-react'
import { useState } from 'react'

type EstadioConSectores = Estadio & { sectores: Sector[] }

export function AdminEstadiosPage() {
  const qc = useQueryClient()
  const { data: estadios = [], isLoading } = useQuery<Estadio[]>({
    queryKey: ['admin-estadios'],
    queryFn: () => api.get('/admin/estadios'),
  })

  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')

  const crearMutation = useMutation({
    mutationFn: (data: { nombre: string }) => api.post('/estadios', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-estadios'] })
      qc.invalidateQueries({ queryKey: ['estadios'] })
      setNombre('')
      setShowForm(false)
    },
  })

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title text-3xl">Estadios</h1>
          <p className="text-[#6b7a9c] text-sm mt-1">Tus estadios asignados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-pitch flex items-center gap-1.5 py-2 px-4 text-sm">
          <Plus className="w-4 h-4" />Nuevo estadio
        </button>
      </div>

      {showForm && (
        <div className="card card-glow p-5 mb-6">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-[#39ff14] mb-4">Nuevo estadio</h3>
          <div className="flex gap-3">
            <input
              className="input-field flex-1"
              placeholder="Nombre del estadio..."
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
            <button
              onClick={() => crearMutation.mutate({ nombre })}
              disabled={!nombre || crearMutation.isPending}
              className="btn-pitch flex items-center gap-2 px-5"
            >
              {crearMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear
            </button>
          </div>
          {crearMutation.isError && (
            <p className="text-red-400 text-xs mt-2">{(crearMutation.error as Error).message}</p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}</div>
      ) : estadios.length === 0 ? (
        <div className="card p-16 text-center">
          <Building2 className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
          <p className="text-[#6b7a9c]">No tenés estadios asignados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {estadios.map((e) => (
            <Link
              key={e.id}
              to="/admin/estadios/$id"
              params={{ id: String(e.id) }}
              className="card p-5 flex items-center gap-4 hover:border-[#39ff1430] transition-colors group block"
            >
              <div className="w-10 h-10 bg-[#0d1529] rounded-xl flex items-center justify-center border border-[#1a2540] shrink-0">
                <Building2 className="w-5 h-5 text-[#6b7a9c]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-extrabold text-lg uppercase">{e.nombre}</div>
                <div className="flex items-center gap-1 text-xs text-[#6b7a9c] mt-0.5">
                  <MapPin className="w-3 h-3" />Ver detalle, sectores y eventos
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#3a4a6b] group-hover:text-[#39ff14] transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
