<script setup lang="ts">
import type { DockItem } from '../dock'
import AppGlyph from './AppGlyph.vue'

defineProps<{ items: DockItem[]; focused: number | null }>()
</script>

<template>
  <ul class="list">
    <li
      v-for="(item, i) in items"
      :key="item.pkg"
      data-test="dock-tile"
      class="item"
      :class="{ 'is-focused': focused === i }"
    >
      <span class="row">
        <AppGlyph :name="item.glyph" />
        <span class="name">{{ item.name }}</span>
      </span>
    </li>
  </ul>
</template>

<style scoped>
/* Frosted panel holding the list. */
.list {
  min-width: 260px;
  margin: 0;
  padding: 10px;
  list-style: none;
  border-radius: 24px;
  background: rgba(20, 24, 26, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px) saturate(1.2);
}
.item {
  position: relative;
  padding: 6px 20px;
  border-radius: 16px;
}
/* The focused app gets a lighter frosted bar across the panel's full width. */
.item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
  opacity: 0;
  transition: opacity var(--ease);
}
.row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  opacity: 0.6;
  transition: opacity var(--ease);
}
.name {
  font-size: 30px;
  font-weight: 600;
  line-height: 1.25;
}
.item.is-focused::before,
.item.is-focused .row {
  opacity: 1;
}
</style>
