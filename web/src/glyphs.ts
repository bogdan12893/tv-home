// Small white icons shown next to the app names. Brand logos come from Simple Icons;
// Max and Disney+ are 48 px PNGs from Streamline (assets/glyphs/), drawn white through
// a CSS mask; Lucide line icons are there too.
// To add one: import it here, give it a name, and use that name as `glyph` in config.ts.
// A PNG needs a transparent background; 48 px is sharp at the TV's 24 px icon size.

import { Castle, Tv } from '@lucide/vue'
import { siJellyfin, siNetflix, siSpotify, siYoutube } from 'simple-icons'
import type { Component } from 'vue'
import disneyPlusPng from './assets/glyphs/disney-plus.png'
import maxPng from './assets/glyphs/max.png'

export type Glyph =
  | { kind: 'brand'; path: string }
  | { kind: 'line'; component: Component }
  | { kind: 'image'; url: string }

const brand = (icon: { path: string }): Glyph => ({ kind: 'brand', path: icon.path })

export const GLYPHS = {
  netflix: brand(siNetflix),
  max: { kind: 'image', url: maxPng } as Glyph,
  disneyplus: { kind: 'image', url: disneyPlusPng } as Glyph,
  jellyfin: brand(siJellyfin),
  youtube: brand(siYoutube),
  spotify: brand(siSpotify),
  castle: { kind: 'line', component: Castle } as Glyph,
  tv: { kind: 'line', component: Tv } as Glyph,
}

export type GlyphName = keyof typeof GLYPHS
