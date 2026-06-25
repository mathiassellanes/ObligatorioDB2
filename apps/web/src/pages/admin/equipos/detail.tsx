import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { Equipo, EventoConNombres } from '@repo/shared'
import { Calendar, MapPin, ChevronRight, Pencil, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/date'
import { Modal } from '@/components/ui/modal'

const COMMON_FLAGS = [
  '🇺🇾','🇦🇷','🇧🇷','🇨🇴','🇪🇨','🇻🇪','🇨🇱','🇵🇪','🇵🇾','🇧🇴',
  '🇩🇪','🇫🇷','🇪🇸','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇵🇹','🇳🇱','🇧🇪','🇭🇷','🇨🇭','🇷🇸',
  '🇦🇹','🇭🇺','🏴󠁧󠁢󠁳󠁣󠁴󠁿','🇷🇴','🇹🇷','🇩🇰','🇸🇰','🇨🇿','🇬🇷','🇮🇹',
  '🇺🇸','🇲🇽','🇨🇦','🇵🇦','🇨🇷','🇭🇳','🇯🇲',
  '🇸🇳','🇲🇦','🇳🇬','🇬🇭','🇨🇲','🇨🇮','🇿🇦','🇪🇬','🇩🇿','🇹🇳',
  '🇯🇵','🇰🇷','🇸🇦','🇮🇷','🇦🇺','🇶🇦','🇯🇴','🇺🇿','🇨🇳','🇮🇶',
  '🇳🇿',
]


export function AdminEquipoDetailPage() {
  const { id } = useParams({ from: '/admin/equipos/$id' })
  const qc = useQueryClient()

  const { data: equipo, isLoading } = useQuery<Equipo>({
    queryKey: ['equipo', id],
    queryFn: () => api.get(`/equipos/${id}`),
  })

  const [showEdit, setShowEdit] = useState(false)
  const [nombre, setNombre] = useState('')
  const [bandera, setBandera] = useState('🏳️')

  const editMutation = useMutation({
    mutationFn: (data: { nombre: string; bandera: string }) =>
      api.put(`/equipos/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipo', id] })
      qc.invalidateQueries({ queryKey: ['equipos'] })
      setShowEdit(false)
    },
  })

  function openEdit() {
    setNombre(equipo?.nombre ?? '')
    setBandera(equipo?.bandera ?? '🏳️')
    setShowEdit(true)
  }

  const { data: eventos = [] } = useQuery<EventoConNombres[]>({
    queryKey: ['equipo-eventos', id],
    queryFn: () => api.get(`/equipos/${id}/eventos`),
  })

  if (isLoading) return (
    <div className="p-8 space-y-4">
      <div className="card h-32 animate-pulse" />
      <div className="card h-64 animate-pulse" />
    </div>
  )

  if (!equipo) return <div className="p-8 text-center text-[#6b7a9c]">Equipo no encontrado.</div>

  const flag = equipo.bandera
  const wins = eventos.filter(e => e.nombre_equipo_local === equipo.nombre).length

  return (
    <div className="p-8 max-w-4xl">
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Editar equipo" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label mb-1">Nombre</label>
            <input className="input-field w-full" value={nombre} onChange={e => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="label mb-2">Bandera</label>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl leading-none">{bandera}</span>
              <input className="input-field flex-1 font-mono" value={bandera}
                onChange={e => setBandera(e.target.value || '🏳️')} maxLength={10} />
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
          {editMutation.isError && <p className="text-red-400 text-xs">{(editMutation.error as Error).message}</p>}
          <button onClick={() => editMutation.mutate({ nombre, bandera })}
            disabled={nombre.trim() === '' || editMutation.isPending}
            className="btn-pitch w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Guardar cambios
          </button>
        </div>
      </Modal>

      {/* Header */}
      <div className="card card-glow p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="text-6xl">{flag}</div>
          <div className="flex-1">
            <h1 className="font-display font-black text-4xl uppercase tracking-tight">{equipo.nombre}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-[#6b7a9c]">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{eventos.length} partidos</span>
              <span className="badge-pitch">{wins} como local</span>
            </div>
          </div>
          <button onClick={openEdit} className="btn-outline flex items-center gap-1.5 py-2 px-3 text-sm">
            <Pencil className="w-3.5 h-3.5" />Editar
          </button>
        </div>
      </div>

      {/* Partidos */}
      <h2 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#6b7a9c] mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[#39ff14]" />Partidos
      </h2>

      {eventos.length === 0 ? (
        <div className="card p-10 text-center text-[#6b7a9c] text-sm">Sin partidos programados</div>
      ) : (
        <div className="space-y-2">
          {eventos.map((ev) => {
            const isLocal = ev.nombre_equipo_local === equipo.nombre
            return (
              <Link key={ev.id} to="/admin/eventos/$id" params={{ id: String(ev.id) }}
                className="card p-4 flex items-center gap-4 hover:border-[#39ff1430] transition-colors group">
                <div className={`badge-${isLocal ? 'pitch' : 'amber'} shrink-0`}>
                  {isLocal ? 'Local' : 'Visitante'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-extrabold text-sm uppercase">
                    <span className="text-[#39ff14]">{ev.nombre_equipo_local}</span>
                    <span className="text-[#6b7a9c] mx-2 font-normal normal-case text-xs">vs</span>
                    {ev.nombre_equipo_visitante}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6b7a9c] mt-0.5">
                    <MapPin className="w-3 h-3" />{ev.nombre_estadio}
                    <span>·</span>{formatDate(ev.fecha)}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#3a4a6b] group-hover:text-[#39ff14] transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
