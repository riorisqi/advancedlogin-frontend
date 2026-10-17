import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // `@/domain/...` instead of `../../../domain/...` (mirrors "paths" in tsconfig.app.json)
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // Forward /api/* to Spring Boot. The browser only ever talks to the Vite origin,
    // so there's no CORS, and cookies (SESSION, qr_bind, XSRF-TOKEN) behave like
    // they will in production behind a single domain.
    // BACKEND_URL lets you point at a second backend instance without editing this file.
    proxy: {
      '/api': process.env.BACKEND_URL ?? 'http://localhost:8080',
    },
  },
})
