import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  // relatívne cesty: funguje na Verceli aj cez `npx serve dist` z USB
  base: './',
  resolve: {
    alias: {
      // exporty balíka monaco-editor pridávajú ku každej podceste „.js“,
      // takže CSS ikon (codicon) importujeme priamo zo súborov balíka
      '@monaco-esm': fileURLToPath(new URL('./node_modules/monaco-editor/esm/vs', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    // Phaser (~1,2 MB) a Monaco + TypeScript worker (~several MB) sú jednorazové
    // načítanie v učebni; Monaco sa načíta lenivo až po štarte hry
    chunkSizeWarningLimit: 8000,
  },
  worker: { format: 'es' },
})
