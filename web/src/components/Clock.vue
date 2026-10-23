<script setup lang="ts">
defineProps<{ time: string; date: string }>()
</script>

<template>
  <header class="clock">
    <div data-test="clock" class="time">{{ time }}</div>
    <div data-test="date" class="date">{{ date }}</div>
  </header>
</template>

<style scoped>
.time {
  font-size: 96px;
  font-weight: 300;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
.date {
  margin-top: 10px;
  font-size: 22px;
  font-weight: 500;
  opacity: 0.85;
}
</style>
