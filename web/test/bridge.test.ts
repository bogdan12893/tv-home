import { describe, expect, it } from 'vitest'
import { createBridge, mockBridge } from '../src/bridge'
import { config } from '../src/config'

const native = (listApps: () => string) =>
  ({ TvHome: { listApps, launch: () => true, openSettings() {} } }) as unknown as Window

describe('createBridge', () => {
  it('parses native JSON', () => {
    const w = native(() => '[{"name":"Max","pkg":"com.wbd.stream","icon":""}]')
    expect(createBridge(w).listApps()).toEqual([{ name: 'Max', pkg: 'com.wbd.stream', icon: '' }])
  })

  it('returns [] on bad native JSON', () => {
    expect(createBridge(native(() => 'nope')).listApps()).toEqual([])
  })

  it('falls back to mockBridge without window.TvHome', () => {
    expect(createBridge({} as Window)).toBe(mockBridge)
  })

  it('mock lists all six dock packages', () => {
    expect(mockBridge.listApps().map(a => a.pkg)).toEqual(
      expect.arrayContaining(config.dock.map(d => d.pkg)),
    )
  })
})
