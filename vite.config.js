import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function localApi() {
  return {
    name: 'e-plano-local-api',
    configureServer(server) {
      const api = require('./backend/server.js')
      server.middlewares.use('/api', api)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApi()],
})
