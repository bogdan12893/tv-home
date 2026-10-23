<script setup lang="ts">
// Android's banner or icon when we have one, otherwise the app's first letter.
defineProps<{ name: string; icon: string }>()
</script>

<template>
  <img v-if="icon" class="art" :src="icon" alt="" />
  <span v-else class="art letter">{{ name.charAt(0) }}</span>
</template>

<style scoped>
.art {
  position: relative;
  display: block;
  width: 64px;
  height: 36px;
  object-fit: contain;
}
.letter {
  width: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 600;
  margin: 0 auto;
}
</style>
