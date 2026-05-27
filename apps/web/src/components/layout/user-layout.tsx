import { Link, Outlet } from '@tanstack/react-router'
import { Calendar, Ticket, ArrowRightLeft, User } from 'lucide-react'

const NAV = [
  { to: '/', label: 'Eventos', icon: Calendar },
  { to: '/u/entradas', label: 'Mis Entradas', icon: Ticket },
  { to: '/u/transferencias', label: 'Transferencias', icon: ArrowRightLeft },
  { to: '/u/perfil', label: 'Mi Perfil', icon: User },
] as const

export function UserLayout() {
  return (
    <div>
      {/* Secondary nav */}
      <div className="border-b border-[#1a2540] bg-[#070d1c]">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-0.5 h-11">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-1.5 px-4 h-full text-[13px] font-display font-bold uppercase tracking-wide
                         text-[#6b7a9c] hover:text-[#e8edf8] transition-colors relative
                         [&.active]:text-[#39ff14]"
              activeProps={{ className: 'active' }}
              activeOptions={to === '/' ? { exact: true } : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {/* Active underline */}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#39ff14] opacity-0 [.active_&]:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
