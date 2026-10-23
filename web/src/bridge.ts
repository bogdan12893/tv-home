// The only way the page talks to Android. On the TV, the Kotlin app injects
// window.TvHome; in a desktop browser we fall back to mockBridge.

import { config } from './config'

export interface AppInfo {
  name: string
  pkg: string
  icon: string // data URL, or '' when Android gave us none
}

export interface Bridge {
  listApps(): AppInfo[]
  launch(pkg: string): boolean
  openSettings(): void
}

interface NativeTvHome {
  listApps(): string // JSON AppInfo[]
  launch(pkg: string): boolean
  openSettings(): void
}

export const SELF_PKG = 'dev.bogdan.tvhome'

const MOCK_APPS: AppInfo[] = [
  ...config.dock.map(d => ({ name: d.name, pkg: d.pkg, icon: '' })),
  { name: 'Google Play Store', pkg: 'com.android.vending', icon: '' },
  { name: 'TV Bro', pkg: 'com.phlox.tvwebbrowser', icon: '' },
  { name: 'VLC', pkg: 'org.videolan.vlc', icon: '' },
  { name: 'YouTube Music', pkg: 'com.google.android.youtube.tvmusic', icon: '' },
]

export const mockBridge: Bridge = {
  listApps: () => MOCK_APPS.map(a => ({ ...a })),
  launch(pkg) {
    console.log('[mock] launch', pkg)
    return true
  },
  openSettings() {
    console.log('[mock] open settings')
  },
}

export function createBridge(w: Window = window): Bridge {
  const native = (w as Window & { TvHome?: NativeTvHome }).TvHome
  if (!native) return mockBridge
  return {
    listApps() {
      try {
        const list = JSON.parse(native.listApps())
        return Array.isArray(list) ? list : []
      } catch {
        return []
      }
    },
    launch: pkg => native.launch(pkg),
    openSettings: () => native.openSettings(),
  }
}
