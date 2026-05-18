export const ORDER_TYPES = {
  SAMPLE: 'sample',
  BULK: 'bulk',
}

export const SAMPLE_STATUS_LABELS = {
  pending_pay: '待支付',
  paid: '已支付',
  to_ship: '待发货',
  to_pickup: '待自提',
  completed: '已完成',
  cancelled: '已取消',
}

export const BULK_STATUS_LABELS = {
  submitted: '已提交',
  following: '跟进中',
  deal_closed: '已成交',
  closed: '已关闭',
}

export const PAY_STATUS_LABELS = {
  unpaid: '未支付',
  paid: '已支付',
  offline: '线下支付',
}

export function getStatusOptions(orderType) {
  const labels = orderType === ORDER_TYPES.BULK ? BULK_STATUS_LABELS : SAMPLE_STATUS_LABELS
  return Object.entries(labels).map(([value, label]) => ({ value, label }))
}

export function getStatusLabel(orderType, status) {
  const labels = orderType === ORDER_TYPES.BULK ? BULK_STATUS_LABELS : SAMPLE_STATUS_LABELS
  return labels[status] || status
}
