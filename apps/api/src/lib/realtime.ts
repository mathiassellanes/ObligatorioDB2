import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'node:http'
import type { Duplex } from 'node:stream'
import { verifyToken } from './jwt.js'

// In-memory registry of live sockets per user email. A user can have several
// tabs/devices open, hence a Set per email. Fine for a single-process app.
const clients = new Map<string, Set<WebSocket>>()

const wss = new WebSocketServer({ noServer: true })

function add(email: string, ws: WebSocket) {
  let set = clients.get(email)
  if (!set) { set = new Set(); clients.set(email, set) }
  set.add(ws)
}

function remove(email: string, ws: WebSocket) {
  const set = clients.get(email)
  if (!set) return
  set.delete(ws)
  if (set.size === 0) clients.delete(email)
}

/**
 * Attach the WebSocket upgrade handler to the HTTP server. Clients connect to
 * `/ws?token=<JWT>`; the token is verified and the socket is bound to that
 * user's email so we can push them validation events.
 */
export function attachRealtime(server: Server) {
  server.on('upgrade', (req, socket: Duplex, head) => {
    const url = new URL(req.url ?? '', 'http://localhost')
    if (url.pathname !== '/ws') return // let other upgrade handlers deal with it

    const token = url.searchParams.get('token')
    if (!token) { socket.destroy(); return }

    verifyToken(token)
      .then((payload) => {
        wss.handleUpgrade(req, socket, head, (ws) => {
          const email = payload.sub
          add(email, ws)
          ws.on('close', () => remove(email, ws))
          ws.on('error', () => remove(email, ws))
        })
      })
      .catch(() => socket.destroy())
  })
}

export type ValidacionEvent = {
  type: 'entrada_validada'
  id_entrada: number
  nombre_sector: string
  nombre_estadio: string
  nombre_equipo_local: string
  nombre_equipo_visitante: string
}

/** Push a validation event to every live socket of the entrada's owner. */
export function notificarValidacion(email: string, event: ValidacionEvent) {
  const set = clients.get(email)
  if (!set) return
  const msg = JSON.stringify(event)
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg)
  }
}
