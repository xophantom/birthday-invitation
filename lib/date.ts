export type EventDateParts = {
  weekday: string
  day: string
  month: string
  year: string
  time: string
  full: string
}

export function formatEventDate(iso: string, timeZone: string): EventDateParts {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Data inválida: "${iso}". Use ISO 8601 com offset.`)
  }

  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('pt-BR', { timeZone, ...options }).format(date)

  return {
    weekday: part({ weekday: 'long' }),
    day: part({ day: '2-digit' }),
    month: part({ month: 'long' }),
    year: part({ year: 'numeric' }),
    time: part({ hour: '2-digit', minute: '2-digit' }),
    full: part({ dateStyle: 'full', timeStyle: 'short' }),
  }
}
