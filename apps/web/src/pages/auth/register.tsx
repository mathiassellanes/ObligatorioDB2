import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { CreatePerfilDTO } from '@repo/shared'
import { Ticket, Plus, Minus, Loader2 } from 'lucide-react'

export function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [telefonos, setTelefonos] = useState([''])

  const [form, setForm] = useState({
    email: '', password: '',
    documento_pais: '', documento_tipo: 'DNI', documento_numero: '',
    dir_pais: '', dir_localidad: '', dir_calle: '', dir_numero: '', dir_codigo_postal: '',
  })

  function updateForm(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const payload: CreatePerfilDTO = {
      ...form,
      telefonos: telefonos.filter(Boolean),
    }
    try {
      await api.post('/auth/register', payload)
      router.navigate({ to: '/login' })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex justify-center mb-8">
        <div className="w-14 h-14 bg-[#39ff14] rounded-2xl flex items-center justify-center shadow-[0_0_30px_#39ff1440]">
          <Ticket className="w-7 h-7 text-[#050914]" strokeWidth={2.5} />
        </div>
      </div>

      <div className="card card-glow p-8">
        <h1 className="font-display font-900 text-3xl uppercase tracking-tight mb-1">Crear cuenta</h1>
        <p className="text-[#6b7a9c] text-sm mb-8">Registrate para comprar entradas al Mundial 2026</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cuenta */}
          <Section title="Cuenta">
            <Field label="Email">
              <input className="input-field" type="email" placeholder="tu@email.com"
                value={form.email} onChange={e => updateForm('email', e.target.value)} required />
            </Field>
            <Field label="Contraseña">
              <input className="input-field" type="password" placeholder="Mínimo 8 caracteres"
                value={form.password} onChange={e => updateForm('password', e.target.value)} minLength={8} required />
            </Field>
          </Section>

          {/* Documento */}
          <Section title="Documento">
            <div className="grid grid-cols-3 gap-3">
              <Field label="País">
                <input className="input-field" placeholder="Uruguay"
                  value={form.documento_pais} onChange={e => updateForm('documento_pais', e.target.value)} required />
              </Field>
              <Field label="Tipo">
                <select className="input-field" value={form.documento_tipo}
                  onChange={e => updateForm('documento_tipo', e.target.value)}>
                  <option>DNI</option><option>CI</option><option>Pasaporte</option><option>RUT</option>
                </select>
              </Field>
              <Field label="Número">
                <input className="input-field" placeholder="12345678"
                  value={form.documento_numero} onChange={e => updateForm('documento_numero', e.target.value)} required />
              </Field>
            </div>
          </Section>

          {/* Dirección */}
          <Section title="Dirección">
            <div className="grid grid-cols-2 gap-3">
              <Field label="País">
                <input className="input-field" placeholder="Uruguay"
                  value={form.dir_pais} onChange={e => updateForm('dir_pais', e.target.value)} required />
              </Field>
              <Field label="Localidad">
                <input className="input-field" placeholder="Montevideo"
                  value={form.dir_localidad} onChange={e => updateForm('dir_localidad', e.target.value)} required />
              </Field>
              <Field label="Calle">
                <input className="input-field" placeholder="18 de Julio"
                  value={form.dir_calle} onChange={e => updateForm('dir_calle', e.target.value)} required />
              </Field>
              <Field label="Número">
                <input className="input-field" placeholder="1234"
                  value={form.dir_numero} onChange={e => updateForm('dir_numero', e.target.value)} required />
              </Field>
              <Field label="Código Postal" className="col-span-2">
                <input className="input-field" placeholder="11200"
                  value={form.dir_codigo_postal} onChange={e => updateForm('dir_codigo_postal', e.target.value)} required />
              </Field>
            </div>
          </Section>

          {/* Teléfonos */}
          <Section title="Teléfonos">
            {telefonos.map((tel, i) => (
              <div key={i} className="flex gap-2">
                <input className="input-field flex-1" placeholder="+598 99 000 000"
                  value={tel} onChange={e => {
                    const copy = [...telefonos]
                    copy[i] = e.target.value
                    setTelefonos(copy)
                  }} />
                {telefonos.length > 1 && (
                  <button type="button" onClick={() => setTelefonos(telefonos.filter((_, j) => j !== i))}
                    className="p-2 text-red-400 hover:text-red-300 border border-[#1a2540] rounded-lg transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setTelefonos([...telefonos, ''])}
              className="flex items-center gap-2 text-[#39ff14] text-sm hover:underline">
              <Plus className="w-3.5 h-3.5" /> Agregar teléfono
            </button>
          </Section>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-pitch w-full flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-[#6b7a9c] text-sm">¿Ya tenés cuenta? </span>
          <Link to="/login" className="text-[#39ff14] text-sm hover:underline font-600">Ingresar</Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="font-display font-700 text-xs tracking-widest uppercase text-[#39ff14]">{title}</span>
        <div className="flex-1 h-px bg-[#1a2540]" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}
