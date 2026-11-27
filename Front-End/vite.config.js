import process from 'node:process'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
const proxy = {
  '/api': {
    target: process.env.PORTFOLIO_API_PROXY_TARGET || 'http://127.0.0.1:3333',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api(?=\/|$)/, ''),
  },
}

export default defineConfig({
  server: { proxy },
  preview: { proxy },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
