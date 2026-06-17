import { useSyncExternalStore } from 'react'

const TOKEN_KEY = 'mt_token'
const ROL_KEY = 'mt_rol'
const EMAIL_KEY = 'mt_email'

export type Rol = 'admin_por_pais_sede' | 'funcionario_de_validacion' | 'usuario_general'

export type AuthState = {
  token: string | null
  rol: Rol | null
  email: string | null
  loggedIn: boolean
}

// --- Reactive store over localStorage ---
// localStorage mutations don't trigger React re-renders, so we keep a cached
// snapshot and notify subscribers whenever auth changes. Components read it via
// useAuth() (useSyncExternalStore) and re-render on login/logout.
const listeners = new Set<() => void>()

function readSnapshot(): AuthState {
  const token = localStorage.getItem(TOKEN_KEY)
  return {
    token,
    rol: localStorage.getItem(ROL_KEY) as Rol | null,
    email: localStorage.getItem(EMAIL_KEY),
    loggedIn: !!token,
  }
}

let snapshot: AuthState = readSnapshot()

function emit() {
  snapshot = readSnapshot()
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Keep tabs in sync when another tab logs in/out.
  const onStorage = () => emit()
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}

export function saveAuth(token: string, rol: Rol, email: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROL_KEY, rol)
  localStorage.setItem(EMAIL_KEY, email)
  emit()
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRol(): Rol | null {
  return localStorage.getItem(ROL_KEY) as Rol | null
}

export function getEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY)
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROL_KEY)
  localStorage.removeItem(EMAIL_KEY)
  emit()
}
