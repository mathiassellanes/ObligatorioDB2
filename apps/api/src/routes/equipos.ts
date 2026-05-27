import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CreateEquipoDTO } from '@repo/shared'
import { authMiddleware } from '../middleware/auth.js'
import { roleGuard } from '../middleware/roles.js'
import * as equipoService from '../services/equipo.service.js'

const equipos = new Hono()

equipos.get('/', async (c) => {
  const rows = await equipoService.listarEquipos()
  return c.json(rows)
})

equipos.post(
  '/',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('json', CreateEquipoDTO),
  async (c) => {
    const body = c.req.valid('json')
    try {
      const row = await equipoService.crearEquipo(body)
      return c.json(row, 201)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 409)
    }
  }
)

export default equipos
