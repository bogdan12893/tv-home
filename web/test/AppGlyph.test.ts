import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppGlyph from '../src/components/AppGlyph.vue'

describe('AppGlyph', () => {
  it('draws an image glyph as a white mask of the file', () => {
    const el = mount(AppGlyph, { props: { name: 'max' } }).find('[data-test=glyph]')
    expect(el.classes()).toContain('mask')
    expect(el.attributes('style')).toMatch(/mask-image: url\(.*max.*\.png/)
  })

  it('draws brand glyphs as an svg path', () => {
    expect(mount(AppGlyph, { props: { name: 'netflix' } }).find('svg[data-test=glyph] path').exists()).toBe(true)
  })

  it('draws nothing without a name', () => {
    expect(mount(AppGlyph).find('[data-test=glyph]').exists()).toBe(false)
  })
})
