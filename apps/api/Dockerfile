# API — Hono + postgres.js, ejecutado con tsx (sin build; resuelve @repo/shared TS)
FROM node:22-alpine
WORKDIR /app
RUN corepack enable

# Manifiestos primero para cachear la instalación de dependencias
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# Solo deps de la api (+ shared), sin las del frontend
RUN pnpm install --frozen-lockfile --filter api...

# Código fuente
COPY packages/shared packages/shared
COPY apps/api apps/api

WORKDIR /app/apps/api
EXPOSE 3000

# Aplica migraciones y luego levanta el servidor. Env viene de docker-compose,
# por eso se invoca tsx directo (no los scripts con --env-file=.env).
CMD ["sh", "-c", "pnpm exec tsx src/db/migrate.ts && pnpm exec tsx src/index.ts"]
