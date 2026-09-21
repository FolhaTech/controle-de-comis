#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const api = spawn(npmCommand, ['run', 'start:api'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
})

const web = spawn(npmCommand, ['run', 'dev:vite'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
})

const shutdown = () => {
  api.kill('SIGTERM')
  web.kill('SIGTERM')
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

api.on('exit', (code) => {
  if (code && code !== 0) {
    web.kill('SIGTERM')
    process.exit(code || 1)
  }
})

web.on('exit', (code) => {
  api.kill('SIGTERM')
  process.exit(code || 0)
})
