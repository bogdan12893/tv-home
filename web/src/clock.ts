export function formatTime(d: Date, h24: boolean): string {
  const m = String(d.getMinutes()).padStart(2, '0')
  if (h24) return `${String(d.getHours()).padStart(2, '0')}:${m}`
  return `${d.getHours() % 12 || 12}:${m}`
}

export function msToNextMinute(d: Date): number {
  return 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds())
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "Friday 23 October". Spelled out by hand so it doesn't depend on the WebView's locale data. */
export function formatDate(d: Date): string {
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}
