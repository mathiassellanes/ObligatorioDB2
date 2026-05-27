import { Link, useRouter } from '@tanstack/react-router'
import { isLoggedIn, getRol, logout } from '@/lib/auth'
import { Ticket, LogOut, ArrowRightLeft, Shield, Scan, Calendar, User, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const loggedIn = isLoggedIn()
  const rol = getRol()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    router.navigate({ to: '/login' })
  }

  const userNavLinks = rol === 'usuario_general' ? [
    { to: '/', label: 'Eventos', icon: Calendar, exact: true },
    { to: '/u/entradas', label: 'Mis Entradas', icon: Ticket },
    { to: '/u/transferencias', label: 'Transferencias', icon: ArrowRightLeft },
    { to: '/u/perfil', label: 'Mi Perfil', icon: User },
  ] : rol === 'admin_por_pais_sede' ? [
    { to: '/admin', label: 'Admin', icon: Shield, exact: false },
  ] : rol === 'funcionario_de_validacion' ? [
    { to: '/funcionario', label: 'Validación', icon: Scan, exact: true },
    { to: '/funcionario/perfil', label: 'Mi Perfil', icon: User, exact: false },
  ] : []

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 border-b border-[#1a2540] bg-[#050914]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 bg-[#39ff14] rounded-lg flex items-center justify-center
                            group-hover:shadow-[0_0_20px_#39ff1460] transition-all duration-300">
              <Ticket className="w-4 h-4 text-[#050914]" strokeWidth={2.5} />
            </div>
            <span className="font-display font-black text-lg tracking-tight uppercase text-[#e8edf8]">
              Mundial<span className="text-[#39ff14]">Ticket</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          {loggedIn && userNavLinks.length > 0 && (
            <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              {userNavLinks.map(({ to, label, icon: Icon, exact }) => (
                <Link
                  key={to}
                  to={to}
                  activeOptions={exact ? { exact: true } : undefined}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#6b7a9c]
                             hover:text-[#e8edf8] hover:bg-[#0d1529] transition-all duration-200
                             [&.active]:text-[#39ff14] [&.active]:bg-[#39ff1410]"
                  activeProps={{ className: 'active' }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {loggedIn ? (
              <>
                <button onClick={handleLogout}
                  className="hidden md:flex items-center gap-2 text-[#6b7a9c] hover:text-red-400 transition-colors text-sm">
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </button>
                {/* Mobile hamburger */}
                <button onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden p-2 text-[#6b7a9c] hover:text-[#e8edf8]">
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline py-2 px-4 text-sm">Ingresar</Link>
                <Link to="/register" className="btn-pitch py-2 px-4 text-sm">Registrarse</Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && loggedIn && (
          <div className="md:hidden border-t border-[#1a2540] bg-[#050914] px-4 py-3 space-y-1">
            {userNavLinks.map(({ to, label, icon: Icon, exact }) => (
              <Link
                key={to}
                to={to}
                activeOptions={exact ? { exact: true } : undefined}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#6b7a9c]
                           hover:text-[#e8edf8] hover:bg-[#0d1529] transition-colors
                           [&.active]:text-[#39ff14] [&.active]:bg-[#39ff1410]"
                activeProps={{ className: 'active' }}
              >
                <Icon className="w-4 h-4" />{label}
              </Link>
            ))}
            <div className="border-t border-[#1a2540] pt-2 mt-2">
              <button onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#6b7a9c] hover:text-red-400 w-full">
                <LogOut className="w-4 h-4" />Salir
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#1a2540] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-display font-bold text-sm uppercase tracking-widest text-[#6b7a9c]">
            Mundial Ticket · UCU 2026
          </span>
          <span className="text-xs text-[#6b7a9c]/60 font-mono">BD II · Obligatorio</span>
        </div>
      </footer>
    </div>
  )
}
