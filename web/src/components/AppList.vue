<script setup lang="ts">
import type { DockItem } from '../dock'

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
      <span class="name">{{ item.name }}</span>
    </li>
  </ul>
</template>

<style scoped>
.list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.item {
  position: relative;
  width: max-content;
  padding: 3px 16px;
  margin-left: -16px;
  border-radius: 14px;
}
/* Unfocused names fade back; the focused one is bright on a soft glass pill. */
.item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(16px);
  opacity: 0;
  transition: opacity var(--ease);
}
.name {
  position: relative;
  display: block;
  font-size: 30px;
  font-weight: 600;
  line-height: 1.25;
  opacity: 0.55;
  transition: opacity var(--ease), transform var(--ease);
}
.item.is-focused::before,
.item.is-focused .name {
  opacity: 1;
}
.item.is-focused .name {
  transform: translateX(4px);
}
</style>
