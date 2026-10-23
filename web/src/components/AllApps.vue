<script setup lang="ts">
import { computed } from 'vue'
import type { AppInfo } from '../bridge'
import { GRID_COLS } from '../focus'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ apps: AppInfo[]; focused: number }>()

const ROW_HEIGHT = 112
// Keep the focused row in view: from the third row on, slide the grid up.
const offset = computed(() => Math.max(0, Math.floor(props.focused / GRID_COLS) - 1) * ROW_HEIGHT)
</script>

<template>
  <section data-test="grid" class="overlay">
    <h1>All apps</h1>
    <div class="viewport">
      <ul class="grid" :style="{ transform: `translateY(${-offset}px)` }">
        <li v-for="(app, i) in apps" :key="app.pkg" class="tile focusable" :class="{ 'is-focused': focused === i }">
          <AppIcon :name="app.name" :icon="app.icon" />
          <span class="name">{{ app.name }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  padding: 32px 40px 0;
  background: rgba(10, 12, 14, 0.72);
  backdrop-filter: blur(24px);
}
h1 {
  margin: 0 0 20px;
  font-size: 22px;
  font-weight: 600;
}
.viewport {
  height: 440px;
  overflow: hidden;
}
.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: 104px;
  gap: 8px;
  margin: 0;
  padding: 4px;
  list-style: none;
  transition: transform 0.2s ease-out;
}
.tile {
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.name {
  position: relative;
  max-width: 150px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
