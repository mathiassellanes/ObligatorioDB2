import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Equipo } from '@repo/shared'
import { Users, Plus, ChevronRight, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Modal } from '@/components/ui/modal'

const COMMON_FLAGS = [
  '🇺🇾','🇦🇷','🇧🇷','🇨🇴','🇪🇨','🇻🇪','🇨🇱','🇵🇪','🇵🇾','🇧🇴',
  '🇩🇪','🇫🇷','🇪🇸','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇵🇹','🇳🇱','🇧🇪','🇭🇷','🇨🇭','🇷🇸',
  '🇦🇹','🇭🇺','🏴󠁧󠁢󠁳󠁣󠁴󠁿','🇷🇴','🇹🇷','🇩🇰','🇸🇰','🇨🇿','🇬🇷','🇮🇹',
  '🇺🇸','🇲🇽','🇨🇦','🇵🇦','🇨🇷','🇭🇳','🇯🇲',
  '🇸🇳','🇲🇦','🇳🇬','🇬🇭','🇨🇲','🇨🇮','🇿🇦','🇪🇬','🇩🇿','🇹🇳',
  '🇯🇵','🇰🇷','🇸🇦','🇮🇷','🇦🇺','🇶🇦','🇯🇴','🇺🇿','🇨🇳','🇮🇶','🇳🇿',
]

export function AdminEquiposPage() {
  const qc = useQueryClient()
  const { data: equipos = [], isLoading } = useQuery<Equipo[]>({
    queryKey: ['equipos'],
    queryFn: () => api.get('/equipos'),
  })

  const [showModal, setShowModal] = useState(false)
  const [nombre, setNombre] = useState('')
  const [bandera, setBandera] = useState('🏳️')

  const crearMutation = useMutation({
    mutationFn: (data: { nombre: string; bandera: string }) => api.post('/equipos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipos'] })
      setNombre('')
      setBandera('🏳️')
      setShowModal(false)
    },
  })

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="Equipos"
        subtitle={`${equipos.length} equipos registrados`}
        icon={Users}
        action={
          <button onClick={() => setShowModal(true)} className="btn-pitch flex items-center gap-1.5 py-2 px-4 text-sm">
            <Plus className="w-4 h-4" />Nuevo equipo
          </button>
        }
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo equipo" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label mb-1">Nombre del equipo</label>
            <input className="input-field w-full" placeholder="Ej: Uruguay"
              value={nombre} onChange={e => setNombre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && nombre.trim() && crearMutation.mutate({ nombre, bandera })}
            />
          </div>
          <div>
            <label className="label mb-2">Bandera</label>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl leading-none">{bandera}</span>
              <input className="input-field flex-1 font-mono" placeholder="Emoji de bandera..."
                value={bandera} onChange={e => setBandera(e.target.value || '🏳️')} maxLength={10}
              />
            </div>
            <div className="grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto">
              {COMMON_FLAGS.map(f => (
                <button key={f} onClick={() => setBandera(f)}
                  className={`text-xl p-1.5 rounded-lg transition-all hover:bg-[#1a2540] ${bandera === f ? 'bg-[#39ff1420] ring-1 ring-[#39ff14]' : ''}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          {crearMutation.isError && (
            <p className="text-red-400 text-xs">{(crearMutation.error as Error).message}</p>
          )}
          <button onClick={() => crearMutation.mutate({ nombre, bandera })}
            disabled={nombre.trim() === '' || crearMutation.isPending}
            className="btn-pitch w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {crearMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Crear equipo
          </button>
        </div>
      </Modal>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {equipos.map((e) => (
            <Link key={e.id} to="/admin/equipos/$id" params={{ id: String(e.id) }}
              className="card p-4 flex items-center gap-3 hover:border-[#39ff1430] transition-colors group">
              <div className="text-3xl w-10 text-center">{e.bandera}</div>
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
