# CLAUDE.md — Obligatorio BD2 2026

## Proyecto
Sistema de ticketing dinámico para el Mundial 2026 (UCU).
No usar ORMs. Todo SQL raw con postgres.js.

## Stack
- Monorepo: pnpm workspaces
- Backend: Hono + postgres.js + jose (JWT)
- Frontend: React + Vite + TanStack Router + TanStack Query + shadcn/ui
- Schemas: Zod en packages/shared (compartido entre api y web)
- DB: PostgreSQL

## Skills activos por contexto

### Antes de implementar una fase
- `writing-plans` — spec → plan antes de tocar código

### Al implementar
- `executing-plans` — ejecutar plan con checkpoints
- `test-driven-development` — lógica crítica: ventas, transferencias, QR

### Post-implementación
- `simplify` — limpiar código después de cada fase

### Frontend
- `frontend-design` — crear páginas/componentes nuevos
- `shadcn` — agregar/configurar componentes shadcn/ui
- `web-design-guidelines` — review UI antes de commit
- `vercel-react-best-practices` — optimización React

## Flujo por fase
writing-plans → implementar → simplify → web-design-guidelines (si hay UI) → commit

## Reglas de negocio críticas
- Max 5 entradas por venta
- Max 3 transferencias por entrada antes de validación
- Sin superposición de eventos en mismo estadio
- QR rota cada 30s, solo el activo es válido
- Solo dispositivos autorizados (vinculados a funcionario) validan entradas
- Capacidad máxima por sector es hard limit (no sobre-aforo)

## Estructura
```
apps/api/src/
  routes/     — validación con zValidator, llaman a services
  services/   — toda la lógica SQL va acá
  middleware/ — auth + roleGuard
  db/         — client.ts + migrations/

apps/web/src/
  routes/     — TanStack Router, una página por archivo
  components/ — shadcn/ui + componentes propios
  hooks/      — lógica reutilizable
  api/        — hono/client tipado

packages/shared/src/
  schemas/    — Zod schemas por entidad
  types/      — tipos inferidos (z.infer<>)
```

## Convenciones SQL
- Migrations en `apps/api/src/db/migrations/` nombradas `NNN_descripcion.sql`
- Queries en service files, nunca en routes
- Usar tagged templates de postgres.js: sql`SELECT ...`
- Nunca string concatenation en queries (SQL injection)
