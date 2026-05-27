import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ComprarEntradasDTO } from '@repo/shared'
import { authMiddleware } from '../middleware/auth.js'
import { roleGuard } from '../middleware/roles.js'
import * as ventaService from '../services/venta.service.js'

const ventas = new Hono()

ventas.post(
  '/',
  authMiddleware,
  roleGuard('usuario_general'),
  zValidator('json', ComprarEntradasDTO),
  async (c) => {
    const body = c.req.valid('json')
    const user = c.get('user')
    try {
      const result = await ventaService.comprar(user.sub, body)
      return c.json(result, 201)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400)
    }
  }
)

ventas.get('/', authMiddleware, roleGuard('usuario_general'), async (c) => {
  const user = c.get('user')
  const rows = await ventaService.misVentas(user.sub)
  return c.json(rows)
})

export default ventas
