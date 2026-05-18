const ORDER_TYPES = {
  SAMPLE: 'sample',
  BULK: 'bulk',
};

const SAMPLE_STATUSES = [
  'pending_pay',
  'paid',
  'to_ship',
  'to_pickup',
  'completed',
  'cancelled',
];

const BULK_STATUSES = ['submitted', 'following', 'deal_closed', 'closed'];

const PAY_STATUSES = ['unpaid', 'paid', 'offline'];

const SAMPLE_STATUS_LABELS = {
  pending_pay: '待支付',
  paid: '已支付',
  to_ship: '待发货',
  to_pickup: '待自提',
  completed: '已完成',
  cancelled: '已取消',
};

const BULK_STATUS_LABELS = {
  submitted: '已提交',
  following: '跟进中',
  deal_closed: '已成交',
  closed: '已关闭',
};

function getStatusesForType(orderType) {
  return orderType === ORDER_TYPES.BULK ? BULK_STATUSES : SAMPLE_STATUSES;
}

module.exports = {
  ORDER_TYPES,
  SAMPLE_STATUSES,
  BULK_STATUSES,
  PAY_STATUSES,
  SAMPLE_STATUS_LABELS,
  BULK_STATUS_LABELS,
  getStatusesForType,
};
