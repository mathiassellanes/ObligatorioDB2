import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
} from '@tanstack/react-router'
import { RootLayout } from '@/components/layout/root-layout'
import { HomePage } from '@/pages/home'
import { LoginPage } from '@/pages/auth/login'
import { RegisterPage } from '@/pages/auth/register'
import { EventoDetailPage } from '@/pages/eventos/detail'
import { DashboardPage } from '@/pages/dashboard'
import { ComprasPage } from '@/pages/dashboard/compras'
import { TransferenciasPage } from '@/pages/dashboard/transferencias'
import { QRPage } from '@/pages/dashboard/qr'
import { AdminPage } from '@/pages/admin'
import { FuncionarioPage } from '@/pages/funcionario'

const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
})

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', component: RegisterPage })
const eventoRoute = createRoute({ getParentRoute: () => rootRoute, path: '/eventos/$id', component: EventoDetailPage })
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', component: DashboardPage })
const comprasRoute = createRoute({ getParentRoute: () => rootRoute, path: '/compras', component: ComprasPage })
const transferenciasRoute = createRoute({ getParentRoute: () => rootRoute, path: '/transferencias', component: TransferenciasPage })
const qrRoute = createRoute({ getParentRoute: () => rootRoute, path: '/qr/$id', component: QRPage })
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin', component: AdminPage })
const funcionarioRoute = createRoute({ getParentRoute: () => rootRoute, path: '/funcionario', component: FuncionarioPage })

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  registerRoute,
  eventoRoute,
  dashboardRoute,
  comprasRoute,
  transferenciasRoute,
  qrRoute,
  adminRoute,
  funcionarioRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
