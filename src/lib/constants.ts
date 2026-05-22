// 加油站AI智能营销官 - 常量定义

// Excel字段映射
export const FIELD_MAPPING: Record<string, string> = {
  '交易终端': 'terminal',
  '收银员工': 'cashier',
  '订单号': 'orderId',
  '油品': 'oilType',
  '油枪': 'gunNo',
  '单价': 'unitPrice',
  '加注数量': 'quantity',
  '订单金额': 'orderAmount',
  '优惠总额': 'discountTotal',
  '满减优惠': 'discountFullReduce',
  '优惠券优惠': 'discountCoupon',
  '抹零金额': 'discountRoundOff',
  '实付金额': 'actualAmount',
  '实付_微信支付': 'payWechat',
  '实付_支付宝': 'payAlipay',
  '实付_现金': 'payCash',
  '实付_储值卡': 'payStoredCard',
  '实付_银行卡支付': 'payBankCard',
  '付款类型': 'payType',
  '会员昵称': 'memberNickname',
  '付款用户': 'memberNickname',
  '车牌号码': 'carPlate',
  '交易时间': 'transactionTime',
  '油机联动': 'machineId',
  '通道商户号': 'merchantNo',
  '通道手续费': 'channelFee',
  '通道结算金额': 'channelSettleAmount',
  '优惠后单价': 'discountedPrice',
  '标签名称': 'memberTag',
  '手机号码': 'phone',
  '会员手机': 'phone',
  '电话号码': 'phone',
  '会员编码': 'memberCode',
  '卡号': 'memberCode',
};

// 油品类型
export const OIL_TYPES = ['0#', '92#', '95#'] as const;

// 支付方式
export const PAY_TYPES = [
  { key: '微信支付', field: 'payWechat' },
  { key: '支付宝', field: 'payAlipay' },
  { key: '储值卡', field: 'payStoredCard' },
  { key: '现金', field: 'payCash' },
  { key: '银行卡', field: 'payBankCard' },
] as const;

// 客户群类型配置
export const CUSTOMER_TYPE_CONFIG = {
  total: { name: '会员总数', color: '#3B82F6', description: '所有有客户标识的唯一客户数（手机号/会员编码/车牌）' },
  base: { name: '基本盘客户', color: '#10B981', description: '消费次数≥3 且 最后消费距数据截止日≤20天' },
  risk: { name: '流失风险客户', color: '#F59E0B', description: '消费次数≥2 且 最后消费距数据截止日≥20天且<30天' },
  churn: { name: '流失客户', color: '#EF4444', description: '消费次数≥2 且 最后消费距数据截止日≥30天' },
  random: { name: '随机客户', color: '#6B7280', description: '仅消费过1次的客户' },
  financialRisk: { name: '财务风险客户', color: '#DC2626', description: '单日消费≥2次 或 7天消费≥3次 或 消费多油品 且 升优惠力度异常高（疑似员工套现/代客支付）' },
} as const;

// 流失等级配置
export const CHURN_LEVEL_CONFIG = {
  A: { name: '高危流失', color: '#DC2626', priority: 5 },
  B: { name: '中危流失', color: '#EA580C', priority: 4 },
  C: { name: '低危流失', color: '#F59E0B', priority: 3 },
  D: { name: '休眠会员', color: '#6366F1', priority: 2 },
} as const;

// 风险等级配置
export const RISK_LEVEL_CONFIG = {
  high: { name: '高危', color: '#DC2626', bgColor: '#FEE2E2' },
  medium: { name: '中危', color: '#EA580C', bgColor: '#FFF7ED' },
  low: { name: '低危', color: '#F59E0B', bgColor: '#FFFBEB' },
} as const;

// 风险类型配置
export const RISK_TYPE_CONFIG = {
  employee_fraud: { name: '员工套现', level: 'high' as const },
  refund_fraud: { name: '回灌结算异常', level: 'high' as const },
  gun_machine_behavior: { name: '油枪机器行为', level: 'high' as const },
  quantity_anomaly: { name: '油量异常', level: 'medium' as const },
  discount_anomaly: { name: '优惠异常', level: 'medium' as const },
  night_anomaly: { name: '夜间异常', level: 'low' as const },
  non_business_time: { name: '非营业时间', level: 'low' as const },
} as const;

// 参照站配置
export const REFERENCE_STATIONS = {
  urban: {
    type: 'urban' as const,
    name: '城区站',
    avgDailySales: 520000,
    avgDailyQuantity: 7800,
    avgOrderAmount: 280,
    oilTypePercentage: { '0#': 12, '92#': 52, '95#': 36 },
    peakHours: [8, 9, 10, 17, 18, 19, 20],
  },
  suburban: {
    type: 'suburban' as const,
    name: '城郊站',
    avgDailySales: 650000,
    avgDailyQuantity: 10000,
    avgOrderAmount: 320,
    oilTypePercentage: { '0#': 18, '92#': 55, '95#': 27 },
    peakHours: [7, 8, 9, 11, 12, 13],
  },
  highway: {
    type: 'highway' as const,
    name: '国道站',
    avgDailySales: 950000,
    avgDailyQuantity: 15000,
    avgOrderAmount: 400,
    oilTypePercentage: { '0#': 8, '92#': 48, '95#': 44 },
    peakHours: [10, 11, 12, 13, 14, 15],
  },
  rural: {
    type: 'rural' as const,
    name: '乡镇站',
    avgDailySales: 320000,
    avgDailyQuantity: 5000,
    avgOrderAmount: 260,
    oilTypePercentage: { '0#': 35, '92#': 58, '95#': 7 },
    peakHours: [6, 7, 8, 11, 12, 17],
  },
} as const;

// 默认系统配置
export const DEFAULT_CONFIG = {
  churnDays: 30,
  baseCustomerMinOrders: 3,
  fraudThresholdMinutes: 30,
  fraudThresholdCount: 3,
  quantityAnomalyThreshold: 100,
  refundAnomalyThreshold: 10,
  nightAnomalyThreshold: 20,
  referenceStation: REFERENCE_STATIONS.urban,
  aiEnabled: {
    dailyReport: true,
    smartAlert: true,
    churnPrediction: true,
    marketingSuggestion: true,
  },
} as const;

// 时间常量
export const HOURS = Array.from({ length: 24 }, (_, i) => i);

// 预警阈值
export const ALERT_THRESHOLDS = {
  ordersDeviation: 0.3, // 订单数偏差30%预警
  amountDeviation: 0.3, // 金额偏差30%预警
  consecutiveDeclineDays: 3, // 连续下滑3天预警
  surgeRate: 0.5, // 突增50%
  dropRate: 0.3, // 突降30%
  stdDevMultiplier: 2, // 偏离均值2倍标准差
} as const;
