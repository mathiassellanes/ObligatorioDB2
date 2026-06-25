import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Estadio, Sector, EventoConNombres } from '@repo/shared'
import { formatDate } from '@/lib/date'
import { Building2, Calendar, Layers, MapPin, Plus, Loader2, ChevronRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

type EstadioConSectores = Estadio & { sectores: Sector[] }

// Known stadium coordinates for OpenStreetMap embed
const STADIUM_COORDS: Record<string, [number, number]> = {
  'MetLife Stadium':  [40.8135, -74.0745],
  'AT&T Stadium':     [32.7480, -97.0928],
  'SoFi Stadium':     [33.9535, -118.3392],
  'Estadio Azteca':   [19.3029, -99.1505],
  'BC Place':         [49.2768, -123.1118],
  'BMO Field':        [43.6336, -79.4181],
}

export function AdminEstadioDetailPage() {
  const { id } = useParams({ from: '/admin/estadios/$id' })
  const qc = useQueryClient()

  const { data: estadio, isLoading } = useQuery<EstadioConSectores>({
    queryKey: ['estadio', id],
    queryFn: () => api.get(`/estadios/${id}`),
  })

  const { data: eventos = [] } = useQuery<EventoConNombres[]>({
    queryKey: ['estadio-eventos', id],
    queryFn: () => api.get(`/estadios/${id}/eventos`),
  })

  const [sectorForm, setSectorForm] = useState({ nombre: '', capacidad_maxima: '' })
  const [showSectorForm, setShowSectorForm] = useState(false)

  const crearSectorMutation = useMutation({
    mutationFn: (data: { nombre: string; capacidad_maxima: number }) =>
      api.post(`/estadios/${id}/sectores`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estadio', id] })
      setSectorForm({ nombre: '', capacidad_maxima: '' })
      setShowSectorForm(false)
    },
  })

  if (isLoading) return (
    <div className="p-8 space-y-4">
      <div className="card h-32 animate-pulse" />
      <div className="card h-64 animate-pulse" />
    </div>
  )

  if (!estadio) return (
    <div className="p-8 text-center text-[#6b7a9c]">Estadio no encontrado.</div>
  )

  const coords = STADIUM_COORDS[estadio.nombre]
  const mapUrl = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords[1] - 0.025},${coords[0] - 0.012},${coords[1] + 0.025},${coords[0] + 0.012}&layer=mapnik&marker=${coords[0]},${coords[1]}`
    : null

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="card card-glow p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#39ff14]/10 rounded-xl flex items-center justify-center border border-[#39ff14]/20 shrink-0">
            <Building2 className="w-6 h-6 text-[#39ff14]" />
          </div>
          <div className="flex-1">
            <h1 className="font-display font-black text-3xl uppercase tracking-tight">{estadio.nombre}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-[#6b7a9c]">
              <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{estadio.sectores.length} sectores</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{eventos.length} eventos</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sectores */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#6b7a9c] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#39ff14]" />Sectores
            </h2>
            <button onClick={() => setShowSectorForm(!showSectorForm)}
              className="btn-outline flex items-center gap-1 py-1.5 px-3 text-xs">
              <Plus className="w-3 h-3" />Agregar
            </button>
          </div>

          {showSectorForm && (
            <div className="card p-4 mb-3 border-[#39ff1420]">
              <div className="flex gap-2 mb-2">
                <input className="input-field flex-1 py-1.5 text-sm" placeholder="Nombre sector"
                  value={sectorForm.nombre} onChange={e => setSectorForm(f => ({ ...f, nombre: e.target.value }))} />
                <input className="input-field w-24 py-1.5 text-sm" type="number" placeholder="Cap."
                  value={sectorForm.capacidad_maxima} onChange={e => setSectorForm(f => ({ ...f, capacidad_maxima: e.target.value }))} />
              </div>
              <button onClick={() => crearSectorMutation.mutate({
                nombre: sectorForm.nombre,
                capacidad_maxima: Number(sectorForm.capacidad_maxima)
              })} disabled={sectorForm.nombre.trim() === '' || Number(sectorForm.capacidad_maxima) <= 0 || crearSectorMutation.isPending}
                className="btn-pitch w-full py-1.5 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                {crearSectorMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Crear sector
              </button>
            </div>
          )}

          <div className="space-y-2">
            {estadio.sectores.length === 0 ? (
              <div className="card p-6 text-center text-[#6b7a9c] text-sm">Sin sectores aún</div>
            ) : estadio.sectores.map((s) => (
              <div key={s.id} className="card p-4 flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-sm uppercase">{s.nombre}</div>
                  <div className="text-xs text-[#6b7a9c] mt-0.5">Cap. {s.capacidad_maxima.toLocaleString()}</div>
                </div>
                <span className="font-mono text-xs text-[#3a4a6b] bg-[#0d1529] px-2 py-1 rounded border border-[#1a2540]">#{s.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mapa */}
        <div>
          <h2 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#6b7a9c] mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#39ff14]" />Ubicación
          </h2>
          {mapUrl ? (
            <div className="rounded-xl overflow-hidden border border-[#1a2540]">
              <iframe
                src={mapUrl}
                title={`Mapa ${estadio.nombre}`}
                width="100%"
                height="280"
                className="block"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="card p-8 text-center text-[#6b7a9c] text-sm">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-[#1a2540]" />
              Coordenadas no disponibles
            </div>
          )}
          {coords && (
            <div className="mt-2 text-xs text-[#3a4a6b] font-mono">
              {coords[0].toFixed(4)}°N, {Math.abs(coords[1]).toFixed(4)}°W
            </div>
          )}
        </div>
      </div>

      {/* Eventos en este estadio */}
      <div>
        <h2 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#6b7a9c] mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#39ff14]" />Eventos en este estadio
        </h2>

        {eventos.length === 0 ? (
          <div className="card p-8 text-center text-[#6b7a9c] text-sm">Sin eventos programados aún</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a2540]">
                  <th className="text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">Partido</th>
                  <th className="text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">Fecha</th>
                  <th className="text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">Hora</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {eventos.map((ev, i) => (
                  <tr key={ev.id} className={`${i < eventos.length - 1 ? 'border-b border-[#1a2540]' : ''} hover:bg-[#0d1529] transition-colors`}>
                    <td className="px-4 py-3">
                      <span className="font-display font-extrabold text-sm uppercase">
                        <span className="text-[#39ff14]">{ev.nombre_equipo_local}</span>
                        <span className="text-[#6b7a9c] mx-2 font-normal normal-case">vs</span>
                        {ev.nombre_equipo_visitante}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6b7a9c] font-mono text-xs">
                      {formatDate(ev.fecha)}
                    </td>
                    <td className="px-4 py-3 text-[#6b7a9c] font-mono text-xs">
                      {ev.hora?.toString().slice(0, 5)}h
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/admin/eventos/$id" params={{ id: String(ev.id) }}
                        className="text-[#39ff14] hover:underline text-xs font-display font-bold uppercase flex items-center gap-1 justify-end">
                        Ver <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
