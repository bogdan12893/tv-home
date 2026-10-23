import type { AppInfo } from './bridge'
import type { DockEntry } from './config'
import type { GlyphName } from './glyphs'

export interface DockItem {
  name: string
  pkg: string
  icon: string
  glyph?: GlyphName
}

/** Dock entries in config order, minus the ones that aren't installed. */
export function resolveDock(entries: DockEntry[], installed: AppInfo[]): DockItem[] {
  const byPkg = new Map(installed.map(a => [a.pkg, a]))
  return entries.flatMap(e => {
    const app = byPkg.get(e.pkg)
    return app ? [{ name: e.name, pkg: e.pkg, icon: app.icon, glyph: e.glyph }] : []
  })
}

/** Every launchable app except this home screen, A to Z. */
export function gridApps(installed: AppInfo[], selfPkg: string): AppInfo[] {
  return installed
    .filter(a => a.pkg !== selfPkg)
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
}
