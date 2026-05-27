import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { CreateEstadioDTO, CreateSectorDTO } from '@repo/shared'
import { authMiddleware } from '../middleware/auth.js'
import { roleGuard } from '../middleware/roles.js'
import * as estadioService from '../services/estadio.service.js'

const estadios = new Hono()

estadios.get('/', async (c) => {
  const rows = await estadioService.listarEstadios()
  return c.json(rows)
})

estadios.post(
  '/',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('json', CreateEstadioDTO),
  async (c) => {
    const body = c.req.valid('json')
    try {
      const row = await estadioService.crearEstadio(body)
      return c.json(row, 201)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 409)
    }
  }
)

estadios.get('/:id/sectores', zValidator('param', z.object({ id: z.coerce.number() })), async (c) => {
  const { id } = c.req.valid('param')
  const rows = await estadioService.listarSectores(id)
  return c.json(rows)
})

estadios.post(
  '/:id/sectores',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('param', z.object({ id: z.coerce.number() })),
  zValidator('json', CreateSectorDTO.omit({ id_estadio: true })),
  async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    try {
      const row = await estadioService.crearSector({ ...body, id_estadio: id })
      return c.json(row, 201)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400)
    }
  }
)

estadios.get('/:id', zValidator('param', z.object({ id: z.coerce.number() })), async (c) => {
  const { id } = c.req.valid('param')
  try {
    const row = await estadioService.getEstadioConSectores(id)
    return c.json(row)
  } catch (err) {
    return c.json({ error: (err as Error).message }, 404)
  }
})

estadios.get('/:id/eventos', zValidator('param', z.object({ id: z.coerce.number() })), async (c) => {
  const { id } = c.req.valid('param')
  const rows = await estadioService.eventosEnEstadio(id)
  return c.json(rows)
})

export default estadios
