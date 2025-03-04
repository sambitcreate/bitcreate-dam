import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3091',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err) => {
            // eslint-disable-next-line no-console
            process.stderr.write(`proxy error: ${err}\n`);
          });
          proxy.on('proxyReq', (_proxyReq, req) => {
            // eslint-disable-next-line no-console
            process.stdout.write(`Sending Request to the Target: ${req.method} ${req.url}\n`);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            // eslint-disable-next-line no-console
            process.stdout.write(`Received Response from the Target: ${proxyRes.statusCode} ${req.url}\n`);
          });
        },
      } as ProxyOptions,
    },
  },
})
