import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { QRActivo } from '@repo/shared'
import { QRCodeSVG } from 'qrcode.react'
import { Shield, RefreshCw, Clock } from 'lucide-react'

export function QRPage() {
  const { id } = useParams({ from: '/qr/$id' })
  const [countdown, setCountdown] = useState(30)

  const { data: qr, refetch, isFetching } = useQuery<QRActivo>({
    queryKey: ['qr', id],
    queryFn: () => api.get(`/qr/${id}`),
    refetchInterval: 30_000,
    staleTime: 0,
  })

  // Countdown timer
  useEffect(() => {
    setCountdown(30)
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { refetch(); return 30 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [qr?.codigo_rotativo, refetch])

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="section-title text-3xl mb-2">QR Dinámico</h1>
        <p className="text-[#6b7a9c] text-sm">
          Código rotativo — válido por{' '}
          <span className="text-[#39ff14] font-mono font-600">{countdown}s</span>
        </p>
      </div>

      <div className="card card-glow p-8">
        {/* QR */}
        <div className="relative flex justify-center mb-6">
          <div className="qr-scanline bg-white p-4 rounded-xl">
            {qr ? (
              <QRCodeSVG
                value={qr.codigo_rotativo}
                size={220}
                level="H"
                includeMargin={false}
              />
            ) : (
              <div className="w-[220px] h-[220px] bg-[#0d1529] animate-pulse rounded" />
            )}
          </div>

          {/* Corner brackets */}
          {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-6 h-6 border-[#39ff14]
              ${i === 0 ? 'border-t-2 border-l-2' : i === 1 ? 'border-t-2 border-r-2' : i === 2 ? 'border-b-2 border-l-2' : 'border-b-2 border-r-2'}`} />
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-1 bg-[#0d1529] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#39ff14] transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(countdown / 30) * 100}%` }}
            />
          </div>
        </div>

        {/* Code */}
        {qr && (
          <div className="bg-[#0d1529] rounded-lg p-3 mb-4 border border-[#1a2540]">
            <div className="label mb-1">Código</div>
            <code className="text-[#39ff14] font-mono text-xs break-all">
              {qr.codigo_rotativo}
            </code>
          </div>
        )}

        {/* Info */}
        <div className="flex items-center gap-2 text-[#6b7a9c] text-xs">
          <Shield className="w-3.5 h-3.5 text-[#39ff14]" />
          <span>Solo válido mientras la app esté activa. Se renueva cada 30 segundos.</span>
        </div>
      </div>

      <button
        onClick={() => refetch()}
        disabled={isFetching}
        className="mt-4 btn-outline w-full flex items-center justify-center gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        Renovar ahora
      </button>
    </div>
  )
}
