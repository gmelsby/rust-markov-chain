import wasm from "vite-plugin-wasm"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/chains/': {
        target: 'http://localhost:8080/',
        changeOrigin: true,
      }
    },
  }
})
