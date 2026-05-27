# Roadmap — Obligatorio BD2 2026

Sistema de ticketing dinámico para el Mundial 2026.
Stack: pnpm monorepo · Hono · postgres.js · React · Vite · TanStack Router · Zod

---

## Fase 0 — Scaffolding del monorepo
- [ ] Init pnpm workspaces
- [ ] `tsconfig.base.json`
- [ ] `packages/shared` vacío con package.json
- [ ] `apps/api` vacío con package.json
- [ ] `apps/web` vacío con package.json
- [ ] `.gitignore` raíz

## Fase 1 — Shared: Zod schemas
- [ ] Schema Perfil, Telefono
- [ ] Schema roles: admin_por_pais_sede, funcionario_de_validacion, usuario_general
- [ ] Schema Equipo, Estadio, Sector, Evento
- [ ] Schema Sector_Evento
- [ ] Schema Comision, Venta, Entrada
- [ ] Schema QR, Transferencia
- [ ] Schema asignado_a, gestiona, Dispositivo
- [ ] DTOs de request/response exportados

## Fase 2 — DB: Migrations SQL
- [ ] `001_init.sql` con todas las tablas y constraints
- [ ] `client.ts` instancia postgres.js
- [ ] Script `migrate.ts` para correr migrations
- [ ] Seed básico (equipos, estadios, admin)

## Fase 3 — Auth
- [ ] POST /auth/register
- [ ] POST /auth/login
- [ ] JWT con jose (access token)
- [ ] Middleware `authMiddleware` — verifica token
- [ ] Middleware `roleGuard(role)` — verifica rol

## Fase 4 — API: Infraestructura (Admin)
- [ ] GET/POST/PUT/DELETE /estadios
- [ ] GET/POST /estadios/:id/sectores
- [ ] GET/POST /equipos
- [ ] GET/POST /eventos (con validación sin superposición de horarios)
- [ ] POST /eventos/:id/sectores — habilitar sectores por evento
- [ ] GET /admin/gestiona — estadios asignados al admin

## Fase 5 — API: Ventas y Entradas
- [ ] POST /ventas — comprar entradas (max 5, calcula comisión)
- [ ] GET /ventas — mis compras
- [ ] GET /entradas — mis entradas actuales
- [ ] GET /entradas/:id — detalle entrada

## Fase 6 — API: Transferencias
- [ ] POST /transferencias — crear transferencia
- [ ] POST /transferencias/:id/aceptar
- [ ] POST /transferencias/:id/rechazar
- [ ] GET /transferencias — historial
- [ ] Validación max 3 transferencias por entrada

## Fase 7 — API: QR dinámico y Validación
- [ ] GET /qr/:entradaId — genera/rota QR (válido 30s)
- [ ] POST /validar — escaneo por dispositivo autorizado
- [ ] Registra código usado, funcionario, timestamp
- [ ] Marca entrada como consumida
- [ ] GET /funcionario/sectores — sectores asignados al funcionario

## Fase 8 — Web: Auth + Layout
- [ ] Página Login
- [ ] Página Register
- [ ] Layout con navbar según rol (usuario / admin / funcionario)
- [ ] Guards de ruta por rol
- [ ] Store de auth (JWT en localStorage)

## Fase 9 — Web: Usuario General
- [ ] Página Eventos — listado disponibles
- [ ] Página Evento — detalle + comprar entradas
- [ ] Modal compra — seleccionar sector, cantidad (max 5)
- [ ] Dashboard — mis entradas asignadas
- [ ] Vista QR — muestra QR con refresh automático cada 30s
- [ ] Página Compras — historial de ventas
- [ ] Página Transferencias — historial + transferir entrada

## Fase 10 — Web: Admin
- [ ] Gestión estadios y sectores
- [ ] Gestión eventos (crear, ver)
- [ ] Asignar funcionarios a sectores

## Fase 11 — Web: Funcionario
- [ ] Ver sectores asignados al evento
- [ ] Escanear / ingresar QR para validar entrada

## Fase 12 — Reportes (opcional)
- [ ] Eventos con más entradas vendidas
- [ ] Ranking de mayores compradores
- [ ] Panel estadísticas para admin

---

## Consideraciones técnicas

### Reglas de negocio críticas
- Max 5 entradas por venta
- Max 3 transferencias por entrada antes de validación
- No superposición de eventos en mismo estadio
- QR rota cada 30s, solo válido el activo
- Solo dispositivos autorizados (vinculados a funcionario) pueden validar
- Capacidad máxima por sector es hard limit

### Stack por app
| | Tecnología |
|---|---|
| Monorepo | pnpm workspaces |
| Schemas | Zod (packages/shared) |
| Backend | Hono + postgres.js |
| Auth | jose (JWT) |
| Frontend | React + Vite |
| Routing web | TanStack Router |
| Data fetching | TanStack Query |
| UI | shadcn/ui |
| DB | PostgreSQL |
