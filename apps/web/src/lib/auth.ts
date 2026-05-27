const TOKEN_KEY = 'mt_token'
const ROL_KEY = 'mt_rol'
const EMAIL_KEY = 'mt_email'

export type Rol = 'admin_por_pais_sede' | 'funcionario_de_validacion' | 'usuario_general'

export function saveAuth(token: string, rol: Rol, email: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROL_KEY, rol)
  localStorage.setItem(EMAIL_KEY, email)
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
}
