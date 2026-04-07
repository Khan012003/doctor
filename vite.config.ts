import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5009',
        changeOrigin: true
      },
      '/twilio-api': {
        target: 'https://api.twilio.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/twilio-api/, '')
      }
    }
  }
})
