// 加油站AI智能营销官 - 类型定义

export interface Order {
  terminal: string; // 交易终端
  cashier: string; // 收银员工
  orderId: string; // 订单号
  oilType: string; // 油品 0#/92#/95#
  gunNo: string; // 油枪 1号枪/2号枪...
  unitPrice: number; // 单价
  quantity: number; // 加注数量
  orderAmount: number; // 订单金额
  discountTotal: number; // 优惠总额
  discountFullReduce: number; // 满减优惠
  discountCoupon: number; // 优惠券优惠
  discountRoundOff: number; // 抹零金额
  actualAmount: number; // 实付金额
  payWechat: number; // 微信支付
  payAlipay: number; // 支付宝
  payCash: number; // 现金
  payStoredCard: number; // 储值卡
  payBankCard: number; // 银行卡支付
  payType: string; // 付款类型
  memberNickname: string; // 会员昵称
  carPlate: string; // 车牌号码
  transactionTime: Date; // 交易时间
  machineId: string; // 油机联动
  merchantNo: string; // 通道商户号
  channelFee: number; // 通道手续费
  channelSettleAmount: number; // 通道结算金额
  discountedPrice: number; // 优惠后单价
  memberTag: string; // 标签名称
  hour: number; // 小时（计算字段）
  phone?: string; // 手机号码
  memberCode?: string; // 会员编码
}

// 客户分类
export type CustomerType = 'total' | 'base' | 'risk' | 'churn' | 'random' | 'financialRisk';

