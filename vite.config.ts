import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      '@privy-io/react-auth',
      '@solana-program/memo',
      '@solana-program/system',
      '@solana-program/token',
    ],
  },
  resolve: {
    alias: {
      '@solana-program/memo': '@solana-program/memo',
      '@solana-program/system': '@solana-program/system',
      '@solana-program/token': '@solana-program/token',
    },
  },
  server: {
    proxy: {
      '/api/jupiter/price': {
        target: 'https://lite-api.jup.ag',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api\/jupiter/, '')
          console.log(`Proxying Price API: ${path} -> ${newPath}`)
          return newPath
        },
        secure: false,
      },
      '/api/jupiter': {
        target: 'https://api.jup.ag',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api\/jupiter/, '')
          console.log(`Proxying Portfolio API: ${path} -> ${newPath}`)
          return newPath
        },
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url)
          })
        },
      },
    },
  },
})
