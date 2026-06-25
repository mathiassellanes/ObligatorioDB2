// Parse a date-only string (YYYY-MM-DD or ISO from DB) at local noon to avoid
// UTC midnight shifting to the previous day in negative-offset timezones.
export function parseDate(fecha: unknown): Date {
  return new Date(String(fecha).slice(0, 10) + 'T12:00:00')
}

export function formatDate(fecha: unknown, opts?: Intl.DateTimeFormatOptions): string {
  return parseDate(fecha).toLocaleDateString('es-UY', opts ?? { day: 'numeric', month: 'short' })
}

export function todayStr(): string {
  return new Date().toLocaleDateString('sv')
}

export function dateStr(fecha: unknown): string {
  return String(fecha).slice(0, 10)
}
