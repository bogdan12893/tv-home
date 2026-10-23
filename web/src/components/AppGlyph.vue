<script setup lang="ts">
import { computed } from 'vue'
import { GLYPHS, type GlyphName } from '../glyphs'

const props = defineProps<{ name?: GlyphName }>()
const glyph = computed(() => (props.name ? GLYPHS[props.name] : undefined))
</script>

<template>
  <span class="box">
    <svg v-if="glyph?.kind === 'brand'" data-test="glyph" viewBox="0 0 24 24" fill="currentColor"><path :d="glyph.path" /></svg>
    <span
      v-else-if="glyph?.kind === 'image'"
      data-test="glyph"
      class="mask"
      :style="{ maskImage: `url(${glyph.url})` }"
    />
    <component :is="glyph.component" v-else-if="glyph" data-test="glyph" :size="26" :stroke-width="1.75" />
  </span>
</template>

<style scoped>
/* Fixed box, so names stay lined up even when an app has no icon. */
.box {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex: none;
}
svg {
  width: 24px;
  height: 24px;
}
/* The PNG's shape, filled with the text colour (white). */
.mask {
  width: 24px;
  height: 24px;
  background: currentColor;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}
</style>