export interface CustomerSegment {
  type: CustomerType;
  name: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

// 客户数据（以客户标识为唯一标识，手机号或会员编码）
export interface Customer {
  customerId: string; // 客户标识（手机号或会员编码）
  phone?: string; // 手机号码（可选）
  memberCode?: string; // 会员编码（可选）
  carPlate?: string; // 车牌号（可选）
  name?: string; // 客户名称
  totalOrders: number;
  totalAmount: number;
  avgOrderAmount: number;
  lastOrderDate: Date;
  daysSinceLastOrder: number;
  oilTypePreference: string[];
  customerType: CustomerType;
  churnLevel?: 'A' | 'B' | 'C' | 'D'; // 流失等级
  riskLevel?: 'high' | 'medium' | 'low'; // 风险等级
  riskScore?: number; // 综合风险评分
}

// 油品日销量（按油品类型分组的日销量）
export interface OilTypeDailySales {
  date: string;
  '92#': number;
  '95#': number;
  '98#': number;
  '0#': number;
  gasoline: number; // 汽油总计（92# + 95# + 98#）
  diesel: number; // 柴油（0#）
}

// 统计数据
export interface StatisticsData {
  // 按油品日均销量
  dailyAvgByOilType: {
    '92#': number;
    '95#': number;
    '98#': number;
    '0#': number;
  };
  // 核心指标
  avgOrderAmount: number; // 客单价
  avgOrderQuantity: number; // 客单升
  avgDiscountCost: number; // 升油优惠成本
  // 数据周期
  totalDays: number;
  dateRange: { start: Date; end: Date };
}

// 销售概况
export interface SalesOverview {
  totalOrders: number;
  totalQuantity: number;
  totalAmount: number;
  avgOrderAmount: number;
  dailyOrders: number;
  dailyQuantity: number;
  dailyAmount: number;
  dateRange: { start: Date; end: Date };
  comparisonRate: {
    orders: number;
    quantity: number;
    amount: number;
  };
  // 新增核心指标
  statistics: StatisticsData;
  oilTypeDailySales: OilTypeDailySales[];
}

// 日销售数据
export interface DailySales {
  date: string;
  orders: number;
  quantity: number;
  amount: number;
}

// 时段分析
export interface TimeSlotAnalysis {
  hour: number;
  orders: number;
  quantity: number;
  amount: number;
  isPeak: boolean;
  isValley: boolean;
}

// 油品分析
export interface OilTypeAnalysis {
  oilType: string;
  orders: number;
  quantity: number;
  amount: number;
  percentage: number;
}

// 油枪分析
export interface GunAnalysis {
  gunNo: string;
  orders: number;
  quantity: number;
  amount: number;
  avgQuantity: number;
  avgAmount: number;
  isEfficient: boolean;
}

// 支付方式分析
export interface PaymentAnalysis {
  payType: string;
  orders: number;
  amount: number;
  percentage: number;
}

// 财务风险
export interface RiskAlert {
  id: string;
  type: 'employee' | 'customer' | 'system';
  riskType: RiskType;
  level: 'high' | 'medium' | 'low';
  description: string;
  timestamp: Date;
  orderId: string;
  amount: number;
  person: string; // 员工或客户名称
  details: Record<string, any>;
}

export type RiskType =
  | 'employee_fraud' // 员工套现
  | 'refund_fraud' // 回灌结算异常
  | 'gun_machine_behavior' // 油枪机器行为
  | 'quantity_anomaly' // 油量异常
  | 'discount_anomaly' // 优惠异常
  | 'night_anomaly' // 夜间异常
  | 'non_business_time'; // 非营业时间

// 召回客户筛选条件
export interface RecallFilter {
  daysSinceLastOrder?: number; // 流失天数
  totalOrdersMin?: number; // 最小消费次数
  totalOrdersMax?: number;
  totalAmountMin?: number; // 累计金额下限
  totalAmountMax?: number;
  avgOrderAmountMin?: number;
  avgOrderAmountMax?: number;
  oilTypes?: string[]; // 油品偏好
  payTypes?: string[]; // 支付方式
  carPlatePrefix?: string; // 车牌号前缀
  memberTags?: string[]; // 会员标签
  excludeRandomCustomer?: boolean; // 排除随机客户
  churnLevels?: ('A' | 'B' | 'C' | 'D')[]; // 流失等级
}

// 召回客户
export interface RecallCustomer extends Customer {
  recallValue: number; // 召回价值评分
  recommendedAction?: string; // 建议操作
}

// 系统设置
export interface SystemConfig {
  // 分析条件配置
  churnDays: number; // 流失判定天数 默认30
  baseCustomerMinOrders: number; // 基本盘客户判定次数 默认3
  fraudThresholdMinutes: number; // 套现检测时间窗口 默认30
  fraudThresholdCount: number; // 套现检测笔数 默认3
  quantityAnomalyThreshold: number; // 油量异常阈值 默认100L
  refundAnomalyThreshold: number; // 回灌结算预警 默认10%
  nightAnomalyThreshold: number; // 夜间交易预警 默认20%

  // 参照站配置
  referenceStation: ReferenceStation;

  // AI能力配置
  aiEnabled: {
    dailyReport: boolean;
    smartAlert: boolean;
    churnPrediction: boolean;
    marketingSuggestion: boolean;
  };
}

export interface ReferenceStation {
  type: 'urban' | 'suburban' | 'highway' | 'rural';
  name: string;
  avgDailySales: number;
  avgDailyQuantity: number;
  avgOrderAmount: number;
  oilTypePercentage: {
    '0#': number;
    '92#': number;
    '95#': number;
  };
  peakHours: number[];
}

// AI日报
export interface DailyReport {
  date: string;
  overview: {
    totalAmount: number;
    totalQuantity: number;
    totalOrders: number;
    avgOrderAmount: number;
    comparisonRate: number;
  };
  alerts: RiskAlert[];
  churnPrediction: number;
  recommendations: string[];
  tomorrowForecast: string;
}

// 两站对比
export interface StationCompareResult {
  station1Name: string;
  station2Name: string;
  metrics: {
    name: string;
    value1: number;
    value2: number;
    diff: number;
    diffPercent: number;
    winner: 1 | 2 | 0; // 0平局
  }[];
  advantages: { station: 1 | 2; metric: string; diff: number }[];
  disadvantages: { station: 1 | 2; metric: string; diff: number }[];
  overallWinner: 1 | 2 | 0;
}
