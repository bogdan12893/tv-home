// Small white icons shown next to the app names. Brand logos come from Simple Icons
// (CC0); Disney+ isn't in Simple Icons, so it uses the Lucide castle line icon (ISC).
// To add one: import it here, give it a name, and use that name as `glyph` in config.ts.

import { Castle } from '@lucide/vue'
import { siJellyfin, siMax, siNetflix, siSpotify, siYoutube } from 'simple-icons'
import type { Component } from 'vue'

export type Glyph = { kind: 'brand'; path: string } | { kind: 'line'; component: Component }

const brand = (icon: { path: string }): Glyph => ({ kind: 'brand', path: icon.path })

export const GLYPHS = {
  netflix: brand(siNetflix),
  max: brand(siMax),
  jellyfin: brand(siJellyfin),
  youtube: brand(siYoutube),
  spotify: brand(siSpotify),
  castle: { kind: 'line', component: Castle } as Glyph,
}

export type GlyphName = keyof typeof GLYPHS
