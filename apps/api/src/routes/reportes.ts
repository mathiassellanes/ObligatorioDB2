import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { roleGuard } from '../middleware/roles.js'
import * as reportesService from '../services/reportes.service.js'

const reportes = new Hono()

reportes.get('/eventos-mas-vendidos', authMiddleware, roleGuard('admin_por_pais_sede'), async (c) => {
  const rows = await reportesService.eventosMasVendidos()
  return c.json(rows)
})

reportes.get('/ranking-compradores', authMiddleware, roleGuard('admin_por_pais_sede'), async (c) => {
  const rows = await reportesService.rankingCompradores()
  return c.json(rows)
})

export default reportes
