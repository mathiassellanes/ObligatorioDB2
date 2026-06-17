import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { EntradaConEvento } from '@repo/shared'
import { Modal } from './modal'
import { Send, Loader2, CheckCircle } from 'lucide-react'

interface TransferirModalProps {
  open: boolean
  onClose: () => void
  entradaPreseleccionada?: EntradaConEvento
}

export function TransferirModal({ open, onClose, entradaPreseleccionada }: TransferirModalProps) {
  const qc = useQueryClient()

  const { data: entradas = [] } = useQuery<EntradaConEvento[]>({
    queryKey: ['mis-entradas'],
    queryFn: () => api.get('/entradas'),
    enabled: open,
  })

  const [form, setForm] = useState({
    id_entrada: entradaPreseleccionada?.id ?? 0,
    email_destino: '',
  })

  // Sync when preselected entrada changes
  useEffect(() => {
    setForm(f => ({ ...f, id_entrada: entradaPreseleccionada?.id ?? 0 }))
  }, [entradaPreseleccionada?.id])

  const mutation = useMutation({
    mutationFn: (data: { id_entrada: number; email_destino: string }) =>
      api.post('/transferencias', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transferencias'] })
      qc.invalidateQueries({ queryKey: ['mis-entradas'] })
      setForm({ id_entrada: entradaPreseleccionada?.id ?? 0, email_destino: '' })
      setTimeout(onClose, 1500)
    },
  })

  function handleClose() {
    mutation.reset()
    setForm({ id_entrada: entradaPreseleccionada?.id ?? 0, email_destino: '' })
    onClose()
  }

  const selectedEntrada = entradas.find(e => e.id === form.id_entrada)

  const valid = form.id_entrada > 0 && /\S+@\S+\.\S+/.test(form.email_destino)

  return (
    <Modal open={open} onClose={handleClose} title="Transferir entrada">
      <div className="space-y-4">
        {/* Entrada selector */}
        <div>
          <label className="label">Entrada</label>
          {entradaPreseleccionada ? (
            <div className="card p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-sm uppercase truncate">
                  <span className="text-[#39ff14]">{entradaPreseleccionada.nombre_equipo_local}</span>
                  <span className="text-[#6b7a9c] mx-1.5 font-normal normal-case text-xs">vs</span>
                  {entradaPreseleccionada.nombre_equipo_visitante}
                </div>
                <div className="text-xs text-[#6b7a9c] mt-0.5">
                  Sector {entradaPreseleccionada.nombre_sector} · #{entradaPreseleccionada.id}
                </div>
              </div>
            </div>
          ) : (
            <select className="input-field" value={form.id_entrada}
              onChange={e => setForm(f => ({ ...f, id_entrada: Number(e.target.value) }))}>
              <option value={0}>Seleccioná una entrada...</option>
              {entradas.map(en => (
                <option key={en.id} value={en.id}>
                  #{en.id} — {en.nombre_equipo_local} vs {en.nombre_equipo_visitante} · {en.nombre_sector}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Destinatario */}
        <div>
          <label className="label">Email del destinatario</label>
          <input
            className="input-field"
            type="email"
            placeholder="destino@email.com"
            value={form.email_destino}
            onChange={e => setForm(f => ({ ...f, email_destino: e.target.value }))}
            autoFocus
          />
        </div>

        {/* Error */}
        {mutation.isError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">
            {(mutation.error as Error).message}
          </div>
        )}

        {/* Success */}
        {mutation.isSuccess && (
          <div className="bg-[#39ff1410] border border-[#39ff1430] rounded-lg px-4 py-2.5 text-[#39ff14] text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Transferencia enviada. Esperando aceptación.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={handleClose} className="btn-outline flex-1 py-2 text-sm">
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={!valid || mutation.isPending || mutation.isSuccess}
            className="btn-pitch flex-1 flex items-center justify-center gap-2 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
              : <><Send className="w-4 h-4" />Transferir</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}
