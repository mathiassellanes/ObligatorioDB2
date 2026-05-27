import { useEffect } from 'react'
import { useSearch, useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import { CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react'

export function FuncionarioResultadoPage() {
  const router = useRouter()
  const { codigo, dispositivo } = useSearch({ from: '/funcionario/resultado' })

  const validarMutation = useMutation({
    mutationFn: () => api.post('/qr/validar', {
      codigo_rotativo: codigo,
      id_dispositivo: dispositivo,
    }),
  })

  useEffect(() => {
    validarMutation.mutate()
  }, [])

  const ok = validarMutation.isSuccess
  const error = validarMutation.isError
  const loading = validarMutation.isPending

  // Auto-navigate back after 3s on success
  useEffect(() => {
    if (!ok) return
    const t = setTimeout(() => router.navigate({ to: '/funcionario' }), 3000)
    return () => clearTimeout(t)
  }, [ok])

  return (
    <div className={`min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 transition-colors duration-500 ${
      ok ? 'bg-[#001a00]' : error ? 'bg-[#1a0000]' : 'bg-[#050914]'
    }`}>
      {loading && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-16 h-16 text-[#39ff14] animate-spin" />
          <p className="text-[#6b7a9c] font-display font-bold uppercase tracking-widest text-sm">
            Validando...
          </p>
        </div>
      )}

      {ok && (
        <div className="text-center animate-in zoom-in-50 duration-300">
          <div className="w-28 h-28 rounded-full bg-[#39ff14]/20 border-2 border-[#39ff14] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-[#39ff14]" />
          </div>
          <h1 className="font-display font-black text-4xl text-[#39ff14] uppercase tracking-tight mb-2">
            Válido
          </h1>
          <p className="text-[#6b7a9c] text-sm mb-8">Acceso autorizado. Bienvenido.</p>
          <p className="text-[#3a4a6b] text-xs font-mono">Volviendo al scanner en 3s...</p>
        </div>
      )}

      {error && (
        <div className="text-center animate-in zoom-in-50 duration-300 w-full max-w-sm">
          <div className="w-28 h-28 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-14 h-14 text-red-400" />
          </div>
          <h1 className="font-display font-black text-4xl text-red-400 uppercase tracking-tight mb-2">
            Inválido
          </h1>
          <p className="text-red-400/70 text-sm mb-8">
            {(validarMutation.error as Error).message}
          </p>
          <button
            onClick={() => router.navigate({ to: '/funcionario' })}
            className="btn-outline flex items-center gap-2 mx-auto px-6"
          >
            <ArrowLeft className="w-4 h-4" />Volver
          </button>
        </div>
      )}
    </div>
  )
}
