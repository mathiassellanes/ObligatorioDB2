import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Backend target — defaults to :3000, override with VITE_API_TARGET
// (e.g. when :3000 is taken by another local service).
const API_TARGET = process.env.VITE_API_TARGET ?? 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Permitir túneles de desarrollo (cloudflared / VS Code dev tunnels) para
    // probar en el celular con HTTPS (necesario para la cámara del scanner).
    allowedHosts: ['.trycloudflare.com', '.devtunnels.ms'],
    proxy: {
      '/api': {
        target: API_TARGET,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      '/realtime': {
        target: API_TARGET,
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
