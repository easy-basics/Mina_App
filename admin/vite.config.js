import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const apiOrigin =
    env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3000'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      // 开发若改回 baseURL=/api，可走代理
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiOrigin,
          changeOrigin: true,
        },
      },
    },
  }
})
