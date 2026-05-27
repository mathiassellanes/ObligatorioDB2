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
      {/* Secondary nav — scrollable on mobile */}
      <div className="border-b border-[#1a2540] bg-[#070d1c] overflow-x-auto">
        <div className="flex items-center min-w-max sm:min-w-0 sm:max-w-5xl sm:mx-auto px-2 sm:px-4 h-11">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-1.5 px-3 sm:px-4 h-full whitespace-nowrap text-[12px] sm:text-[13px]
                         font-display font-bold uppercase tracking-wide text-[#6b7a9c]
                         hover:text-[#e8edf8] transition-colors relative shrink-0
                         [&.active]:text-[#39ff14]"
              activeProps={{ className: 'active' }}
              activeOptions={to === '/' ? { exact: true } : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">{label}</span>
              {/* Active underline */}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-[#39ff14] scale-x-0 [.active_&]:scale-x-100 transition-transform origin-center" />
            </Link>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
