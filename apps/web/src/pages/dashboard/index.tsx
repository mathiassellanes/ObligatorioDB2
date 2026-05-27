import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { EntradaConEvento } from '@repo/shared'
import { Ticket, QrCode, ArrowRightLeft, Calendar, MapPin } from 'lucide-react'

export function DashboardPage() {
  const { data: entradas = [], isLoading } = useQuery<EntradaConEvento[]>({
    queryKey: ['mis-entradas'],
    queryFn: () => api.get('/entradas'),
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Mis Entradas</h1>
          <p className="text-[#6b7a9c] text-sm mt-1">Entradas activas en tu poder</p>
        </div>
        <div className="badge-pitch flex items-center gap-1.5">
          <Ticket className="w-3.5 h-3.5" />
          {entradas.length} entrada{entradas.length !== 1 ? 's' : ''}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-48 animate-pulse" />)}
        </div>
      ) : entradas.length === 0 ? (
        <div className="card p-16 text-center">
          <Ticket className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
          <p className="text-[#6b7a9c] mb-4">No tenés entradas asignadas aún.</p>
          <Link to="/" className="btn-pitch inline-block">Ver eventos</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entradas.map((entrada) => (
            <EntradaCard key={entrada.id} entrada={entrada} />
          ))}
        </div>
      )}
    </div>
  )
}

function EntradaCard({ entrada }: { entrada: EntradaConEvento }) {
  const fecha = new Date(entrada.fecha_evento)

  return (
    <div className="card card-glow p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="badge-amber mb-2">
            {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
            {' · '}{entrada.hora_evento?.toString().slice(0, 5)}h
          </div>
          <h3 className="font-display font-extrabold text-lg uppercase leading-tight">
            <span className="text-[#39ff14]">{entrada.nombre_equipo_local}</span>
            <span className="text-[#6b7a9c] mx-2 text-base">vs</span>
            {entrada.nombre_equipo_visitante}
          </h3>
        </div>
        <div className="font-mono text-xs text-[#6b7a9c] bg-[#0d1529] px-2 py-1 rounded border border-[#1a2540]">
          #{entrada.id}
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-[#6b7a9c]">
          <MapPin className="w-3 h-3" />{entrada.nombre_estadio}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#6b7a9c]">
          <Ticket className="w-3 h-3" />Sector {entrada.nombre_sector}
        </div>
      </div>

      <div className="h-px bg-[#1a2540] mb-4" />

      <div className="flex items-center gap-2">
        <Link to="/qr/$id" params={{ id: String(entrada.id) }}
          className="btn-pitch flex items-center gap-1.5 py-2 px-4 text-xs flex-1 justify-center">
          <QrCode className="w-3.5 h-3.5" />
          Ver QR
        </Link>
        <Link to="/transferencias"
          className="btn-outline flex items-center gap-1.5 py-2 px-4 text-xs flex-1 justify-center">
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Transferir
        </Link>
      </div>
    </div>
  )
}
