import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import authRoutes from './routes/auth.js'
import estadiosRoutes from './routes/estadios.js'
import equiposRoutes from './routes/equipos.js'
import eventosRoutes from './routes/eventos.js'
import adminRoutes from './routes/admin.js'
import ventasRoutes from './routes/ventas.js'
import entradasRoutes from './routes/entradas.js'
import transferenciasRoutes from './routes/transferencias.js'
import qrRoutes from './routes/qr.js'
import reportesRoutes from './routes/reportes.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173' }))

app.get('/health', (c) => c.json({ ok: true }))
app.route('/auth', authRoutes)
app.route('/estadios', estadiosRoutes)
app.route('/equipos', equiposRoutes)
app.route('/eventos', eventosRoutes)
app.route('/admin', adminRoutes)
app.route('/ventas', ventasRoutes)
app.route('/entradas', entradasRoutes)
app.route('/transferencias', transferenciasRoutes)
app.route('/qr', qrRoutes)
app.route('/reportes', reportesRoutes)

const port = Number(process.env['PORT'] ?? 3000)

serve({ fetch: app.fetch, port }, () => {
  console.log(`API running on http://localhost:${port}`)
})
