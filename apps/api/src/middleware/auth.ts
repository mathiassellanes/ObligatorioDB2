import type { Context, Next } from 'hono'
import { verifyToken } from '../lib/jwt.js'
import type { TokenPayload } from '@repo/shared'

type Variables = { user: TokenPayload }

export async function authMiddleware(c: Context<{ Variables: Variables }>, next: Next) {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Token requerido' }, 401)
  }
  try {
    const token = header.slice(7)
    const payload = await verifyToken(token)
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Token inválido o expirado' }, 401)
  }
}
