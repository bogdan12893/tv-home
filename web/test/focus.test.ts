import { describe, expect, it } from 'vitest'
import { initialFocus, keyToAction, step, type FocusState } from '../src/focus'

const S = { dock: 6, grid: 12 }

describe('focus', () => {
  it('starts on dock 0', () => {
    expect(initialFocus(S)).toEqual({ area: 'dock', dock: 0, top: 0, grid: 0 })
  })

  it('starts on top when dock is empty', () => {
    expect(initialFocus({ dock: 0, grid: 3 }).area).toBe('top')
  })

  it('clamps at dock ends', () => {
    let s = initialFocus(S)
    for (let i = 0; i < 20; i++) s = step(s, 'right', S).state
    expect(s.dock).toBe(5)
    s = step(s, 'left', S).state
    expect(s.dock).toBe(4)
    for (let i = 0; i < 20; i++) s = step(s, 'left', S).state
    expect(s.dock).toBe(0)
  })

  it('ok on dock launches', () => {
    expect(step({ ...initialFocus(S), dock: 2 }, 'ok', S).effect).toEqual({ kind: 'launch', from: 'dock', index: 2 })
  })

  it('up goes to top All apps, down returns to same dock index', () => {
    const up = step({ ...initialFocus(S), dock: 3 }, 'up', S).state
    expect(up).toMatchObject({ area: 'top', top: 0 })
    expect(step(up, 'down', S).state).toMatchObject({ area: 'dock', dock: 3 })
  })

  it('left and right move between the two top icons', () => {
    const top: FocusState = { ...initialFocus(S), area: 'top', top: 0 }
    expect(step(top, 'right', S).state.top).toBe(1)
    expect(step({ ...top, top: 1 }, 'right', S).state.top).toBe(1)
    expect(step({ ...top, top: 1 }, 'left', S).state.top).toBe(0)
  })

  it('down from top does nothing when dock is empty', () => {
    const e = { dock: 0, grid: 3 }
    expect(step(initialFocus(e), 'down', e).state.area).toBe('top')
  })

  it('ok on All apps opens grid at 0', () => {
    expect(step({ ...initialFocus(S), area: 'top', top: 0 }, 'ok', S).state).toMatchObject({ area: 'grid', grid: 0 })
  })

  it('ok on Settings emits settings', () => {
    expect(step({ ...initialFocus(S), area: 'top', top: 1 }, 'ok', S).effect).toEqual({ kind: 'settings' })
  })

  it('grid moves by GRID_COLS and clamps', () => {
    const g: FocusState = { ...initialFocus(S), area: 'grid', grid: 1 }
    expect(step(g, 'down', S).state.grid).toBe(6)
    expect(step({ ...g, grid: 11 }, 'down', S).state.grid).toBe(11)
    expect(step({ ...g, grid: 10 }, 'right', S).state.grid).toBe(11)
    expect(step({ ...g, grid: 11 }, 'right', S).state.grid).toBe(11)
    expect(step({ ...g, grid: 3 }, 'up', S).state.grid).toBe(3)
  })

  it('ok in grid launches the focused app', () => {
    expect(step({ ...initialFocus(S), area: 'grid', grid: 7 }, 'ok', S).effect).toEqual({ kind: 'launch', from: 'grid', index: 7 })
  })

  it('back and resume close grid to previous dock', () => {
    for (const a of ['back', 'resume'] as const) {
      expect(step({ area: 'grid', dock: 4, top: 0, grid: 7 }, a, S).state).toEqual({ area: 'dock', dock: 4, top: 0, grid: 0 })
    }
  })

  it('back from grid with an empty dock goes to top', () => {
    const e = { dock: 0, grid: 3 }
    for (const a of ['back', 'resume'] as const) {
      expect(step({ area: 'grid', dock: 0, top: 0, grid: 2 }, a, e).state).toEqual({ area: 'top', dock: 0, top: 0, grid: 0 })
    }
  })

  it('back on dock is a no-op', () => {
    const s = { ...initialFocus(S), dock: 2 }
    expect(step(s, 'back', S)).toEqual({ state: s, effect: null })
  })

  it('resume outside grid is a no-op', () => {
    const s = { ...initialFocus(S), dock: 2 }
    expect(step(s, 'resume', S)).toEqual({ state: s, effect: null })
  })

  it('maps keys', () => {
    expect(keyToAction({ key: 'ArrowLeft', keyCode: 37 })).toBe('left')
    expect(keyToAction({ key: 'ArrowDown', keyCode: 40 })).toBe('down')
    expect(keyToAction({ key: 'Enter', keyCode: 13 })).toBe('ok')
    expect(keyToAction({ key: '', keyCode: 23 })).toBe('ok')
    expect(keyToAction({ key: 'a', keyCode: 65 })).toBeNull()
  })
})
