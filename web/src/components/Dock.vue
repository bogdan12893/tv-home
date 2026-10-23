<script setup lang="ts">
import type { DockItem } from '../dock'
import AppIcon from './AppIcon.vue'

defineProps<{ items: DockItem[]; focused: number | null }>()
</script>

<template>
  <ul class="dock glass">
    <li
      v-for="(item, i) in items"
      :key="item.pkg"
      data-test="dock-tile"
      class="tile focusable"
      :class="{ 'is-focused': focused === i }"
    >
      <AppIcon :name="item.name" :icon="item.icon" />
      <span class="name">{{ item.name }}</span>
    </li>
  </ul>
</template>

<style scoped>
.dock {
  position: absolute;
  left: 40px;
  right: 40px;
  bottom: 32px;
  display: flex;
  gap: 4px;
  padding: 8px;
  margin: 0;
  list-style: none;
}
.tile {
  flex: 1 1 0;
  height: 104px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.name {
  position: relative;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
}
</style>
