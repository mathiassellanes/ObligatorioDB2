import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { QRActivo, EntradaConEvento } from '@repo/shared'
import { QRCodeSVG } from 'qrcode.react'
import { Shield, RefreshCw, CheckCircle, MapPin, CalendarClock, Ticket } from 'lucide-react'
import { useValidacionWS, type ValidacionEvent } from '@/hooks/use-validacion-ws'

export function QRPage() {
  const { id } = useParams({ from: '/qr/$id' })
  const queryClient = useQueryClient()
  const [countdown, setCountdown] = useState(30)
  const [validada, setValidada] = useState<ValidacionEvent | null>(null)

  const { data: entrada } = useQuery<EntradaConEvento>({
    queryKey: ['entrada', id],
    queryFn: () => api.get(`/entradas/${id}`),
  })

  // En tiempo real: cuando un funcionario valida ESTA entrada, mostramos el
  // acceso confirmado y a qué sector dirigirse, sin recargar.
  useValidacionWS((ev) => {
    if (ev.id_entrada === Number(id)) {
      setValidada(ev)
      queryClient.invalidateQueries({ queryKey: ['mis-entradas'] })
      queryClient.invalidateQueries({ queryKey: ['entrada', id] })
    }
  })

  const yaUsada = validada || entrada?.consumida
  const sector = validada?.nombre_sector ?? entrada?.nombre_sector

  const { data: qr, refetch, isFetching } = useQuery<QRActivo>({
    queryKey: ['qr', id],
    queryFn: () => api.get(`/qr/${id}`),
    refetchInterval: 30_000,
    staleTime: 0,
    enabled: !yaUsada, // no rotar QR si la entrada ya fue validada/consumida
  })

  // Countdown timer
  useEffect(() => {
    if (yaUsada) return
    setCountdown(30)
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { refetch(); return 30 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [qr?.codigo_rotativo, refetch, yaUsada])

  const fecha = entrada ? new Date(entrada.fecha_evento) : null

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-6">
        <h1 className="section-title text-3xl mb-2">Tu Entrada</h1>
        {entrada && (
          <h2 className="font-display font-extrabold text-lg uppercase leading-tight">
            <span className="text-[#39ff14]">{entrada.nombre_equipo_local}</span>
            <span className="text-[#6b7a9c] mx-2 text-base">vs</span>
            {entrada.nombre_equipo_visitante}
          </h2>
        )}
      </div>

      {/* Datos de la entrada */}
      {entrada && (
        <div className="card p-4 mb-4 grid grid-cols-2 gap-3">
          <Info icon={CalendarClock} label="Fecha"
            value={fecha ? `${fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })} · ${entrada.hora_evento?.toString().slice(0, 5)}h` : '—'} />
          <Info icon={Ticket} label="Sector" value={sector ?? '—'} highlight />
          <Info icon={MapPin} label="Estadio" value={entrada.nombre_estadio} full />
        </div>
      )}

      {yaUsada ? (
        /* Entrada validada — acceso confirmado */
        <div className="card card-glow ring-1 ring-[#39ff14]/50 p-8 text-center bg-[#39ff14]/5">
          <div className="w-24 h-24 rounded-full bg-[#39ff14]/15 border-2 border-[#39ff14] flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-12 h-12 text-[#39ff14]" />
          </div>
          <h2 className="font-display font-black text-3xl text-[#39ff14] uppercase tracking-tight mb-2">
            Acceso validado
          </h2>
          <p className="text-[#e8edf8] text-sm mb-1">Tu entrada ya fue usada para ingresar.</p>
          {sector && (
            <div className="mt-5 inline-flex items-center gap-2 bg-[#0d1529] border border-[#39ff14]/30 rounded-xl px-5 py-3">
              <MapPin className="w-5 h-5 text-[#39ff14]" />
              <span className="font-display font-bold uppercase tracking-wide text-[#e8edf8]">
                Dirigite al Sector {sector}
              </span>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="card card-glow p-8">
            <div className="text-center mb-4">
              <p className="text-[#6b7a9c] text-sm">
                Código rotativo — válido por{' '}
                <span className="text-[#39ff14] font-mono font-semibold">{countdown}s</span>
              </p>
            </div>
            {/* QR */}
            <div className="relative flex justify-center mb-6">
              <div className="qr-scanline bg-white p-4 rounded-xl">
                {qr ? (
                  <QRCodeSVG value={qr.codigo_rotativo} size={220} level="H" includeMargin={false} />
                ) : (
                  <div className="w-[220px] h-[220px] bg-[#0d1529] animate-pulse rounded" />
                )}
              </div>
              {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-6 h-6 border-[#39ff14]
                  ${i === 0 ? 'border-t-2 border-l-2' : i === 1 ? 'border-t-2 border-r-2' : i === 2 ? 'border-b-2 border-l-2' : 'border-b-2 border-r-2'}`} />
              ))}
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-1 bg-[#0d1529] rounded-full overflow-hidden">
                <div className="h-full bg-[#39ff14] transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(countdown / 30) * 100}%` }} />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#6b7a9c] text-xs">
              <Shield className="w-3.5 h-3.5 text-[#39ff14]" />
              <span>Mostrá este código al funcionario. Se renueva cada 30 segundos.</span>
            </div>
          </div>

          <button onClick={() => refetch()} disabled={isFetching}
            className="mt-4 btn-outline w-full flex items-center justify-center gap-2">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Renovar ahora
          </button>
        </>
      )}
    </div>
  )
}

function Info({ icon: Icon, label, value, highlight, full }: {
  icon: typeof MapPin; label: string; value: string; highlight?: boolean; full?: boolean
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="flex items-center gap-1.5 text-[#6b7a9c] text-[10px] uppercase tracking-widest font-display font-bold mb-1">
        <Icon className="w-3 h-3 text-[#39ff14]" />{label}
      </div>
      <div className={`font-display font-bold ${highlight ? 'text-[#39ff14]' : 'text-[#e8edf8]'}`}>{value}</div>
    </div>
  )
}
