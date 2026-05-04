import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/tickets': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/ai': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/notifications': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/notices': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/faqs': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
