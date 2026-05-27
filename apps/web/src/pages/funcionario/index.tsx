import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { EventoConNombres } from '@repo/shared'
import { Scan, CheckCircle, XCircle, Shield, Loader2 } from 'lucide-react'

type SectorAsignado = {
  id_sector: number
  id_evento: number
  nombre_sector: string
  capacidad_maxima: number
  validadas: number
  validacion_completa: boolean
  fecha: string
}

export function FuncionarioPage() {
  const [eventoId, setEventoId] = useState<number | null>(null)
  const [codigoQR, setCodigoQR] = useState('')
  const [dispositivoId, setDispositivoId] = useState('')
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null)

  const { data: eventos = [] } = useQuery<EventoConNombres[]>({
    queryKey: ['eventos'],
    queryFn: () => api.get('/eventos'),
  })

  const { data: sectores = [] } = useQuery<SectorAsignado[]>({
    queryKey: ['sectores-asignados', eventoId],
    queryFn: () => api.get(`/qr/sectores/${eventoId}`),
    enabled: !!eventoId,
  })

  const validarMutation = useMutation({
    mutationFn: () => api.post('/qr/validar', { codigo_rotativo: codigoQR, id_dispositivo: dispositivoId }),
    onSuccess: () => {
      setResultado({ ok: true, mensaje: 'Entrada válida. Acceso autorizado.' })
      setCodigoQR('')
      setTimeout(() => setResultado(null), 4000)
    },
    onError: (err) => {
      setResultado({ ok: false, mensaje: (err as Error).message })
      setTimeout(() => setResultado(null), 4000)
    },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#39ff14]/10 rounded-xl flex items-center justify-center border border-[#39ff14]/20">
          <Scan className="w-5 h-5 text-[#39ff14]" />
        </div>
        <div>
          <h1 className="section-title text-3xl">Validación</h1>
          <p className="text-[#6b7a9c] text-sm">Control de acceso en puerta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scanner */}
        <div className="card card-glow p-6">
          <h2 className="font-display font-800 text-sm uppercase tracking-widest text-[#39ff14] mb-5">
            Escanear QR
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">ID del dispositivo</label>
              <input className="input-field font-mono text-xs" placeholder="UUID del dispositivo autorizado"
                value={dispositivoId} onChange={e => setDispositivoId(e.target.value)} />
            </div>
            <div>
              <label className="label">Código QR</label>
              <input className="input-field font-mono text-xs" placeholder="Ingresar código del QR"
                value={codigoQR} onChange={e => setCodigoQR(e.target.value)} />
            </div>

            {resultado && (
              <div className={`rounded-lg px-4 py-3 flex items-center gap-2 text-sm border ${
                resultado.ok
                  ? 'bg-[#39ff1410] border-[#39ff1430] text-[#39ff14]'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {resultado.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                {resultado.mensaje}
              </div>
            )}

            <button
              onClick={() => validarMutation.mutate()}
              disabled={!codigoQR || !dispositivoId || validarMutation.isPending}
              className="btn-pitch w-full flex items-center justify-center gap-2"
            >
              {validarMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" />Validando...</>
                : <><Scan className="w-4 h-4" />Validar entrada</>}
            </button>
          </div>
        </div>

        {/* Sectores asignados */}
        <div>
          <h2 className="font-display font-800 text-sm uppercase tracking-widest text-[#6b7a9c] mb-4">
            Mis sectores asignados
          </h2>

          <div className="mb-3">
            <select className="input-field" value={eventoId ?? ''} onChange={e => setEventoId(Number(e.target.value) || null)}>
              <option value="">Seleccionar evento...</option>
              {eventos.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.nombre_equipo_local} vs {ev.nombre_equipo_visitante}
                </option>
              ))}
            </select>
          </div>

          {sectores.length === 0 && eventoId ? (
            <div className="card p-8 text-center">
              <Shield className="w-8 h-8 text-[#1a2540] mx-auto mb-2" />
              <p className="text-[#6b7a9c] text-sm">Sin sectores asignados para este evento.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sectores.map((s) => (
                <div key={s.id_sector} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-800 text-sm uppercase">{s.nombre_sector}</span>
                    {s.validacion_completa
                      ? <span className="badge-pitch flex items-center gap-1"><CheckCircle className="w-3 h-3" />Completo</span>
                      : <span className="badge-amber">En curso</span>}
                  </div>
                  <div className="h-1 bg-[#0d1529] rounded-full overflow-hidden">
                    <div className="h-full bg-[#39ff14] rounded-full"
                      style={{ width: `${(Number(s.validadas) / s.capacidad_maxima) * 100}%` }} />
                  </div>
                  <div className="text-xs text-[#6b7a9c] mt-1">
                    {s.validadas} / {s.capacidad_maxima} validadas
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
