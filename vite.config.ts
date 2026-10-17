import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `bun run dev:lan` (= vite --mode lan): reachable from a phone on the same Wi-Fi.
  // Phones only allow camera access (getUserMedia) on a *secure context*: https://, or
  // http://localhost, which the phone isn't. So LAN mode serves https with a self-signed cert.
  const lan = mode === 'lan'

  return {
    plugins: [react(), tailwindcss(), ...(lan ? [basicSsl()] : [])],
    resolve: {
      // `@/domain/...` instead of `../../../domain/...` (mirrors "paths" in tsconfig.app.json)
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      host: lan, // true = listen on all network interfaces, not just localhost
      // Forward /api/* to Spring Boot. The browser only ever talks to the Vite origin,
      // so there's no CORS, and cookies (SESSION, qr_bind, XSRF-TOKEN) behave like
      // they will in production behind a single domain.
      // BACKEND_URL lets you point at a second backend instance without editing this file.
      proxy: {
        '/api': {
          target: process.env.BACKEND_URL ?? 'http://localhost:8080',
          // Adds X-Forwarded-For/-Proto, so the backend sees the real client IP (shown on the
          // phone's approval screen) instead of the proxy's 127.0.0.1.
          xfwd: true,
        },
      },
    },
  }
})
