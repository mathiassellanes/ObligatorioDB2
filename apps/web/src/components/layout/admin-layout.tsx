import { Link, Outlet } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Estadio } from '@repo/shared'
import {
  Shield, Building2, Calendar, Users, BarChart3,
  ChevronRight, LogOut, Globe, Smartphone
} from 'lucide-react'
import { useLogout } from '@/hooks/use-logout'

const NAV = [
  { to: '/admin/eventos', icon: Calendar, label: 'Eventos' },
  { to: '/admin/equipos', icon: Users, label: 'Equipos' },
  { to: '/admin/funcionarios', icon: Shield, label: 'Funcionarios' },
  { to: '/admin/dispositivos', icon: Smartphone, label: 'Dispositivos' },
  { to: '/admin/reportes', icon: BarChart3, label: 'Reportes' },
] as const

export function AdminLayout() {
  const handleLogout = useLogout()
  const { data: estadios = [] } = useQuery<Estadio[]>({
    queryKey: ['admin-estadios'],
    queryFn: () => api.get('/admin/estadios'),
  })

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-[#1a2540] bg-[#070d1c] flex flex-col">
        {/* Header */}
        <div className="px-5 py-5 border-b border-[#1a2540]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#39ff14]/10 rounded-lg flex items-center justify-center border border-[#39ff14]/20">
              <Shield className="w-4 h-4 text-[#39ff14]" />
            </div>
            <div>
              <div className="font-display font-black text-sm uppercase tracking-wide text-[#e8edf8]">Panel Admin</div>
              <div className="text-[10px] text-[#6b7a9c] font-mono">Mundial 2026</div>
            </div>
          </div>
        </div>

        {/* Estadios */}
        <div className="px-3 pt-4 pb-2">
          <div className="text-[10px] font-display font-bold uppercase tracking-widest text-[#3a4a6b] px-2 mb-2 flex items-center gap-1.5">
            <Building2 className="w-3 h-3" />Mis Estadios
          </div>
          <div className="space-y-0.5">
            {estadios.length === 0 && (
              <p className="text-[11px] text-[#3a4a6b] px-2 py-1">Sin estadios asignados</p>
            )}
            {estadios.map((e) => (
              <Link
                key={e.id}
                to="/admin/estadios/$id"
                params={{ id: String(e.id) }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] text-[#6b7a9c]
                           hover:text-[#e8edf8] hover:bg-[#0d1529] transition-colors group
                           [&.active]:text-[#39ff14] [&.active]:bg-[#39ff1410]"
                activeProps={{ className: 'active' }}
              >
                <ChevronRight className="w-3 h-3 shrink-0 group-[.active]:text-[#39ff14]" />
                <span className="truncate font-display font-semibold">{e.nombre}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-[#1a2540]" />

        {/* Nav */}
        <nav className="px-3 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#6b7a9c]
                         hover:text-[#e8edf8] hover:bg-[#0d1529] transition-colors
                         [&.active]:text-[#e8edf8] [&.active]:bg-[#0d1529] [&.active]:border [&.active]:border-[#1a2540]"
              activeProps={{ className: 'active' }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="font-display font-bold text-[13px] uppercase tracking-wide">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-[#1a2540] pt-3 space-y-1">
          <Link to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#6b7a9c] hover:text-[#e8edf8] hover:bg-[#0d1529] transition-colors">
            <Globe className="w-4 h-4" />
            <span className="font-display font-bold text-[13px] uppercase tracking-wide">Ver Sitio</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#6b7a9c] hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-display font-bold text-[13px] uppercase tracking-wide">Salir</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 bg-[#050914]">
        <Outlet />
      </main>
    </div>
  )
}
