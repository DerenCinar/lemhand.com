import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    allowedHosts: ['dev.lemhand.com'],
    proxy: {
      '/api-bus': {
        target: 'https://api.511.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-bus/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // 1. Force the Encoding Header (CRITICAL for 511.org)
            proxyReq.setHeader('Accept-Encoding', 'gzip, deflate')

            // 2. Log to terminal to prove it's running
            console.log(`[Proxy] Sending request to 511.org with gzip header: ${req.url}`)
          })
        },
      }
    }
  } 
})
