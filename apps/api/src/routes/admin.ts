import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { roleGuard } from '../middleware/roles.js'
import * as estadioService from '../services/estadio.service.js'

const admin = new Hono()

admin.get('/estadios', authMiddleware, roleGuard('admin_por_pais_sede'), async (c) => {
  const user = c.get('user')
  const rows = await estadioService.estadiosDeAdmin(user.sub)
  return c.json(rows)
})

admin.post(
  '/estadios/:id_estadio/asignar',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('param', z.object({ id_estadio: z.coerce.number() })),
  async (c) => {
    const user = c.get('user')
    const { id_estadio } = c.req.valid('param')
    const row = await estadioService.asignarEstadioAdmin(user.sub, id_estadio)
    return c.json(row, 201)
  }
)

export default admin
