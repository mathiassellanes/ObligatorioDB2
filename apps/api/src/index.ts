import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import authRoutes from './routes/auth.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173' }))

app.get('/health', (c) => c.json({ ok: true }))
app.route('/auth', authRoutes)

const port = Number(process.env['PORT'] ?? 3000)
console.log(`API running on port ${port}`)

export default {
  port,
  fetch: app.fetch,
}
