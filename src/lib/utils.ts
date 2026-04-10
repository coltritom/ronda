/*
  Utilidades generales de la app.
*/

/**
 * Formatea una fecha ISO para mostrar en la UI.
 * Ej: "sábado 14 de junio · 20:00"
 */
export function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('es-AR', {
    weekday:  'long',
    day:      'numeric',
    month:    'long',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date)
}

/**
 * Formatea solo la fecha (sin hora).
 * Ej: "14 de junio de 2025"
 */
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day:      'numeric',
    month:    'long',
    year:     'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(dateStr))
}

/**
 * Devuelve true si la fecha ya pasó.
 */
export function isPast(dateStr: string): boolean {
  return new Date(dateStr) < new Date()
}
