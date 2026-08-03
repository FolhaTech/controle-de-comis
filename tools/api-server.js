#!/usr/bin/env node
import app from './api-app.js'

const DEFAULT_PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 4000
const PORT = Number.isFinite(DEFAULT_PORT) && DEFAULT_PORT > 0 ? DEFAULT_PORT : 4000

function startServer(port) {
  const server = app.listen(port, () => console.log(`API server listening on http://localhost:${port}`))
  server.on('error', (error) => {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
      const fallbackPort = port + 1
      console.warn(`Port ${port} is busy, trying ${fallbackPort}`)
      server.close(() => startServer(fallbackPort))
      return
    }

    console.error('Server error', error)
    process.exit(1)
  })
}

startServer(PORT)
