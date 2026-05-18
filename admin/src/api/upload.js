import axios from 'axios'

export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  const token = sessionStorage.getItem('token')
  return axios
    .post('/api/upload', formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((res) => {
      if (res.data.code !== 0) {
        return Promise.reject(new Error(res.data.message))
      }
      return res.data
    })
}
