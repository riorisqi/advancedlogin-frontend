import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward /api/* to Spring Boot. The browser only ever talks to the Vite origin,
    // so there's no CORS, and cookies (SESSION, qr_bind, XSRF-TOKEN) behave like
    // they will in production behind a single domain.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
