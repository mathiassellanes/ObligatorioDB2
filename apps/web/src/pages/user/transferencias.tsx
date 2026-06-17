import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { TransferenciaConEvento } from '@repo/shared'
import { getEmail } from '@/lib/auth'
import { ArrowRightLeft, CheckCircle, XCircle, Clock, Loader2, Plus, Filter, Ban } from 'lucide-react'
import { TransferirModal } from '@/components/ui/transferir-modal'
import { PageHeader } from '@/components/ui/page-header'

type Filtro = 'todas' | 'pendientes' | 'enviadas' | 'recibidas'

export function TransferenciasPage() {
  const qc = useQueryClient()
  const myEmail = getEmail()

  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [showModal, setShowModal] = useState(false)

  const { data: historial = [], isLoading } = useQuery<TransferenciaConEvento[]>({
    queryKey: ['transferencias'],
    queryFn: () => api.get('/transferencias'),
  })

  const { data: pendientes = [] } = useQuery<TransferenciaConEvento[]>({
    queryKey: ['transferencias-pendientes'],
    queryFn: () => api.get('/transferencias/pendientes'),
  })

  const responderMutation = useMutation({
    mutationFn: ({ id, accion }: { id: number; accion: 'aceptar' | 'rechazar' }) =>
      api.post(`/transferencias/${id}/responder`, { accion }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transferencias'] })
      qc.invalidateQueries({ queryKey: ['transferencias-pendientes'] })
      qc.invalidateQueries({ queryKey: ['mis-entradas'] })
    },
  })

  const cancelarMutation = useMutation({
    mutationFn: (id: number) => api.post(`/transferencias/${id}/cancelar`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transferencias'] })
      qc.invalidateQueries({ queryKey: ['transferencias-pendientes'] })
    },
  })

  const filtrados = historial.filter(t => {
    if (filtro === 'todas') return true
    if (filtro === 'pendientes') return t.estado === 'pendiente'
    if (filtro === 'enviadas') return t.email_origen === myEmail
    if (filtro === 'recibidas') return t.email_destino === myEmail
    return true
  })

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'pendientes', label: `Pendientes${pendientes.length ? ` (${pendientes.length})` : ''}` },
    { key: 'enviadas', label: 'Enviadas' },
    { key: 'recibidas', label: 'Recibidas' },
  ]

  return (
    <>
      <PageHeader
        title="Transferencias"
        subtitle={`${historial.length} en total`}
        icon={ArrowRightLeft}
        action={
          <button onClick={() => setShowModal(true)} className="btn-pitch flex items-center gap-1.5 py-2 px-4 text-sm">
            <Plus className="w-4 h-4" />Nueva transferencia
          </button>
        }
      />

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-[#3a4a6b]" />
        {FILTROS.map(({ key, label }) => (
          <button key={key} onClick={() => setFiltro(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wide transition-all ${
              filtro === key
                ? 'bg-[#39ff14] text-[#050914]'
                : 'bg-[#0d1529] text-[#6b7a9c] hover:text-[#e8edf8] border border-[#1a2540]'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : filtrados.length === 0 ? (
        <div className="card p-16 text-center">
          <ArrowRightLeft className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
          <p className="text-[#6b7a9c]">Sin transferencias {filtro !== 'todas' ? `(${filtro})` : 'aún'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((t) => {
            const isPendienteRecibida = t.estado === 'pendiente' && t.email_destino === myEmail
            const isPendienteEnviada = t.estado === 'pendiente' && t.email_origen === myEmail
            return (
              <div key={t.id} className={`card p-5 ${isPendienteRecibida ? 'border-[#ffb80030]' : isPendienteEnviada ? 'border-[#39ff1420]' : ''}`}>
                <div className="flex items-center gap-3">
                  <ArrowRightLeft className="w-4 h-4 text-[#6b7a9c] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#e8edf8] font-display font-bold truncate">
                      {t.nombre_equipo_local} vs {t.nombre_equipo_visitante}
                    </div>
                    <div className="text-xs text-[#6b7a9c] mt-0.5 font-mono">
                      {t.email_origen}
                      <span className="mx-1 text-[#3a4a6b]">→</span>
                      {t.email_destino}
                    </div>
                  </div>
                  <StatusBadge estado={t.estado} />
                </div>

                {isPendienteRecibida && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-[#1a2540]">
                    <button
                      onClick={() => responderMutation.mutate({ id: t.id, accion: 'aceptar' })}
                      disabled={responderMutation.isPending}
                      className="btn-pitch flex items-center gap-1.5 py-2 flex-1 justify-center text-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />Aceptar
                    </button>
                    <button
                      onClick={() => responderMutation.mutate({ id: t.id, accion: 'rechazar' })}
                      disabled={responderMutation.isPending}
                      className="btn-outline flex items-center gap-1.5 py-2 flex-1 justify-center text-xs text-red-400 hover:text-red-300 hover:border-red-500/40"
                    >
                      <XCircle className="w-3.5 h-3.5" />Rechazar
                    </button>
                  </div>
                )}

                {isPendienteEnviada && (
                  <div className="flex mt-4 pt-4 border-t border-[#1a2540]">
                    <button
                      onClick={() => cancelarMutation.mutate(t.id)}
                      disabled={cancelarMutation.isPending}
                      className="btn-outline flex items-center gap-1.5 py-2 px-4 text-xs text-red-400 hover:text-red-300 hover:border-red-500/40"
                    >
                      {cancelarMutation.isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Ban className="w-3.5 h-3.5" />}
                      Cancelar transferencia
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <TransferirModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

function StatusBadge({ estado }: { estado: string }) {
  if (estado === 'aceptada') return <span className="badge-pitch shrink-0">aceptada</span>
  if (estado === 'pendiente') return (
    <span className="badge-amber flex items-center gap-1 shrink-0">
      <Clock className="w-3 h-3" />pendiente
    </span>
  )
  if (estado === 'cancelada') return <span className="badge-red shrink-0 opacity-70">cancelada</span>
  return <span className="badge-red shrink-0">rechazada</span>
}
