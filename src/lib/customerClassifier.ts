// 加油站AI智能营销官 - 客户分类逻辑

import { Order, Customer, CustomerSegment, CustomerType, RecallFilter, RecallCustomer } from './types';
import { CUSTOMER_TYPE_CONFIG, CHURN_LEVEL_CONFIG } from './constants';
import dayjs from 'dayjs';

// 按电话号码聚合客户数据
export function aggregateCustomers(orders: Order[]): Customer[] {
  const customerMap = new Map<string, {
    phone: string;
    carPlate?: string;
    name?: string;
    totalOrders: number;
    totalAmount: number;
    lastOrderDate: Date;
    oilTypes: Set<string>;
  }>();

  orders.forEach(order => {
    // 优先使用电话号码作为唯一标识
    const phone = extractPhone(order);
    if (!phone) return; // 没有电话视为散客，跳过

    const existing = customerMap.get(phone) || {
      phone,
      carPlate: order.carPlate,
      name: order.memberNickname,
      totalOrders: 0,
      totalAmount: 0,
      lastOrderDate: new Date(0),
      oilTypes: new Set<string>(),
    };

    existing.totalOrders += 1;
    existing.totalAmount += order.actualAmount;
    existing.oilTypes.add(order.oilType);
    if (order.carPlate) existing.carPlate = order.carPlate;

    const orderDate = new Date(order.transactionTime);
    if (orderDate > existing.lastOrderDate) {
      existing.lastOrderDate = orderDate;
    }

    customerMap.set(phone, existing);
  });

  return Array.from(customerMap.values()).map(c => ({
    phone: c.phone,
    carPlate: c.carPlate,
    name: c.name,
    totalOrders: c.totalOrders,
    totalAmount: c.totalAmount,
    avgOrderAmount: c.totalOrders > 0 ? c.totalAmount / c.totalOrders : 0,
    lastOrderDate: c.lastOrderDate,
    daysSinceLastOrder: dayjs().diff(dayjs(c.lastOrderDate), 'day'),
    oilTypePreference: Array.from(c.oilTypes),
    customerType: 'total' as CustomerType,
  }));
}

// 从订单中提取手机号
function extractPhone(order: Order): string {
  // 优先使用子卡手机号
  if ((order as any).subCardPhone) {
    return (order as any).subCardPhone;
  }
  // 使用付款用户手机号
  if ((order as any).payUserPhone) {
    return (order as any).payUserPhone;
  }
  // 如果没有明确的电话字段，从车牌或会员昵称中无法提取，返回空
  return '';
}

// 分类客户
export function classifyCustomers(customers: Customer[], churnDays: number = 30, baseMinOrders: number = 3): CustomerSegment[] {
  const riskCustomerPhones = new Set<string>(); // TODO: 需要从风险检测模块获取

  let total = customers.length;
  let base = 0;
  let risk = 0;
  let churn = 0;
  let random = 0;

  customers.forEach(c => {
    if (riskCustomerPhones.has(c.phone)) {
      risk++;
      c.customerType = 'risk';
    } else if (c.totalOrders === 1) {
      random++;
      c.customerType = 'random';
    } else if (c.daysSinceLastOrder > churnDays && c.totalOrders >= 2) {
      churn++;
      c.customerType = 'churn';
    } else {
      base++;
      c.customerType = 'base';
    }
  });

  const calculatePercentage = (count: number) => total > 0 ? (count / total) * 100 : 0;

  return [
    { type: 'total', name: CUSTOMER_TYPE_CONFIG.total.name, count: total, percentage: 100, trend: 'stable', color: CUSTOMER_TYPE_CONFIG.total.color },
    { type: 'base', name: CUSTOMER_TYPE_CONFIG.base.name, count: base, percentage: calculatePercentage(base), trend: 'stable', color: CUSTOMER_TYPE_CONFIG.base.color },
    { type: 'risk', name: CUSTOMER_TYPE_CONFIG.risk.name, count: risk, percentage: calculatePercentage(risk), trend: risk > 0 ? 'up' : 'stable', color: CUSTOMER_TYPE_CONFIG.risk.color },
    { type: 'churn', name: CUSTOMER_TYPE_CONFIG.churn.name, count: churn, percentage: calculatePercentage(churn), trend: churn > 0 ? 'up' : 'stable', color: CUSTOMER_TYPE_CONFIG.churn.color },
    { type: 'random', name: CUSTOMER_TYPE_CONFIG.random.name, count: random, percentage: calculatePercentage(random), trend: 'stable', color: CUSTOMER_TYPE_CONFIG.random.color },
  ];
}

