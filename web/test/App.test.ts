import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import App from '../src/App.vue'
import type { AppInfo, Bridge } from '../src/bridge'

const ALL: AppInfo[] = [
  { name: 'Netflix', pkg: 'com.netflix.ninja', icon: '' },
  { name: 'Disney+', pkg: 'com.disney.disneyplus', icon: '' },
  { name: 'Max', pkg: 'com.wbd.stream', icon: '' },
  { name: 'Jellyfin', pkg: 'org.jellyfin.androidtv', icon: '' },
  { name: 'SmartTube', pkg: 'org.smarttube.stable', icon: '' },
  { name: 'Spotify', pkg: 'com.spotify.tv.android', icon: '' },
  { name: 'VLC', pkg: 'org.videolan.vlc', icon: '' },
]

function fakeBridge(apps: AppInfo[] = ALL, launchOk = true) {
  return {
    listApps: vi.fn(() => apps),
    launch: vi.fn(() => launchOk),
    openSettings: vi.fn(),
  } satisfies Bridge
}

const KEYS = {
  left: ['ArrowLeft', 37],
  right: ['ArrowRight', 39],
  up: ['ArrowUp', 38],
  down: ['ArrowDown', 40],
  ok: ['Enter', 13],
} as const

async function press(...names: (keyof typeof KEYS)[]) {
  for (const n of names) {
    const [key, keyCode] = KEYS[n]
    window.dispatchEvent(new KeyboardEvent('keydown', { key, keyCode }))
    await nextTick()
  }
}

async function fire(name: 'tvhome:back' | 'tvhome:resume') {
  window.dispatchEvent(new Event(name))
  await nextTick()
}

let w: VueWrapper | undefined

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 23, 8, 0))
})

afterEach(() => {
  w?.unmount()
  w = undefined
  vi.useRealTimers()
})

describe('App', () => {
  it('down then OK launches the second app in the list', async () => {
    const bridge = fakeBridge()
    w = mount(App, { props: { bridge } })
    await press('down', 'ok')
    expect(bridge.launch).toHaveBeenCalledWith('com.disney.disneyplus')
  })

  it('failed launch shows toast for 3 s', async () => {
    w = mount(App, { props: { bridge: fakeBridge(ALL, false) } })
    await press('ok')
    expect(w.find('[data-test=toast]').text()).toBe("Couldn't open Netflix")
    vi.advanceTimersByTime(3000)
    await nextTick()
    expect(w.find('[data-test=toast]').exists()).toBe(false)
  })

  it('hides dock apps that are not installed', () => {
    w = mount(App, { props: { bridge: fakeBridge([ALL[0], ALL[2]]) } })
    expect(w.findAll('[data-test=dock-tile] .name').map(t => t.text())).toEqual(['Netflix', 'Max'])
  })

  it('empty dock shows message and focuses All apps', () => {
    w = mount(App, { props: { bridge: fakeBridge([ALL[6]]) } })
    expect(w.find('[data-test=empty-dock]').text()).toBe('No apps yet. Press ▶ for All apps.')
    expect(w.findAll('[data-test=top-icon]')[0].classes()).toContain('is-focused')
  })

  it('Right, OK opens All apps; tvhome:back returns to the list', async () => {
    w = mount(App, { props: { bridge: fakeBridge() } })
    await press('down', 'down', 'right', 'ok')
    expect(w.find('[data-test=grid]').exists()).toBe(true)
    await fire('tvhome:back')
    expect(w.find('[data-test=grid]').exists()).toBe(false)
    expect(w.findAll('[data-test=dock-tile]')[2].classes()).toContain('is-focused')
  })

  it('Back from All apps with an empty dock focuses All apps again', async () => {
    w = mount(App, { props: { bridge: fakeBridge([ALL[6]]) } })
    await press('ok')
    expect(w.find('[data-test=grid]').exists()).toBe(true)
    await fire('tvhome:back')
    expect(w.findAll('[data-test=top-icon]')[0].classes()).toContain('is-focused')
  })

  it('OK in All apps launches the focused app', async () => {
    const bridge = fakeBridge()
    w = mount(App, { props: { bridge } })
    await press('right', 'ok', 'right', 'ok')
    // A to Z: Disney+, Jellyfin, ... → index 1 is Jellyfin
    expect(bridge.launch).toHaveBeenCalledWith('org.jellyfin.androidtv')
  })

  it('shows the date under the clock', () => {
    w = mount(App, { props: { bridge: fakeBridge() } })
    expect(w.find('[data-test=date]').text()).toBe('Friday 23 October')
  })

  it('each list item shows a white glyph, not the Android icon', () => {
    w = mount(App, { props: { bridge: fakeBridge() } })
    const tiles = w.findAll('[data-test=dock-tile]')
    expect(tiles.map(t => t.findAll('[data-test=glyph]').length)).toEqual([1, 1, 1, 1, 1, 1])
    expect(w.findAll('[data-test=dock-tile] img, [data-test=dock-tile] .letter')).toHaveLength(0)
  })

  it('tvhome:resume re-lists apps and refreshes clock', async () => {
    const bridge = fakeBridge()
    w = mount(App, { props: { bridge } })
    expect(w.find('[data-test=clock]').text()).toBe('08:00')
    vi.setSystemTime(new Date(2026, 9, 23, 9, 5))
    await fire('tvhome:resume')
    expect(w.find('[data-test=clock]').text()).toBe('09:05')
    expect(bridge.listApps).toHaveBeenCalledTimes(2)
  })

  it('resume after the focused app was uninstalled keeps focus on a real tile', async () => {
    const apps = [...ALL]
    const bridge = { ...fakeBridge(), listApps: vi.fn(() => [...apps]) }
    w = mount(App, { props: { bridge } })
    await press('down', 'down', 'down', 'down', 'down') // Spotify, the 6th item
    apps.splice(5, 1)
    await fire('tvhome:resume')
    const tiles = w.findAll('[data-test=dock-tile]')
    expect(tiles).toHaveLength(5)
    expect(tiles[4].classes()).toContain('is-focused')
  })

  it('clock ticks over on the minute', async () => {
    vi.setSystemTime(new Date(2026, 9, 23, 8, 0, 59, 0))
    w = mount(App, { props: { bridge: fakeBridge() } })
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(w.find('[data-test=clock]').text()).toBe('08:01')
  })

  it('Settings icon calls openSettings', async () => {
    const bridge = fakeBridge()
    w = mount(App, { props: { bridge } })
    await press('right', 'right', 'ok')
    expect(bridge.openSettings).toHaveBeenCalledTimes(1)
  })
})
