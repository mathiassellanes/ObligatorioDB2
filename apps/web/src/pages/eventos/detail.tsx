import { useState } from 'react'
import { useParams, useRouter } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { EventoDetalle, ComprarEntradasDTO } from '@repo/shared'
import { isLoggedIn, getRol } from '@/lib/auth'
import { MapPin, Clock, Users, ShoppingCart, Loader2, CheckCircle } from 'lucide-react'

export function EventoDetailPage() {
  const { id } = useParams({ from: '/eventos/$id' })
  const router = useRouter()
  const qc = useQueryClient()

  const { data: evento, isLoading } = useQuery<EventoDetalle>({
    queryKey: ['evento', id],
    queryFn: () => api.get(`/eventos/${id}`),
  })

  const [seleccion, setSeleccion] = useState<Record<number, number>>({})
  const [success, setSuccess] = useState(false)

  const totalEntradas = Object.values(seleccion).reduce((a, b) => a + b, 0)

  const comprarMutation = useMutation({
    mutationFn: (payload: ComprarEntradasDTO) => api.post('/ventas', payload),
    onSuccess: () => {
      setSuccess(true)
      qc.invalidateQueries({ queryKey: ['mis-entradas'] })
      setTimeout(() => router.navigate({ to: '/dashboard' }), 2000)
    },
  })

  function handleComprar() {
    if (!isLoggedIn()) return router.navigate({ to: '/login' })

    const entradas = Object.entries(seleccion).flatMap(([id_sector, cant]) =>
      Array(cant).fill({ id_sector: Number(id_sector) })
    )
    comprarMutation.mutate({ id_evento: Number(id), entradas })
  }

  if (isLoading) return <LoadingSkeleton />

  if (!evento) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-[#6b7a9c]">Evento no encontrado.</p>
    </div>
  )

  const fecha = new Date(evento.fecha)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="card card-glow p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="badge-amber mb-3">
              {fecha.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}{evento.hora?.toString().slice(0, 5)}h
            </div>
            <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight leading-none mb-2">
              <span className="text-[#39ff14]">{evento.nombre_equipo_local}</span>
              <span className="text-[#6b7a9c] mx-3 text-3xl">vs</span>
              <span>{evento.nombre_equipo_visitante}</span>
            </h1>
            <div className="flex items-center gap-1.5 text-[#6b7a9c] text-sm mt-3">
              <MapPin className="w-4 h-4" />
              {evento.nombre_estadio}
            </div>
          </div>
          <div className="flex gap-4">
            <StatBox label="Sectores" value={String(evento.sectores?.length ?? 0)} />
          </div>
        </div>
      </div>

      {/* Sectores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {evento.sectores?.map((sector) => {
          const disponibles = sector.capacidad_maxima - Number(sector.entradas_vendidas)
          const qty = seleccion[sector.id] ?? 0

          return (
            <div key={sector.id}
              className={`card p-5 transition-all duration-200 ${qty > 0 ? 'border-[#39ff1440] shadow-[0_0_20px_#39ff1408]' : 'hover:border-[#1a2540]'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-extrabold text-lg uppercase">{sector.nombre}</h3>
                  <div className="flex items-center gap-1 text-[#6b7a9c] text-xs mt-1">
                    <Users className="w-3 h-3" />
                    {disponibles} disponibles de {sector.capacidad_maxima}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display font-black text-2xl text-[#39ff14]">
                    ${Number(sector.costo_entrada).toLocaleString()}
                  </span>
                  <div className="text-[#6b7a9c] text-xs">USD por entrada</div>
                </div>
              </div>

              {/* Capacity bar */}
              <div className="h-1 bg-[#0d1529] rounded-full mb-4 overflow-hidden">
                <div
                  className="h-full bg-[#39ff14] rounded-full transition-all"
                  style={{ width: `${(Number(sector.entradas_vendidas) / sector.capacidad_maxima) * 100}%` }}
                />
              </div>

              {/* Qty selector */}
              {disponibles > 0 && getRol() === 'usuario_general' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSeleccion(s => ({ ...s, [sector.id]: Math.max(0, (s[sector.id] ?? 0) - 1) }))}
                    className="w-8 h-8 rounded-lg border border-[#1a2540] flex items-center justify-center
                               text-[#e8edf8] hover:border-[#39ff1460] transition-colors disabled:opacity-40"
                    disabled={qty === 0}
                  >−</button>
                  <span className="font-display font-bold text-xl w-6 text-center">{qty}</span>
                  <button
                    onClick={() => {
                      if (totalEntradas >= 5) return
                      setSeleccion(s => ({ ...s, [sector.id]: Math.min(disponibles, (s[sector.id] ?? 0) + 1) }))
                    }}
                    className="w-8 h-8 rounded-lg border border-[#1a2540] flex items-center justify-center
                               text-[#e8edf8] hover:border-[#39ff1460] transition-colors disabled:opacity-40"
                    disabled={totalEntradas >= 5}
                  >+</button>
                </div>
              )}
              {disponibles === 0 && <div className="badge-red">Agotado</div>}
            </div>
          )
        })}
      </div>

      {/* Carrito */}
      {getRol() === 'usuario_general' && totalEntradas > 0 && (
        <div className="card card-glow p-5 flex items-center justify-between">
          <div>
            <div className="font-display font-black text-xl">
              {totalEntradas} entrada{totalEntradas > 1 ? 's' : ''} seleccionada{totalEntradas > 1 ? 's' : ''}
            </div>
            <div className="text-[#6b7a9c] text-xs mt-0.5">Máximo 5 por transacción</div>
          </div>
          {success ? (
            <div className="flex items-center gap-2 text-[#39ff14]">
              <CheckCircle className="w-5 h-5" />
              <span className="font-display font-bold">¡Compra exitosa!</span>
            </div>
          ) : (
            <button
              onClick={handleComprar}
              disabled={totalEntradas < 1 || totalEntradas > 5 || comprarMutation.isPending}
              className="btn-pitch flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {comprarMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Comprando...</>
                : <><ShoppingCart className="w-4 h-4" /> Comprar</>}
            </button>
          )}
        </div>
      )}

      {!isLoggedIn() && (
        <div className="card p-5 text-center">
          <p className="text-[#6b7a9c] text-sm mb-3">Iniciá sesión para comprar entradas</p>
          <button onClick={() => router.navigate({ to: '/login' })} className="btn-pitch">
            Ingresar
          </button>
        </div>
      )}

      {comprarMutation.isError && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {(comprarMutation.error as Error).message}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="font-display font-black text-3xl text-[#39ff14]">{value}</div>
      <div className="text-[#6b7a9c] text-xs uppercase tracking-widest font-display">{label}</div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
      <div className="card h-48 animate-pulse" />
      <div className="grid grid-cols-2 gap-4">
        <div className="card h-36 animate-pulse" />
        <div className="card h-36 animate-pulse" />
      </div>
    </div>
  )
}
