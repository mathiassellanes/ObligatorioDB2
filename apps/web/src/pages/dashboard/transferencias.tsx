import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { TransferenciaConEvento, EntradaConEvento } from '@repo/shared'
import { ArrowRightLeft, Send, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

export function TransferenciasPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'historial' | 'pendientes' | 'nueva'>('historial')

  const { data: historial = [] } = useQuery<TransferenciaConEvento[]>({
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
    },
  })

  const [nuevaForm, setNuevaForm] = useState({ id_entrada: 0, email_destino: '' })

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="section-title mb-2">Transferencias</h1>
      <p className="text-[#6b7a9c] text-sm mb-8">Transferí entradas entre usuarios</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#090f20] p-1 rounded-xl border border-[#1a2540]">
        {([['historial', 'Historial'], ['pendientes', `Pendientes${pendientes.length ? ` (${pendientes.length})` : ''}`], ['nueva', 'Nueva']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-display font-bold uppercase tracking-wide transition-all ${
              tab === key ? 'bg-[#39ff14] text-[#050914]' : 'text-[#6b7a9c] hover:text-[#e8edf8]'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Historial */}
      {tab === 'historial' && (
        <div className="space-y-3">
          {historial.length === 0
            ? <EmptyState icon={<ArrowRightLeft />} text="Sin transferencias aún" />
            : historial.map((t) => <TransferenciaRow key={t.id} t={t} />)}
        </div>
      )}

      {/* Pendientes */}
      {tab === 'pendientes' && (
        <div className="space-y-3">
          {pendientes.length === 0
            ? <EmptyState icon={<Clock />} text="No tenés transferencias pendientes" />
            : pendientes.map((t) => (
              <div key={t.id} className="card p-5">
                <TransferenciaRow t={t} />
                <div className="flex gap-2 mt-4">
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
              </div>
            ))}
        </div>
      )}

      {/* Nueva */}
      {tab === 'nueva' && (
        <div className="card card-glow p-6">
          <h2 className="font-display font-extrabold text-lg uppercase mb-5">Nueva transferencia</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Entrada a transferir</label>
              <select className="input-field" value={nuevaForm.id_entrada}
                onChange={e => setNuevaForm(f => ({ ...f, id_entrada: Number(e.target.value) }))}>
                <option value={0}>Seleccioná una entrada...</option>
                {entradas.map((en) => (
                  <option key={en.id} value={en.id}>
                    #{en.id} — {en.nombre_equipo_local} vs {en.nombre_equipo_visitante} · Sector {en.nombre_sector}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Email del destinatario</label>
              <input className="input-field" type="email" placeholder="destino@email.com"
                value={nuevaForm.email_destino}
                onChange={e => setNuevaForm(f => ({ ...f, email_destino: e.target.value }))} />
            </div>
            {transferirMutation.isError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {(transferirMutation.error as Error).message}
              </div>
            )}
            {transferirMutation.isSuccess && (
              <div className="bg-[#39ff1410] border border-[#39ff1430] rounded-lg px-4 py-3 text-[#39ff14] text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Transferencia enviada. Esperando aceptación.
              </div>
            )}
            <button
              onClick={() => transferirMutation.mutate(nuevaForm)}
              disabled={!nuevaForm.id_entrada || !nuevaForm.email_destino || transferirMutation.isPending}
              className="btn-pitch w-full flex items-center justify-center gap-2"
            >
              {transferirMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar transferencia
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TransferenciaRow({ t }: { t: TransferenciaConEvento }) {
  const estado = t.estado === 'aceptada' ? 'badge-pitch' : t.estado === 'pendiente' ? 'badge-amber' : 'badge-red'
  return (
    <div className="flex items-center gap-3">
      <ArrowRightLeft className="w-4 h-4 text-[#6b7a9c] shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[#e8edf8] truncate">
          {t.nombre_equipo_local} vs {t.nombre_equipo_visitante}
        </div>
        <div className="text-xs text-[#6b7a9c]">
          {t.email_origen} → {t.email_destino}
        </div>
      </div>
      <span className={estado}>{t.estado}</span>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="card p-16 text-center">
      <div className="flex justify-center mb-4 text-[#1a2540] [&>svg]:w-12 [&>svg]:h-12">{icon}</div>
      <p className="text-[#6b7a9c]">{text}</p>
    </div>
  )
}
