/// <reference types="vitest/config" />
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  // Relative paths so the build works from the APK's asset folder.
  base: './',
  build: {
    outDir: '../android/app/src/main/assets/web',
    emptyOutDir: true,
  },
  // Reachable from the TV over the LAN in live mode.
  server: { host: true, port: 5173, strictPort: true },
  test: { environment: 'jsdom' },
})
