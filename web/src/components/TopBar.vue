<script setup lang="ts">
// Index 0 = All apps, 1 = Settings (matches focus.ts). Sits in the bottom-right corner.
defineProps<{ focused: number | null }>()
</script>

<template>
  <nav class="top">
    <div data-test="top-icon" class="icon focusable" :class="{ 'is-focused': focused === 0 }" aria-label="All apps">
      <svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" /></svg>
    </div>
    <div data-test="top-icon" class="icon focusable" :class="{ 'is-focused': focused === 1 }" aria-label="Settings">
      <svg viewBox="0 0 24 24"><path d="m9 3-.6 2.4-2 1.2L4 6l-2 3.5L3.8 11v2L2 14.5 4 18l2.4-.6 2 1.2L9 21h6l.6-2.4 2-1.2 2.4.6 2-3.5-1.8-1.5v-2L22 9.5 20 6l-2.4.6-2-1.2L15 3Z" /><circle cx="12" cy="12" r="3.2" /></svg>
    </div>
  </nav>
</template>

<style scoped>
.top {
  position: absolute;
  bottom: 36px;
  right: 46px;
  display: flex;
  gap: 8px;
}
.icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}
svg {
  position: relative;
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linejoin: round;
}
</style>
