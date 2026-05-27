import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Equipo } from '@repo/shared'
import { Users, Plus, ChevronRight, Loader2, Flag } from 'lucide-react'

// Flag emojis for known teams
const TEAM_FLAGS: Record<string, string> = {
  'Uruguay': '🇺🇾', 'Argentina': '🇦🇷', 'Brasil': '🇧🇷', 'Francia': '🇫🇷',
  'Alemania': '🇩🇪', 'España': '🇪🇸', 'Portugal': '🇵🇹', 'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'USA': '🇺🇸', 'México': '🇲🇽', 'Canadá': '🇨🇦',
}

export function AdminEquiposPage() {
  const qc = useQueryClient()
  const { data: equipos = [], isLoading } = useQuery<Equipo[]>({
    queryKey: ['equipos'],
    queryFn: () => api.get('/equipos'),
  })

  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')

  const crearMutation = useMutation({
    mutationFn: (data: { nombre: string }) => api.post('/equipos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipos'] })
      setNombre('')
      setShowForm(false)
    },
  })

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title text-3xl">Equipos</h1>
          <p className="text-[#6b7a9c] text-sm mt-1">{equipos.length} equipos registrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-pitch flex items-center gap-1.5 py-2 px-4 text-sm">
          <Plus className="w-4 h-4" />Nuevo equipo
        </button>
      </div>

      {showForm && (
        <div className="card card-glow p-5 mb-6">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-[#39ff14] mb-4">Nuevo equipo</h3>
          <div className="flex gap-3">
            <input className="input-field flex-1" placeholder="Nombre del equipo..."
              value={nombre} onChange={e => setNombre(e.target.value)} />
            <button onClick={() => crearMutation.mutate({ nombre })}
              disabled={!nombre || crearMutation.isPending}
              className="btn-pitch flex items-center gap-2 px-5">
              {crearMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {equipos.map((e) => (
            <Link key={e.id} to="/admin/equipos/$id" params={{ id: String(e.id) }}
              className="card p-4 flex items-center gap-3 hover:border-[#39ff1430] transition-colors group">
              <div className="text-3xl w-10 text-center">{TEAM_FLAGS[e.nombre] ?? '🏳️'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-extrabold text-sm uppercase">{e.nombre}</div>
                <div className="text-xs text-[#6b7a9c]">Ver partidos</div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#3a4a6b] group-hover:text-[#39ff14] transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
