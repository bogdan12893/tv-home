// Everything you'd normally want to change lives here.

import type { GlyphName } from './glyphs'

export interface DockEntry {
  name: string
  pkg: string
  glyph?: GlyphName // small white icon next to the name, from glyphs.ts
}

export const config: { dock: DockEntry[]; clock24h: boolean; wallpaper: string } = {
  // The list on the left, top to bottom. Apps that aren't installed are skipped.
  dock: [
    { name: 'Netflix', pkg: 'com.netflix.ninja', glyph: 'netflix' },
    { name: 'Disney+', pkg: 'com.disney.disneyplus', glyph: 'sparkles' },
    { name: 'Max', pkg: 'com.wbd.stream', glyph: 'max' },
    { name: 'Jellyfin', pkg: 'org.jellyfin.androidtv', glyph: 'jellyfin' },
    { name: 'SmartTube', pkg: 'org.smarttube.stable', glyph: 'youtube' },
    { name: 'Spotify', pkg: 'com.spotify.tv.android', glyph: 'spotify' },
  ],
  clock24h: true,
  // Drop a JPG into web/public/ and point at it here.
  wallpaper: './wallpaper.jpg',
}
