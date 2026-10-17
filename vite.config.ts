import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  // `bun run dev:lan`: https (the camera needs a secure context) on all interfaces, for a phone on the Wi-Fi.
  const lan = mode === 'lan'

  return {
    plugins: [react(), tailwindcss(), ...(lan ? [basicSsl()] : [])],
    resolve: {
      // mirrors "paths" in tsconfig.app.json
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      host: lan,
      // Bun crashes on WebSocket upgrades over HTTPS, which kills the dev server as soon as the
      // HMR client connects. In LAN mode: no WebSocket server, no HMR (refresh after changes).
      ...(lan ? { hmr: false, ws: false as const } : {}),
      // One origin for the browser: no CORS, and cookies behave as in production.
      proxy: {
        '/api': {
          target: process.env.BACKEND_URL ?? 'http://localhost:8080',
          // X-Forwarded-For, so the backend sees the real client IP instead of 127.0.0.1.
          xfwd: true,
        },
      },
    },
  }
})
