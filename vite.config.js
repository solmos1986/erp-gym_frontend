/* eslint-disable prettier/prettier */
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { PrimeVueResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    Components({
      resolvers: [PrimeVueResolver()]
    })
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  server: {
    proxy: {
      '/treasury': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  },

  // 🔥 ELIMINAR CONSOLE SOLO EN PRODUCCIÓN
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : []
  }
}))
