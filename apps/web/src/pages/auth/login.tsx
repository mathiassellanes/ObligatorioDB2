import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { api } from '@/api/client'
import { saveAuth, type Rol } from '@/lib/auth'
import { Ticket, Eye, EyeOff, Loader2 } from 'lucide-react'

export function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post<{ token: string; rol: Rol }>('/auth/login', { email, password })
      saveAuth(res.token, res.rol, email)
      if (res.rol === 'admin_por_pais_sede') router.navigate({ to: '/admin' })
      else if (res.rol === 'funcionario_de_validacion') router.navigate({ to: '/funcionario' })
      else router.navigate({ to: '/dashboard' })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-[#39ff14] rounded-2xl flex items-center justify-center shadow-[0_0_30px_#39ff1440]">
            <Ticket className="w-7 h-7 text-[#050914]" strokeWidth={2.5} />
          </div>
        </div>

        <div className="card card-glow p-8">
          <h1 className="font-display font-900 text-3xl uppercase tracking-tight mb-1">
            Ingresar
          </h1>
          <p className="text-[#6b7a9c] text-sm mb-8">
            Accedé a tus entradas y transferencias
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a9c] hover:text-[#e8edf8]"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-pitch w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-[#6b7a9c] text-sm">¿No tenés cuenta? </span>
            <Link to="/register" className="text-[#39ff14] text-sm hover:underline font-600">
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
