import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Shield, Plus, Loader2, User, KeyRound, Hash } from 'lucide-react'

type Funcionario = {
  numero_legajo: string
  email: string
  documento_pais: string
  documento_numero: string
}

const EMPTY_FORM = {
  email: '', password: '', numero_legajo: '',
  documento_pais: '', documento_tipo: '', documento_numero: '',
  dir_pais: '', dir_localidad: '', dir_calle: '', dir_numero: '', dir_codigo_postal: '',
}

export function AdminFuncionariosPage() {
  const qc = useQueryClient()
  const { data: funcionarios = [], isLoading } = useQuery<Funcionario[]>({
    queryKey: ['admin-funcionarios'],
    queryFn: () => api.get('/admin/funcionarios'),
  })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const crearMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => api.post('/admin/funcionarios', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-funcionarios'] })
      setForm(EMPTY_FORM)
      setShowForm(false)
    },
  })

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title text-3xl">Funcionarios</h1>
          <p className="text-[#6b7a9c] text-sm mt-1">{funcionarios.length} funcionarios registrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-pitch flex items-center gap-1.5 py-2 px-4 text-sm">
          <Plus className="w-4 h-4" />Nuevo funcionario
        </button>
      </div>

      {showForm && (
        <div className="card card-glow p-6 mb-6">
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-[#39ff14] mb-5">Nuevo funcionario</h3>
          <div className="space-y-5">
            {/* Credenciales */}
            <div>
              <div className="text-[10px] font-display uppercase tracking-widest text-[#3a4a6b] mb-3 flex items-center gap-1.5">
                <KeyRound className="w-3 h-3" />Acceso
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="label">Email</label>
                  <input className="input-field" type="email" placeholder="func@mundial.com" value={form.email} onChange={set('email')} />
                </div>
                <div>
                  <label className="label">Contraseña</label>
                  <input className="input-field" type="password" placeholder="min. 6 chars" value={form.password} onChange={set('password')} />
                </div>
              </div>
            </div>

            {/* Legajo + Documento */}
            <div>
              <div className="text-[10px] font-display uppercase tracking-widest text-[#3a4a6b] mb-3 flex items-center gap-1.5">
                <Hash className="w-3 h-3" />Identificación
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Nro. Legajo</label>
                  <input className="input-field" placeholder="F001" value={form.numero_legajo} onChange={set('numero_legajo')} />
                </div>
                <div>
                  <label className="label">Doc. País</label>
                  <input className="input-field" placeholder="Uruguay" value={form.documento_pais} onChange={set('documento_pais')} />
                </div>
                <div>
                  <label className="label">Doc. Tipo</label>
                  <input className="input-field" placeholder="CI" value={form.documento_tipo} onChange={set('documento_tipo')} />
                </div>
                <div>
                  <label className="label">Doc. Número</label>
                  <input className="input-field" placeholder="12345678" value={form.documento_numero} onChange={set('documento_numero')} />
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div>
              <div className="text-[10px] font-display uppercase tracking-widest text-[#3a4a6b] mb-3 flex items-center gap-1.5">
                <User className="w-3 h-3" />Dirección
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">País</label>
                  <input className="input-field" placeholder="Uruguay" value={form.dir_pais} onChange={set('dir_pais')} />
                </div>
                <div>
                  <label className="label">Localidad</label>
                  <input className="input-field" placeholder="Montevideo" value={form.dir_localidad} onChange={set('dir_localidad')} />
                </div>
                <div>
                  <label className="label">Cód. Postal</label>
                  <input className="input-field" placeholder="11000" value={form.dir_codigo_postal} onChange={set('dir_codigo_postal')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Calle</label>
                  <input className="input-field" placeholder="Av. 18 de Julio" value={form.dir_calle} onChange={set('dir_calle')} />
                </div>
                <div>
                  <label className="label">Número</label>
                  <input className="input-field" placeholder="1234" value={form.dir_numero} onChange={set('dir_numero')} />
                </div>
              </div>
            </div>

            {crearMutation.isError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-sm">
                {(crearMutation.error as Error).message}
              </div>
            )}
            <button
              onClick={() => crearMutation.mutate(form)}
              disabled={crearMutation.isPending || !form.email || !form.password || !form.numero_legajo}
              className="btn-pitch flex items-center gap-2"
            >
              {crearMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear funcionario
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : funcionarios.length === 0 ? (
        <div className="card p-16 text-center">
          <Shield className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
          <p className="text-[#6b7a9c]">Sin funcionarios registrados.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a2540]">
                <th className="text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">Legajo</th>
                <th className="text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">Email</th>
                <th className="text-left px-4 py-3 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b]">Documento</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((f, i) => (
                <tr key={f.numero_legajo} className={i < funcionarios.length - 1 ? 'border-b border-[#1a2540]' : ''}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-[#0d1529] border border-[#1a2540] px-2 py-1 rounded text-[#39ff14]">
                      {f.numero_legajo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6b7a9c] font-mono">{f.email}</td>
                  <td className="px-4 py-3 text-xs text-[#6b7a9c]">{f.documento_pais} · {f.documento_numero}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
