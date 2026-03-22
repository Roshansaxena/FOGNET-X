import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Change to your backend URL/port
        changeOrigin: true,
        secure: false,
      },
      '/google_login': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