// 计算流失等级
export function calculateChurnLevel(customer: Customer): 'A' | 'B' | 'C' | 'D' {
  const days = customer.daysSinceLastOrder;
  const orders = customer.totalOrders;
  const amount = customer.totalAmount;

  // A级：高危流失 最后消费>60天，消费频次2-3次
  if (days > 60 && orders >= 2 && orders <= 3) return 'A';
  // B级：中危流失 最后消费>45天，消费频次3-5次
  if (days > 45 && orders >= 3 && orders <= 5) return 'B';
  // C级：低危流失 最后消费>30天，消费频次>=5次
  if (days > 30 && orders >= 5) return 'C';
  // D级：休眠会员 最后消费>90天，但累计消费>=10次或金额>5000元
  if (days > 90 && (orders >= 10 || amount >= 5000)) return 'D';

  // 默认按天数和次数判断
  if (days > 60 && orders <= 3) return 'A';
  if (days > 45) return 'B';
  if (days > 30) return 'C';
  return 'D';
}

// 计算召回价值
export function calculateRecallValue(customer: Customer): number {
  let score = 0;

  // 基础分数：累计消费金额（最高40分）
  score += Math.min(40, customer.totalAmount / 100);

  // 消费频次（最高30分）
  score += Math.min(30, customer.totalOrders * 3);

  // 时间衰减：越久越需要召回（最高30分）
  const daysFactor = Math.min(30, customer.daysSinceLastOrder / 3);

  // 流失等级加权
  const levelWeight = {
    'A': 1.0,
    'B': 0.8,
    'C': 0.6,
    'D': 0.4,
  }[customer.churnLevel || 'C'];

  score = score * levelWeight + daysFactor;

  return Math.round(score);
}

// 筛选流失客户
export function filterRecallCustomers(
  customers: Customer[],
  filter: RecallFilter
): RecallCustomer[] {
  // 第一步：过滤客户
  const baseFiltered = customers.filter(c => {
    // 排除随机客户（只消费1次）
    if (filter.excludeRandomCustomer !== false && c.totalOrders === 1) {
      return false;
    }

    // 流失天数筛选
    if (filter.daysSinceLastOrder !== undefined) {
      if (c.daysSinceLastOrder <= filter.daysSinceLastOrder) {
        return false;
      }
    }

    // 消费次数筛选
    if (filter.totalOrdersMin !== undefined) {
      if (c.totalOrders < filter.totalOrdersMin) {
        return false;
      }
    }
    if (filter.totalOrdersMax !== undefined) {
      if (c.totalOrders > filter.totalOrdersMax) {
        return false;
      }
    }

    // 累计金额筛选
    if (filter.totalAmountMin !== undefined) {
      if (c.totalAmount < filter.totalAmountMin) {
        return false;
      }
    }
    if (filter.totalAmountMax !== undefined) {
      if (c.totalAmount > filter.totalAmountMax) {
        return false;
      }
    }

    // 车牌筛选
    if (filter.carPlatePrefix) {
      if (!c.carPlate?.startsWith(filter.carPlatePrefix)) {
        return false;
      }
    }

    // 流失等级筛选
    if (filter.churnLevels && filter.churnLevels.length > 0) {
      const level = calculateChurnLevel(c);
      if (!filter.churnLevels.includes(level)) {
        return false;
      }
    }

    return true;
  });

  // 第二步：计算流失等级和召回价值
  const withLevels: RecallCustomer[] = baseFiltered.map(c => ({
    ...c,
    churnLevel: calculateChurnLevel(c),
    recallValue: calculateRecallValue(c),
  }));

  // 第三步：排序（按等级和流失天数）
  withLevels.sort((a, b) => {
    const levelOrder = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    const levelDiff = levelOrder[a.churnLevel!] - levelOrder[b.churnLevel!];
    if (levelDiff !== 0) return levelDiff;
    return b.daysSinceLastOrder - a.daysSinceLastOrder;
  });

  return withLevels;
}

// 获取流失客户详情
export function getChurnCustomerDetails(customers: Customer[], churnLevel?: 'A' | 'B' | 'C' | 'D'): RecallCustomer[] {
  let churnCustomers = customers.filter(c => {
    if (c.totalOrders === 1) return false;
    return c.daysSinceLastOrder > 30;
  });

  if (churnLevel) {
    churnCustomers = churnCustomers.filter(c => calculateChurnLevel(c) === churnLevel);
  }

  return churnCustomers.map(c => ({
    ...c,
    churnLevel: calculateChurnLevel(c),
    recallValue: calculateRecallValue(c),
  }));
}

// 预测即将流失的客户
export function predictChurnCustomers(customers: Customer[], withinDays: number = 30): Customer[] {
  const avgDaysBetweenOrders = 20; // TODO: 需要根据历史数据计算

  return customers.filter(c => {
    if (c.totalOrders === 1 || c.daysSinceLastOrder <= withinDays) {
      return false;
    }

    // 预测在接下来N天内会流失
    const daysUntilChurn = avgDaysBetweenOrders - (c.daysSinceLastOrder % avgDaysBetweenOrders);
    return daysUntilChurn <= withinDays;
  });
}
