# MundialTicket 2026

Sistema de ticketing dinámico para el Mundial 2026 — UCU BD2.

## Stack

- **Monorepo**: pnpm workspaces
- **Backend**: Hono + postgres.js + jose (JWT)
- **Frontend**: React + Vite + TanStack Router + TanStack Query + shadcn/ui
- **DB**: PostgreSQL 16

---

## Setup local (desarrollo)

### Requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL 16 corriendo localmente

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
```

Editar `apps/api/.env`:

```env
DATABASE_URL=postgres://usuario:password@localhost:5432/mundial2026
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=cualquier_secreto_largo
```

### 3. Crear la base de datos y correr migrations

```bash
# Crear la DB (si no existe)
createdb mundial2026

# Correr todas las migrations
pnpm --filter api migrate
```

### 4. Seed inicial (admin + estadios)

```bash
pnpm --filter api seed:admin
```

Crea el usuario admin por defecto:
- **Email**: `admin@mundial2026.com`
- **Password**: `admin123`

### 5. Levantar la app

En dos terminales:

```bash
# Terminal 1 — API (puerto 3000)
pnpm --filter api dev

# Terminal 2 — Web (puerto 5173)
pnpm --filter web dev
```

Abrir: http://localhost:5173

---

## Setup con Docker

### Requisitos

- Docker + Docker Compose

### Levantar todo

```bash
docker compose up --build
```

- Web: http://localhost:8080
- API: http://localhost:3000

Las migrations y el seed corren automáticamente al iniciar.

Variables de entorno opcionales (`.env` en la raíz):

```env
POSTGRES_USER=mundial
POSTGRES_PASSWORD=mundial
POSTGRES_DB=mundial2026
JWT_SECRET=change_me_in_production
```

---

## Tests

```bash
pnpm --filter api test
```

---

## Roles

| Rol | Acceso |
|-----|--------|
| `usuario_general` | Comprar entradas, transferir, ver QR |
| `admin_por_pais_sede` | Gestionar estadios, eventos, funcionarios |
| `funcionario_de_validacion` | Escanear QR en sectores asignados |

---

## Reglas de negocio

- Máx. 5 entradas por venta
- Máx. 3 transferencias por entrada (antes de ser consumida)
- Sin superposición de eventos en el mismo estadio
- QR rota cada 30s — solo el código activo es válido
- Solo dispositivos autorizados (vinculados a funcionario+evento) pueden validar
- Capacidad máxima por sector es hard limit
