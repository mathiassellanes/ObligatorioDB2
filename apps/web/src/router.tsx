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
import { isLoggedIn, getRol } from '@/lib/auth'

import { HomePage } from '@/pages/home'
import { LoginPage } from '@/pages/auth/login'
import { RegisterPage } from '@/pages/auth/register'
import { EventoDetailPage } from '@/pages/eventos/detail'
import { DashboardPage } from '@/pages/dashboard'
import { ComprasPage } from '@/pages/dashboard/compras'
import { QRPage } from '@/pages/dashboard/qr'
import { FuncionarioPage } from '@/pages/funcionario'
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

// Root
const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
})

// Public routes
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', component: RegisterPage })
const eventoRoute = createRoute({ getParentRoute: () => rootRoute, path: '/eventos/$id', component: EventoDetailPage })
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', component: DashboardPage })
const comprasRoute = createRoute({ getParentRoute: () => rootRoute, path: '/compras', component: ComprasPage })
const transferenciasRoute = createRoute({ getParentRoute: () => rootRoute, path: '/transferencias', component: TransferenciasPage })
const qrRoute = createRoute({ getParentRoute: () => rootRoute, path: '/qr/$id', component: QRPage })
const funcionarioRoute = createRoute({ getParentRoute: () => rootRoute, path: '/funcionario', component: FuncionarioPage })

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


// User layout (guard: must be logged in as usuario_general)
const userLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/u',
  component: UserLayout,
  beforeLoad: () => {
    if (!isLoggedIn()) throw redirect({ to: '/login' })
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

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  registerRoute,
  eventoRoute,
  dashboardRoute,
  comprasRoute,
  transferenciasRoute,
  qrRoute,
  funcionarioRoute,
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
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
