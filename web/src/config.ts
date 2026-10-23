// Everything you'd normally want to change lives here.

export interface DockEntry {
  name: string
  pkg: string
}

export const config: { dock: DockEntry[]; clock24h: boolean; wallpaper: string } = {
  // Shown left to right. Apps that aren't installed are skipped.
  dock: [
    { name: 'Netflix', pkg: 'com.netflix.ninja' },
    { name: 'Disney+', pkg: 'com.disney.disneyplus' },
    { name: 'Max', pkg: 'com.wbd.stream' },
    { name: 'Jellyfin', pkg: 'org.jellyfin.androidtv' },
    { name: 'SmartTube', pkg: 'org.smarttube.stable' },
    { name: 'Spotify', pkg: 'com.spotify.tv.android' },
  ],
  clock24h: true,
  // Drop a JPG into web/public/ and point at it here.
  wallpaper: './wallpaper.jpg',
}
