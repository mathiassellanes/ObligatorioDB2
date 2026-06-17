import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { RootLayout } from '@/components/layout/root-layout'
import { AdminLayout } from '@/components/layout/admin-layout'
import { UserLayout } from '@/components/layout/user-layout'
import { isLoggedIn, getRol, useAuth } from '@/lib/auth'

import { HomePage } from '@/pages/home'
import { LoginPage } from '@/pages/auth/login'
import { RegisterPage } from '@/pages/auth/register'
import { EventoDetailPage } from '@/pages/eventos/detail'
import { EventosListPage } from '@/pages/eventos'
import { DashboardPage } from '@/pages/dashboard'
import { ComprasPage } from '@/pages/dashboard/compras'
import { QRPage } from '@/pages/dashboard/qr'
import { FuncionarioPage } from '@/pages/funcionario'
import { FuncionarioResultadoPage } from '@/pages/funcionario/resultado'
import { PerfilPage } from '@/pages/user/perfil'
import { EntradasPage } from '@/pages/user/entradas'
import { TransferenciasPage } from '@/pages/user/transferencias'

import { AdminEstadiosPage } from '@/pages/admin/estadios'
import { AdminEstadioDetailPage } from '@/pages/admin/estadios/detail'
import { AdminEventosPage } from '@/pages/admin/eventos'
import { AdminEventoDetailPage } from '@/pages/admin/eventos/detail'
import { AdminEquiposPage } from '@/pages/admin/equipos'
import { AdminEquipoDetailPage } from '@/pages/admin/equipos/detail'
import { AdminReportesPage } from '@/pages/admin/reportes'
import { AdminFuncionariosPage } from '@/pages/admin/funcionarios'
import { AdminDispositivosPage } from '@/pages/admin/dispositivos'

// Root
const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
})

// A validation officer's app is only the scanner + their profile. Keep them
// out of the public/buyer-facing pages by bouncing them to /funcionario.
// (Admins are intentionally allowed to browse the public site — their sidebar
// has a "Ver Sitio" link.)
function blockFuncionario() {
  if (getRol() === 'funcionario_de_validacion') {
    throw redirect({ to: '/funcionario' })
  }
}

// At "/", a logged-in buyer sees their dashboard; everyone else (logged-out,
// admins browsing the public site) sees the landing page.
function HomeOrDashboard() {
  const { loggedIn, rol } = useAuth()
  return loggedIn && rol === 'usuario_general' ? <DashboardPage /> : <HomePage />
}

// Public routes
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomeOrDashboard, beforeLoad: blockFuncionario })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', component: RegisterPage })
const eventosListRoute = createRoute({ getParentRoute: () => rootRoute, path: '/eventos', component: EventosListPage, beforeLoad: blockFuncionario })
const eventoRoute = createRoute({ getParentRoute: () => rootRoute, path: '/eventos/$id', component: EventoDetailPage, beforeLoad: blockFuncionario })
// Legacy path — dashboard now lives at "/".
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', beforeLoad: () => { throw redirect({ to: '/' }) }, component: DashboardPage })
const comprasRoute = createRoute({ getParentRoute: () => rootRoute, path: '/compras', component: ComprasPage, beforeLoad: blockFuncionario })
const transferenciasRoute = createRoute({ getParentRoute: () => rootRoute, path: '/transferencias', component: TransferenciasPage, beforeLoad: blockFuncionario })
const qrRoute = createRoute({ getParentRoute: () => rootRoute, path: '/qr/$id', component: QRPage, beforeLoad: blockFuncionario })

// Funcionario routes (guard: funcionario_de_validacion only)
const funcionarioLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/funcionario',
  component: Outlet,
  beforeLoad: () => {
    if (!isLoggedIn() || getRol() !== 'funcionario_de_validacion') {
      throw redirect({ to: '/login' })
    }
  },
})
const funcionarioRoute = createRoute({
  getParentRoute: () => funcionarioLayoutRoute,
  path: '/',
  component: FuncionarioPage,
})
const funcionarioResultadoRoute = createRoute({
  getParentRoute: () => funcionarioLayoutRoute,
  path: '/resultado',
  component: FuncionarioResultadoPage,
  validateSearch: (s: Record<string, unknown>) => ({
    codigo: String(s.codigo ?? ''),
    dispositivo: String(s.dispositivo ?? ''),
    sector: Number(s.sector ?? 0),
    evento: Number(s.evento ?? 0),
  }),
})

// Admin layout (guard: admin_por_pais_sede only)
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminLayout,
  beforeLoad: () => {
    if (!isLoggedIn() || getRol() !== 'admin_por_pais_sede') {
      throw redirect({ to: '/login' })
    }
  },
})

const adminIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  component: AdminEstadiosPage,
})
const adminEstadiosRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/estadios',
  component: AdminEstadiosPage,
})
const adminEstadioDetailRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/estadios/$id',
  component: AdminEstadioDetailPage,
})
const adminEventosRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/eventos',
  component: AdminEventosPage,
})
const adminEventoDetailRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/eventos/$id',
  component: AdminEventoDetailPage,
})
const adminEquiposRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/equipos',
  component: AdminEquiposPage,
})
const adminEquipoDetailRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/equipos/$id',
  component: AdminEquipoDetailPage,
})
const adminReportesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/reportes',
  component: AdminReportesPage,
})
const adminFuncionariosRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/funcionarios',
  component: AdminFuncionariosPage,
})
const adminDispositivosRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/dispositivos',
  component: AdminDispositivosPage,
})


// User layout (guard: must be logged in as usuario_general)
const userLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/u',
  component: UserLayout,
  beforeLoad: () => {
    if (!isLoggedIn()) throw redirect({ to: '/login' })
    blockFuncionario()
  },
})

const userPerfilRoute = createRoute({
  getParentRoute: () => userLayoutRoute,
  path: '/perfil',
  component: PerfilPage,
})
const userEntradasRoute = createRoute({
  getParentRoute: () => userLayoutRoute,
  path: '/entradas',
  component: EntradasPage,
})
const userTransferenciasRoute = createRoute({
  getParentRoute: () => userLayoutRoute,
  path: '/transferencias',
  component: TransferenciasPage,
})

// Funcionario perfil reuses PerfilPage under /u/perfil via a standalone route
const funcionarioPerfilRoute = createRoute({
  getParentRoute: () => funcionarioLayoutRoute,
  path: '/perfil',
  component: PerfilPage,
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  registerRoute,
  eventosListRoute,
  eventoRoute,
  dashboardRoute,
  comprasRoute,
  transferenciasRoute,
  qrRoute,
  funcionarioLayoutRoute.addChildren([
    funcionarioRoute,
    funcionarioResultadoRoute,
    funcionarioPerfilRoute,
  ]),
  userLayoutRoute.addChildren([
    userPerfilRoute,
    userEntradasRoute,
    userTransferenciasRoute,
  ]),
  adminLayoutRoute.addChildren([
    adminIndexRoute,
    adminEstadiosRoute,
    adminEstadioDetailRoute,
    adminEventosRoute,
    adminEventoDetailRoute,
    adminEquiposRoute,
    adminEquipoDetailRoute,
    adminReportesRoute,
    adminFuncionariosRoute,
    adminDispositivosRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
