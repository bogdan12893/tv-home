<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <div class="clock">{{ text }}</div>
</template>

<style scoped>
.clock {
  position: absolute;
  top: 28px;
  left: 40px;
  font-size: 40px;
  font-weight: 500;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.25);
}
</style>
