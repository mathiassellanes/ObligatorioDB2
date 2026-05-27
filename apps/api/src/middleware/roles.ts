import type { Context, Next } from 'hono'
import type { TokenPayload } from '@repo/shared'

type Variables = { user: TokenPayload }

export function roleGuard(...roles: TokenPayload['rol'][]) {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    const user = c.get('user')
    if (!user || !roles.includes(user.rol)) {
      return c.json({ error: 'Sin permisos para esta acción' }, 403)
    }
    await next()
  }
}
