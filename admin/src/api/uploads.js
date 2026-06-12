import request from '@/utils/request'

export function scanOrphans() {
  return request.get('/uploads/orphans')
}

export function deleteOrphans(paths) {
  return request.post('/uploads/orphans/delete', { paths })
}
