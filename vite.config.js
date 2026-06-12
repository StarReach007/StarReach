import { defineConfig } from 'vite'

// Vite uses the root-level index.html as its entry point.
// Source modules live in js/ and styles in css/ (matches the Makefile lint targets).
export default defineConfig({
  server: { host: true },
  build: { outDir: 'dist' },
})
