import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
})

request.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // #region agent log
  const resolvedUrl = `${config.baseURL || ''}${config.url || ''}`.replace(/([^:]\/)\/+/g, '$1')
  fetch('http://127.0.0.1:7330/ingest/418692a6-e25a-4dfd-af5a-2582b4c9bc43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ef1db7'},body:JSON.stringify({sessionId:'ef1db7',location:'request.js:request-interceptor',message:'axios outgoing request',data:{baseURL:config.baseURL,url:config.url,resolvedUrl,windowOrigin:typeof window!=='undefined'?window.location.origin:null,windowPort:typeof window!=='undefined'?window.location.port:null},timestamp:Date.now(),hypothesisId:'H3-H5'})}).catch(()=>{});
  // #endregion
  return config
})

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 0) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '网络错误'

    // #region agent log
    fetch('http://127.0.0.1:7330/ingest/418692a6-e25a-4dfd-af5a-2582b4c9bc43',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ef1db7'},body:JSON.stringify({sessionId:'ef1db7',location:'request.js:response-error',message:'axios response error',data:{status,message,errorCode:error.code,requestUrl:error.config?.url,baseURL:error.config?.baseURL,windowOrigin:typeof window!=='undefined'?window.location.origin:null},timestamp:Date.now(),hypothesisId:'H1-H2-H5'})}).catch(()=>{});
    // #endregion

    if (status === 401) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('admin')
      if (router.currentRoute.value.path !== '/login') {
        router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
      }
    }

    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default request
