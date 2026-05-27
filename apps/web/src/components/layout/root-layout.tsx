import { Link, useRouter } from '@tanstack/react-router'
import { isLoggedIn, getRol, logout } from '@/lib/auth'
import { Ticket, LogOut, LayoutDashboard, ArrowRightLeft, ShoppingBag, Shield, Scan } from 'lucide-react'

export function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const loggedIn = isLoggedIn()
  const rol = getRol()

  function handleLogout() {
    logout()
    router.navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 border-b border-[#1a2540] bg-[#050914]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[#39ff14] rounded-lg flex items-center justify-center
                            group-hover:shadow-[0_0_20px_#39ff1460] transition-all duration-300">
              <Ticket className="w-4 h-4 text-[#050914]" strokeWidth={2.5} />
            </div>
            <span className="font-display font-900 text-lg tracking-tight uppercase text-[#e8edf8]">
              Mundial<span className="text-[#39ff14]">Ticket</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/">Eventos</NavLink>
            {loggedIn && rol === 'usuario_general' && (
              <>
                <NavLink to="/dashboard">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Mis Entradas
                </NavLink>
                <NavLink to="/compras">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Compras
                </NavLink>
                <NavLink to="/transferencias">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Transferencias
                </NavLink>
              </>
            )}
            {loggedIn && rol === 'admin_por_pais_sede' && (
              <NavLink to="/admin">
                <Shield className="w-3.5 h-3.5" />
                Admin
              </NavLink>
            )}
            {loggedIn && rol === 'funcionario_de_validacion' && (
              <NavLink to="/funcionario">
                <Scan className="w-3.5 h-3.5" />
                Validación
              </NavLink>
            )}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {loggedIn ? (
              <button onClick={handleLogout} className="flex items-center gap-2 text-[#6b7a9c] hover:text-red-400 transition-colors text-sm">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Salir</span>
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-outline py-2 px-4 text-sm">Ingresar</Link>
                <Link to="/register" className="btn-pitch py-2 px-4 text-sm">Registrarse</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#1a2540] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-display font-700 text-sm uppercase tracking-widest text-[#6b7a9c]">
            Mundial Ticket · UCU 2026
          </span>
          <span className="text-xs text-[#6b7a9c]/60 font-mono">BD II · Obligatorio</span>
        </div>
      </footer>
    </div>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#6b7a9c]
                 hover:text-[#e8edf8] hover:bg-[#0d1529] transition-all duration-200
                 [&.active]:text-[#39ff14] [&.active]:bg-[#39ff1410]"
      activeProps={{ className: 'active' }}
    >
      {children}
    </Link>
  )
}
