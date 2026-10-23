import { describe, expect, it } from 'vitest'
import { SELF_PKG } from '../src/bridge'
import { gridApps, resolveDock } from '../src/dock'

describe('resolveDock', () => {
  it('keeps config order and names, uses installed icon', () => {
    const installed = [
      { name: 'Netflix TV', pkg: 'n', icon: 'data:n' },
      { name: 'HBO', pkg: 'm', icon: '' },
    ]
    expect(resolveDock([{ name: 'Max', pkg: 'm' }, { name: 'Netflix', pkg: 'n' }], installed)).toEqual([
      { name: 'Max', pkg: 'm', icon: '' },
      { name: 'Netflix', pkg: 'n', icon: 'data:n' },
    ])
  })

  it('drops entries that are not installed', () => {
    expect(resolveDock([{ name: 'Max', pkg: 'm' }], [])).toEqual([])
  })
})

describe('gridApps', () => {
  it('excludes self and sorts case-insensitively', () => {
    const installed = [
      { name: 'vlc', pkg: 'v', icon: '' },
      { name: 'Home', pkg: SELF_PKG, icon: '' },
      { name: 'Amazon', pkg: 'a', icon: '' },
    ]
    expect(gridApps(installed, SELF_PKG).map(a => a.name)).toEqual(['Amazon', 'vlc'])
  })
})
