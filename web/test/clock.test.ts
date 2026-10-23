import { describe, expect, it } from 'vitest'
import { formatTime, msToNextMinute } from '../src/clock'

describe('clock', () => {
  it('24h pads', () => {
    expect(formatTime(new Date(2026, 9, 23, 9, 5), true)).toBe('09:05')
  })

  it('12h has no leading zero and no am/pm', () => {
    expect(formatTime(new Date(2026, 9, 23, 21, 5), false)).toBe('9:05')
    expect(formatTime(new Date(2026, 9, 23, 0, 30), false)).toBe('12:30')
  })

  it('ms to next minute', () => {
    expect(msToNextMinute(new Date(2026, 9, 23, 9, 5, 59, 500))).toBe(500)
  })
})
