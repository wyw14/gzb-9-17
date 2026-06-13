import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3349,
    proxy: {
      '/api': {
        target: 'http://localhost:3449',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3449',
        changeOrigin: true
      }
    }
  }
})
