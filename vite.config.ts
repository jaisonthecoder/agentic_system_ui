import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Use the modern Dart Sass compiler API — avoids the legacy JS API
        // that caused the missing dep-Dnp7gl8U.js chunk error in dev server.
        api: 'modern-compiler' as const,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api':    'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/mcp':    'http://localhost:8000',
    },
  },
})
