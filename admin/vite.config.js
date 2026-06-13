import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')

  // 开发代理目标（本机 API），与 api 服务 PORT 一致
  const apiTarget =
    env.VITE_DEV_API_TARGET?.replace(/\/+$/, '') ||
    'http://127.0.0.1:3000'

  const proxy = {
    '/api': {
      target: apiTarget,
      changeOrigin: true,
      secure: false,
    },
    '/uploads': {
      target: apiTarget,
      changeOrigin: true,
      secure: false,
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
