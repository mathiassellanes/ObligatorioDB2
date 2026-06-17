import { useEffect, useRef } from 'react'
import { getToken } from '@/lib/auth'

export type ValidacionEvent = {
  type: 'entrada_validada'
  id_entrada: number
  nombre_sector: string
  nombre_estadio: string
  nombre_equipo_local: string
  nombre_equipo_visitante: string
}

/**
 * Subscribe to server-pushed validation events for the logged-in user. The
 * socket is authenticated via the JWT in the query string (browsers can't set
 * WS headers) and auto-reconnects if the connection drops.
 */
export function useValidacionWS(onEvent: (event: ValidacionEvent) => void) {
  const cb = useRef(onEvent)
  cb.current = onEvent

  useEffect(() => {
    const token = getToken()
    if (!token) return

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${proto}://${window.location.host}/ws?token=${token}`
    let ws: WebSocket | null = null
    let closed = false
    let retry: ReturnType<typeof setTimeout>

    function connect() {
      ws = new WebSocket(url)
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data?.type === 'entrada_validada') cb.current(data as ValidacionEvent)
        } catch { /* ignore malformed frames */ }
      }
      ws.onclose = () => { if (!closed) retry = setTimeout(connect, 3000) }
      ws.onerror = () => ws?.close()
    }
    connect()

    return () => {
      closed = true
      clearTimeout(retry)
      ws?.close()
    }
  }, [])
}
