import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { roleGuard } from '../middleware/roles.js'
import * as ventaService from '../services/venta.service.js'

const entradas = new Hono()

entradas.get('/', authMiddleware, roleGuard('usuario_general'), async (c) => {
  const user = c.get('user')
  const rows = await ventaService.misEntradas(user.sub)
  return c.json(rows)
})

entradas.get(
  '/:id',
  authMiddleware,
  roleGuard('usuario_general'),
  zValidator('param', z.object({ id: z.coerce.number() })),
  async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')
    try {
      const row = await ventaService.getEntrada(id, user.sub)
      return c.json(row)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 404)
    }
  }
)

export default entradas
