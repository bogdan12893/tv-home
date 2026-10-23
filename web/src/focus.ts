// Remote-control focus as a pure state machine, so it can be tested without a DOM.
// Areas: the dock along the bottom, the two top-right icons (0 = All apps,
// 1 = Settings), and the All apps grid overlay.

export type Area = 'dock' | 'top' | 'grid'
export interface FocusState {
  area: Area
  dock: number
  top: 0 | 1
  grid: number
}
export type Action = 'left' | 'right' | 'up' | 'down' | 'ok' | 'back' | 'resume'
export type Effect = { kind: 'launch'; from: 'dock' | 'grid'; index: number } | { kind: 'settings' } | null
export interface Sizes {
  dock: number
  grid: number
}

export const GRID_COLS = 5

export function initialFocus(sizes: Sizes): FocusState {
  return { area: sizes.dock > 0 ? 'dock' : 'top', dock: 0, top: 0, grid: 0 }
}

const KEYS: Record<string, Action> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', Enter: 'ok' }
const CODES: Record<number, Action> = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 13: 'ok', 23: 'ok' }

export function keyToAction(e: { key: string; keyCode: number }): Action | null {
  return KEYS[e.key] ?? CODES[e.keyCode] ?? null
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(n, max))

export function step(s: FocusState, a: Action, sizes: Sizes): { state: FocusState; effect: Effect } {
  const stay = { state: s, effect: null }
  const to = (patch: Partial<FocusState>) => ({ state: { ...s, ...patch }, effect: null })

  if (s.area === 'grid') {
    const last = sizes.grid - 1
    switch (a) {
      case 'back':
      case 'resume':
        return to({ area: 'dock', grid: 0 })
      case 'left':
        return to({ grid: clamp(s.grid - 1, last) })
      case 'right':
        return to({ grid: clamp(s.grid + 1, last) })
      case 'up':
        return s.grid >= GRID_COLS ? to({ grid: s.grid - GRID_COLS }) : stay
      case 'down':
        return s.grid + GRID_COLS <= last ? to({ grid: s.grid + GRID_COLS }) : stay
      case 'ok':
        return sizes.grid > 0 ? { state: s, effect: { kind: 'launch', from: 'grid', index: s.grid } } : stay
    }
  }

  if (s.area === 'top') {
    switch (a) {
      case 'left':
        return to({ top: 0 })
      case 'right':
        return to({ top: 1 })
      case 'down':
        return sizes.dock > 0 ? to({ area: 'dock' }) : stay
      case 'ok':
        return s.top === 0 ? to({ area: 'grid', grid: 0 }) : { state: s, effect: { kind: 'settings' } }
      default:
        return stay
    }
  }

  switch (a) {
    case 'left':
      return to({ dock: clamp(s.dock - 1, sizes.dock - 1) })
    case 'right':
      return to({ dock: clamp(s.dock + 1, sizes.dock - 1) })
    case 'up':
      return to({ area: 'top', top: 0 })
    case 'ok':
      return sizes.dock > 0 ? { state: s, effect: { kind: 'launch', from: 'dock', index: s.dock } } : stay
    default:
      return stay
  }
}
