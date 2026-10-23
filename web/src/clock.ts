export function formatTime(d: Date, h24: boolean): string {
  const m = String(d.getMinutes()).padStart(2, '0')
  if (h24) return `${String(d.getHours()).padStart(2, '0')}:${m}`
  return `${d.getHours() % 12 || 12}:${m}`
}

export function msToNextMinute(d: Date): number {
  return 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds())
}
