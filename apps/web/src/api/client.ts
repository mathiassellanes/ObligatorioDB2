import { getToken } from '@/lib/auth'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(extractError(body, res.status))
  }

  return res.json() as Promise<T>
}

type ErrorBody = {
  error?: unknown
  message?: string
}

type ZodIssue = { message: string; path?: (string | number)[] }

/**
 * Turn any error response into a readable string. Backends return either
 * `{ error: "mensaje" }` or, on Zod validation failure, the raw ZodError
 * (`{ error: { issues: [...] } }`) — stringifying the latter naively yields
 * "[object Object]", so we flatten the issue messages instead.
 */
function extractError(body: unknown, status: number): string {
  const b = body as ErrorBody | null
  if (b) {
    if (typeof b.error === 'string') return b.error
    const issues = (b.error as { issues?: ZodIssue[] })?.issues
    if (Array.isArray(issues) && issues.length > 0) {
      return issues.map((i) => i.message).join(' · ')
    }
    if (typeof b.message === 'string') return b.message
  }
  return `Error ${status}`
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) }),
}
