import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { User, Save, Loader2, CheckCircle, Phone, MapPin, FileText } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

type Perfil = {
  email: string
  documento_pais: string; documento_tipo: string; documento_numero: string
  dir_pais: string; dir_localidad: string; dir_calle: string
  dir_numero: string; dir_codigo_postal: string
  telefonos: string[]
}

export function PerfilPage() {
  const qc = useQueryClient()
  const { data: perfil, isLoading } = useQuery<Perfil>({
    queryKey: ['perfil-me'],
    queryFn: () => api.get('/auth/me'),
  })

  const [form, setForm] = useState({
    dir_pais: '', dir_localidad: '', dir_calle: '', dir_numero: '', dir_codigo_postal: '',
  })

  useEffect(() => {
    if (perfil) setForm({
      dir_pais: perfil.dir_pais,
      dir_localidad: perfil.dir_localidad,
      dir_calle: perfil.dir_calle,
      dir_numero: perfil.dir_numero,
      dir_codigo_postal: perfil.dir_codigo_postal,
    })
  }, [perfil])

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => api.put('/auth/perfil', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['perfil-me'] }),
  })

  if (isLoading) return (
    <div className="space-y-4">
      <div className="card h-32 animate-pulse" />
      <div className="card h-64 animate-pulse" />
    </div>
  )

  if (!perfil) return null

  const valid = Object.values(form).every(v => v.trim() !== '')

  return (
    <div className="max-w-2xl">
      <PageHeader title="Mi Perfil" subtitle={perfil.email} icon={User} />

      {/* Read-only: documento */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-2 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b] mb-4">
          <FileText className="w-3.5 h-3.5" />Documento
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="label">País</div>
            <div className="text-sm text-[#e8edf8] mt-1">{perfil.documento_pais}</div>
          </div>
          <div>
            <div className="label">Tipo</div>
            <div className="text-sm text-[#e8edf8] mt-1">{perfil.documento_tipo}</div>
          </div>
          <div>
            <div className="label">Número</div>
            <div className="text-sm text-[#e8edf8] mt-1 font-mono">{perfil.documento_numero}</div>
          </div>
        </div>
      </div>

      {/* Read-only: telefonos */}
      {perfil.telefonos.length > 0 && (
        <div className="card p-5 mb-4">
          <div className="flex items-center gap-2 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b] mb-3">
            <Phone className="w-3.5 h-3.5" />Teléfonos
          </div>
          <div className="flex flex-wrap gap-2">
            {perfil.telefonos.map((t) => (
              <span key={t} className="font-mono text-sm bg-[#0d1529] border border-[#1a2540] px-3 py-1 rounded-lg text-[#e8edf8]">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Editable: dirección */}
      <div className="card card-glow p-6">
        <div className="flex items-center gap-2 text-[10px] font-display uppercase tracking-widest text-[#3a4a6b] mb-5">
          <MapPin className="w-3.5 h-3.5" />Dirección
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">País</label>
              <input className="input-field" value={form.dir_pais}
                onChange={e => setForm(f => ({ ...f, dir_pais: e.target.value }))} />
            </div>
            <div>
              <label className="label">Localidad</label>
              <input className="input-field" value={form.dir_localidad}
                onChange={e => setForm(f => ({ ...f, dir_localidad: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="label">Calle</label>
              <input className="input-field" value={form.dir_calle}
                onChange={e => setForm(f => ({ ...f, dir_calle: e.target.value }))} />
            </div>
            <div>
              <label className="label">Número</label>
              <input className="input-field" value={form.dir_numero}
                onChange={e => setForm(f => ({ ...f, dir_numero: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Código postal</label>
            <input className="input-field w-40" value={form.dir_codigo_postal}
              onChange={e => setForm(f => ({ ...f, dir_codigo_postal: e.target.value }))} />
          </div>

          {updateMutation.isError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-sm">
              {(updateMutation.error as Error).message}
            </div>
          )}
          {updateMutation.isSuccess && (
            <div className="flex items-center gap-2 text-[#39ff14] text-sm">
              <CheckCircle className="w-4 h-4" />Datos actualizados
            </div>
          )}

          <button
            onClick={() => updateMutation.mutate(form)}
            disabled={!valid || updateMutation.isPending}
            className="btn-pitch flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}
