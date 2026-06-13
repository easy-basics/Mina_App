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
      configure: (proxyInstance) => {
        proxyInstance.on('proxyReq', (proxyReq, req) => {
          // #region agent log
          fetch('http://127.0.0.1:7330/ingest/418692a6-e25a-4dfd-af5a-2582b4c9bc43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ef1db7'},body:JSON.stringify({sessionId:'ef1db7',location:'vite.config.js:proxyReq',message:'proxy forwarding request',data:{incomingUrl:req.url,proxyTarget:apiTarget,proxyHost:proxyReq.getHeader('host')},timestamp:Date.now(),hypothesisId:'H2-H4'})}).catch(()=>{});
          // #endregion
        })
        proxyInstance.on('error', (err, req) => {
          // #region agent log
          fetch('http://127.0.0.1:7330/ingest/418692a6-e25a-4dfd-af5a-2582b4c9bc43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ef1db7'},body:JSON.stringify({sessionId:'ef1db7',location:'vite.config.js:proxyError',message:'proxy error',data:{incomingUrl:req?.url,proxyTarget:apiTarget,errorCode:err?.code,errorMessage:err?.message},timestamp:Date.now(),hypothesisId:'H2-H4'})}).catch(()=>{});
          // #endregion
        })
      },
    },
    '/uploads': {
      target: apiTarget,
      changeOrigin: true,
      secure: false,
    },
  }

  // #region agent log
  fetch('http://127.0.0.1:7330/ingest/418692a6-e25a-4dfd-af5a-2582b4c9bc43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ef1db7'},body:JSON.stringify({sessionId:'ef1db7',location:'vite.config.js:init',message:'vite config loaded',data:{mode,apiTarget,viteApiBaseUrl:env.VITE_API_BASE_URL||null},timestamp:Date.now(),hypothesisId:'H3-H4'})}).catch(()=>{});
  // #endregion

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
