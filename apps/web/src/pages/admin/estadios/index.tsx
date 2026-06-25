import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { Estadio, Sector } from '@repo/shared'
import { Building2, ChevronRight, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

type EstadioConSectores = Estadio & { sectores: Sector[] }

export function AdminEstadiosPage() {
  const { data: estadios = [], isLoading } = useQuery<Estadio[]>({
    queryKey: ['admin-estadios'],
    queryFn: () => api.get('/admin/estadios'),
  })

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="Estadios"
        subtitle="Tus estadios asignados"
        icon={Building2}
      />

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}</div>
      ) : estadios.length === 0 ? (
        <div className="card p-16 text-center">
          <Building2 className="w-12 h-12 text-[#1a2540] mx-auto mb-4" />
          <p className="text-[#6b7a9c]">No tenés estadios asignados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {estadios.map((e) => (
            <Link
              key={e.id}
              to="/admin/estadios/$id"
              params={{ id: String(e.id) }}
              className="card p-5 flex items-center gap-4 hover:border-[#39ff1430] transition-colors group block"
            >
              <div className="w-10 h-10 bg-[#0d1529] rounded-xl flex items-center justify-center border border-[#1a2540] shrink-0">
                <Building2 className="w-5 h-5 text-[#6b7a9c]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-extrabold text-lg uppercase">{e.nombre}</div>
                <div className="flex items-center gap-1 text-xs text-[#6b7a9c] mt-0.5">
                  <MapPin className="w-3 h-3" />Ver detalle, sectores y eventos
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#3a4a6b] group-hover:text-[#39ff14] transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
