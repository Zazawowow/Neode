import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8100,
    proxy: {
      '/rpc/v1': {
        target: process.env.BACKEND_URL || 'http://localhost:5959',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: (process.env.BACKEND_URL || 'ws://localhost:5959').replace('http', 'ws'),
        ws: true,
        changeOrigin: true,
      },
      '/public': {
        target: process.env.BACKEND_URL || 'http://localhost:5959',
        changeOrigin: true,
        secure: false,
      },
      '/rest': {
        target: process.env.BACKEND_URL || 'http://localhost:5959',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Output to dist for Docker builds, or to ../web/dist/neode-ui for local development
    outDir: process.env.DOCKER_BUILD === 'true' ? 'dist' : '../web/dist/neode-ui',
    emptyOutDir: true,
  },
})
