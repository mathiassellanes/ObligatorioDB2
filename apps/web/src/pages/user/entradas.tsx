import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { EntradaConEvento } from '@repo/shared'
import { Ticket, QrCode, ArrowRightLeft, MapPin, CheckCircle2 } from 'lucide-react'
import { TransferirModal } from '@/components/ui/transferir-modal'
import { PageHeader } from '@/components/ui/page-header'

export function EntradasPage() {
  const { data: entradas = [], isLoading } = useQuery<EntradaConEvento[]>({
    queryKey: ['mis-entradas'],
    queryFn: () => api.get('/entradas'),
  })

  const [modalEntrada, setModalEntrada] = useState<EntradaConEvento | null>(null)

  const activas = entradas.filter(e => !e.consumida)
  const usadas = entradas.filter(e => e.consumida)

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-48 animate-pulse" />)}
    </div>
  )

  return (
    <>
      <PageHeader
        title="Mis Entradas"
        subtitle={`${entradas.length} entradas en total`}
        icon={Ticket}
        action={
          <div className="flex gap-2">
            <span className="badge-pitch flex items-center gap-1"><Ticket className="w-3 h-3" />{activas.length} activas</span>
            {usadas.length > 0 && <span className="badge-red">{usadas.length} usadas</span>}
          </div>
        }
      />

      {entradas.length === 0 ? (
        <div className="card p-16 text-center">
          <Ticket className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
          <p className="text-[#6b7a9c] mb-4">Sin entradas aún.</p>
          <Link to="/" className="btn-pitch inline-block">Ver eventos</Link>
        </div>
      ) : (
        <>
          {activas.length > 0 && (
            <section className="mb-10">
              <div className="text-[10px] font-display font-bold uppercase tracking-widest text-[#3a4a6b] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39ff14] inline-block" />Activas · {activas.length}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activas.map(e => (
                  <EntradaCard key={e.id} entrada={e} onTransferir={() => setModalEntrada(e)} />
                ))}
              </div>
            </section>
          )}

          {usadas.length > 0 && (
            <section>
              <div className="text-[10px] font-display font-bold uppercase tracking-widest text-[#3a4a6b] mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" />Usadas · {usadas.length}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
                {usadas.map(e => <EntradaCard key={e.id} entrada={e} used />)}
              </div>
            </section>
          )}
        </>
      )}

      <TransferirModal
        open={!!modalEntrada}
        onClose={() => setModalEntrada(null)}
        entradaPreseleccionada={modalEntrada ?? undefined}
      />
    </>
  )
}

function EntradaCard({
  entrada, used = false, onTransferir,
}: { entrada: EntradaConEvento; used?: boolean; onTransferir?: () => void }) {
  const fecha = new Date(entrada.fecha_evento)
  return (
    <div className={`card p-5 ${used ? 'border-[#1a2540]' : 'card-glow'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="badge-amber mb-2">
            {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
            {' · '}{entrada.hora_evento?.toString().slice(0, 5)}h
          </div>
          <h3 className="font-display font-extrabold text-lg uppercase leading-tight">
            <span className={used ? 'text-[#6b7a9c]' : 'text-[#39ff14]'}>{entrada.nombre_equipo_local}</span>
            <span className="text-[#6b7a9c] mx-2 text-base">vs</span>
            {entrada.nombre_equipo_visitante}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {used && (
            <span className="badge-red text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />Usada
            </span>
          )}
          <div className="font-mono text-xs text-[#6b7a9c] bg-[#0d1529] px-2 py-1 rounded border border-[#1a2540]">
            #{entrada.id}
          </div>
        </div>
      </div>

      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-[#6b7a9c]">
          <MapPin className="w-3 h-3" />{entrada.nombre_estadio}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#6b7a9c]">
          <Ticket className="w-3 h-3" />Sector {entrada.nombre_sector}
        </div>
      </div>

      <div className="h-px bg-[#1a2540] mb-4" />

      {used ? (
        <div className="text-xs text-[#3a4a6b] font-display uppercase tracking-wide">Entrada validada en puerta</div>
      ) : (
        <div className="flex items-center gap-2">
          <Link to="/qr/$id" params={{ id: String(entrada.id) }}
            className="btn-pitch flex items-center gap-1.5 py-2 px-4 text-xs flex-1 justify-center">
            <QrCode className="w-3.5 h-3.5" />Ver QR
          </Link>
          <button
            onClick={onTransferir}
            className="btn-outline flex items-center gap-1.5 py-2 px-4 text-xs flex-1 justify-center"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />Transferir
          </button>
        </div>
      )}
    </div>
  )
}
