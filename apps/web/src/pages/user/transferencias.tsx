import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { TransferenciaConEvento, EntradaConEvento } from '@repo/shared'
import { getEmail } from '@/lib/auth'
import {
  ArrowRightLeft, Send, CheckCircle, XCircle, Clock,
  Loader2, Plus, X, Filter
} from 'lucide-react'

type Filtro = 'todas' | 'pendientes' | 'enviadas' | 'recibidas'

export function TransferenciasPage() {
  const qc = useQueryClient()
  const myEmail = getEmail()

  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [showNueva, setShowNueva] = useState(false)
  const [nuevaForm, setNuevaForm] = useState({ id_entrada: 0, email_destino: '' })

  const { data: historial = [], isLoading } = useQuery<TransferenciaConEvento[]>({
    queryKey: ['transferencias'],
    queryFn: () => api.get('/transferencias'),
  })

  const { data: pendientes = [] } = useQuery<TransferenciaConEvento[]>({
    queryKey: ['transferencias-pendientes'],
    queryFn: () => api.get('/transferencias/pendientes'),
  })

  const { data: entradas = [] } = useQuery<EntradaConEvento[]>({
    queryKey: ['mis-entradas'],
    queryFn: () => api.get('/entradas'),
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

  const transferirMutation = useMutation({
    mutationFn: (data: { id_entrada: number; email_destino: string }) =>
      api.post('/transferencias', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transferencias'] })
      setNuevaForm({ id_entrada: 0, email_destino: '' })
      setShowNueva(false)
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Transferencias</h1>
          <p className="text-[#6b7a9c] text-sm mt-1">{historial.length} en total</p>
        </div>
        <button
          onClick={() => setShowNueva(!showNueva)}
          className="btn-pitch flex items-center gap-1.5 py-2 px-4 text-sm"
        >
          {showNueva ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          Nueva transferencia
        </button>
      </div>

      {/* Inline form */}
      {showNueva && (
        <div className="card card-glow p-6 mb-6">
          <h2 className="font-display font-extrabold text-sm uppercase tracking-widest text-[#39ff14] mb-4">
            Nueva transferencia
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Entrada a transferir</label>
              <select className="input-field" value={nuevaForm.id_entrada}
                onChange={e => setNuevaForm(f => ({ ...f, id_entrada: Number(e.target.value) }))}>
                <option value={0}>Seleccioná una entrada...</option>
                {entradas.map((en) => (
                  <option key={en.id} value={en.id}>
                    #{en.id} — {en.nombre_equipo_local} vs {en.nombre_equipo_visitante} · {en.nombre_sector}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Email destinatario</label>
              <input className="input-field" type="email" placeholder="destino@email.com"
                value={nuevaForm.email_destino}
                onChange={e => setNuevaForm(f => ({ ...f, email_destino: e.target.value }))} />
            </div>
          </div>
          {transferirMutation.isError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-sm mb-3">
              {(transferirMutation.error as Error).message}
            </div>
          )}
          <button
            onClick={() => transferirMutation.mutate(nuevaForm)}
            disabled={!nuevaForm.id_entrada || !nuevaForm.email_destino || transferirMutation.isPending}
            className="btn-pitch flex items-center gap-2"
          >
            {transferirMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar transferencia
          </button>
        </div>
      )}

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
            return (
              <div key={t.id} className={`card p-5 ${isPendienteRecibida ? 'border-[#ffb80030]' : ''}`}>
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ estado }: { estado: string }) {
  if (estado === 'aceptada') return <span className="badge-pitch shrink-0">aceptada</span>
  if (estado === 'pendiente') return (
    <span className="badge-amber flex items-center gap-1 shrink-0">
      <Clock className="w-3 h-3" />pendiente
    </span>
  )
  return <span className="badge-red shrink-0">rechazada</span>
}
