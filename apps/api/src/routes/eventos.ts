import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { CreateEventoDTO, HabilitarSectoresDTO } from '@repo/shared'
import { authMiddleware } from '../middleware/auth.js'
import { roleGuard } from '../middleware/roles.js'
import * as eventoService from '../services/evento.service.js'

const eventos = new Hono()

eventos.get('/', async (c) => {
  const rows = await eventoService.listarEventos()
  return c.json(rows)
})

eventos.get('/:id', zValidator('param', z.object({ id: z.coerce.number() })), async (c) => {
  const { id } = c.req.valid('param')
  try {
    const row = await eventoService.getEvento(id)
    return c.json(row)
  } catch (err) {
    return c.json({ error: (err as Error).message }, 404)
  }
})

eventos.post(
  '/',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('json', CreateEventoDTO),
  async (c) => {
    const body = c.req.valid('json')
    const user = c.get('user')
    try {
      const row = await eventoService.crearEvento(body, user.sub)
      return c.json(row, 201)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400)
    }
  }
)

eventos.post(
  '/:id/sectores',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('param', z.object({ id: z.coerce.number() })),
  zValidator('json', HabilitarSectoresDTO),
  async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const user = c.get('user')
    try {
      const rows = await eventoService.habilitarSectores(id, body, user.sub)
      return c.json(rows, 201)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400)
    }
  }
)

eventos.post(
  '/:id/asignar-funcionario',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('param', z.object({ id: z.coerce.number() })),
  zValidator('json', z.object({
    id_sector: z.number().int().positive(),
    numero_legajo: z.string().min(1),
  })),
  async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    try {
      const row = await eventoService.asignarFuncionario(id, body.id_sector, body.numero_legajo)
      return c.json(row, 201)
    } catch (err) {
      return c.json({ error: (err as Error).message }, 400)
    }
  }
)


eventos.get(
  '/:id/asignaciones',
  authMiddleware,
  roleGuard('admin_por_pais_sede'),
  zValidator('param', z.object({ id: z.coerce.number() })),
  async (c) => {
    const { id } = c.req.valid('param')
    const rows = await eventoService.getAsignaciones(id)
    return c.json(rows)
  }
)

export default eventos
