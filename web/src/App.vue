<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { createBridge, SELF_PKG, type Bridge } from './bridge'
import { formatDate, formatTime, msToNextMinute } from './clock'
import { config } from './config'
import { gridApps, resolveDock } from './dock'
import { initialFocus, keyToAction, step, type Action } from './focus'
import AllApps from './components/AllApps.vue'
import Clock from './components/Clock.vue'
import AppList from './components/AppList.vue'
import TopBar from './components/TopBar.vue'

const props = defineProps<{ bridge?: Bridge }>()
const bridge = props.bridge ?? createBridge()

const apps = ref(bridge.listApps())
const dock = computed(() => resolveDock(config.dock, apps.value))
const grid = computed(() => gridApps(apps.value, SELF_PKG))
const sizes = computed(() => ({ dock: dock.value.length, grid: grid.value.length }))
const focus = ref(initialFocus(sizes.value))

const now = ref(new Date())
const clock = computed(() => formatTime(now.value, config.clock24h))
const date = computed(() => formatDate(now.value))
let tickTimer: ReturnType<typeof setTimeout> | undefined
function scheduleTick() {
  clearTimeout(tickTimer)
  tickTimer = setTimeout(() => {
    now.value = new Date()
    scheduleTick()
  }, msToNextMinute(new Date()))
}

const toast = ref<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined
function showToast(text: string) {
  toast.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 3000)
}

const photoOk = ref(true)

function open(item: { name: string; pkg: string }) {
  if (!bridge.launch(item.pkg)) showToast(`Couldn't open ${item.name}`)
}

function apply(a: Action) {
  const { state, effect } = step(focus.value, a, sizes.value)
  focus.value = state
  if (effect?.kind === 'launch') open(effect.from === 'dock' ? dock.value[effect.index] : grid.value[effect.index])
  else if (effect?.kind === 'settings') bridge.openSettings()
}

function onKey(e: KeyboardEvent) {
  const a = keyToAction(e)
  if (!a) return
  e.preventDefault()
  apply(a)
}

function onBack() {
  apply('back')
}

// Back from an app, or woken from standby: the app list and the time may have changed.
function onResume() {
  apps.value = bridge.listApps()
  now.value = new Date()
  scheduleTick()
  apply('resume')
  const f = focus.value
  if (sizes.value.dock === 0 && f.area === 'dock') focus.value = { ...f, area: 'top', top: 0 }
  else if (f.dock >= sizes.value.dock) focus.value = { ...f, dock: Math.max(0, sizes.value.dock - 1) }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('tvhome:back', onBack)
  window.addEventListener('tvhome:resume', onResume)
  scheduleTick()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('tvhome:back', onBack)
  window.removeEventListener('tvhome:resume', onResume)
  clearTimeout(tickTimer)
  clearTimeout(toastTimer)
})
</script>

<template>
  <main class="home">
    <img v-if="photoOk" class="wallpaper" :src="config.wallpaper" alt="" @error="photoOk = false" />
    <div class="scrim" />
    <Clock class="corner" :time="clock" :date="date" />
    <div class="side">
      <AppList v-if="dock.length" :items="dock" :focused="focus.area === 'dock' ? focus.dock : null" />
      <p v-else data-test="empty-dock" class="empty">No apps yet. Press ▶ for All apps.</p>
    </div>
    <TopBar :focused="focus.area === 'top' ? focus.top : null" />
    <AllApps v-if="focus.area === 'grid'" :apps="grid" :focused="focus.grid" />
    <div v-if="toast" data-test="toast" class="toast glass">{{ toast }}</div>
  </main>
</template>
