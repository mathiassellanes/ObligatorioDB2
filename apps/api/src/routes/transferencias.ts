import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { CrearTransferenciaDTO, ResponderTransferenciaDTO } from '@repo/shared'
import { authMiddleware } from '../middleware/auth.js'
import { roleGuard } from '../middleware/roles.js'
import * as transferenciaService from '../services/transferencia.service.js'

const transferencias = new Hono()

transferencias.post(
  '/',
  authMiddleware,
  roleGuard('usuario_general'),
  zValidator('json', CrearTransferenciaDTO),
  async (c) => {
    const body = c.req.valid('json')
    const user = c.get('user')
    try {
      const row = await transferenciaService.crear(user.sub, body)
      return c.json(row, 201)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400)
    }
  }
)

transferencias.post(
  '/:id/responder',
  authMiddleware,
  roleGuard('usuario_general'),
  zValidator('param', z.object({ id: z.coerce.number() })),
  zValidator('json', ResponderTransferenciaDTO),
  async (c) => {
    const { id } = c.req.valid('param')
    const { accion } = c.req.valid('json')
    const user = c.get('user')
    try {
      const result = await transferenciaService.responder(id, user.sub, accion)
      return c.json(result)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400)
    }
  }
)

transferencias.post(
  '/:id/cancelar',
  authMiddleware,
  roleGuard('usuario_general'),
  zValidator('param', z.object({ id: z.coerce.number() })),
  async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')
    try {
      const result = await transferenciaService.cancelar(id, user.sub)
      return c.json(result)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400)
    }
  }
)

transferencias.get('/', authMiddleware, roleGuard('usuario_general'), async (c) => {
  const user = c.get('user')
  const rows = await transferenciaService.historial(user.sub)
  return c.json(rows)
})

transferencias.get('/pendientes', authMiddleware, roleGuard('usuario_general'), async (c) => {
  const user = c.get('user')
  const rows = await transferenciaService.pendientesRecibidas(user.sub)
  return c.json(rows)
})

export default transferencias
