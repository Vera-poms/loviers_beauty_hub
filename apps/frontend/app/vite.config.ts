import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      "/api": {
        target: process.env.API_URL,
        changeOrigin: true,
        secure: process.env.API_URL?.startsWith('https') ?? false,
      }
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
})
