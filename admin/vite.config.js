import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const apiOrigin =
    env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3000'
  const assetOrigin =
    env.VITE_ASSET_BASE_URL?.replace(/\/+$/, '') || apiOrigin

  const proxy = {
    '/api': {
      target: apiOrigin,
      changeOrigin: true,
    },
    '/uploads': {
      target: assetOrigin,
      changeOrigin: true,
    },
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      proxy,
    },
    preview: {
      port: 4173,
      proxy,
    },
  }
})
