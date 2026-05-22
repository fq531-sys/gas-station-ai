// 加油站AI智能营销官 - 客户分类逻辑

import { Order, Customer, CustomerSegment, CustomerType, RecallFilter, RecallCustomer } from './types';
import { CUSTOMER_TYPE_CONFIG, CHURN_LEVEL_CONFIG } from './constants';
import dayjs from 'dayjs';

// 按客户标识聚合客户数据（手机号或会员编码）
export function aggregateCustomers(orders: Order[]): Customer[] {
  const customerMap = new Map<string, {
    customerId: string;
    phone?: string;
    memberCode?: string;
    carPlate?: string;
    name?: string;
    totalOrders: number;
    totalAmount: number;
    lastOrderDate: Date;
    oilTypes: Set<string>;
  }>();

  orders.forEach(order => {
    const orderAny = order as any;

    // 使用客户标识作为唯一标识
    const customerId = extractCustomerId(order);
    if (!customerId) return; // 没有标识视为散客，跳过

    const existing = customerMap.get(customerId) || {
      customerId,
      phone: orderAny.subCardPhone || orderAny.payUserPhone || orderAny.phone,
      memberCode: orderAny.memberCode,
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

    customerMap.set(customerId, existing);
  });

  return Array.from(customerMap.values()).map(c => ({
    customerId: c.customerId,
    phone: c.phone,
    memberCode: c.memberCode,
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

// 从订单中提取客户标识（手机号或会员编码）
function extractCustomerId(order: Order): string {
  const orderAny = order as any;

  // 优先使用手机号（从各种可能的字段获取）
  const phone = orderAny.subCardPhone || orderAny.payUserPhone || orderAny.phone;
  if (phone && String(phone).trim() !== '') {
    return String(phone).trim();
  }

  // 使用会员编码
  const memberCode = orderAny.memberCode;
  if (memberCode && String(memberCode).trim() !== '') {
    return String(memberCode).trim();
  }

  // 如果都没有，使用车牌作为唯一标识（但同车牌可能多人使用，优先级最低）
  if (order.carPlate && order.carPlate.trim() !== '') {
    return 'PLATE_' + order.carPlate.trim();
  }

  return '';
}

// 分类客户
export function classifyCustomers(customers: Customer[], orders: Order[], dataEndDate?: Date): CustomerSegment[] {
  // 计算数据截止日（最后消费时间）
  const cutoffDate = dataEndDate || new Date();

  // 计算加油站平均升优惠力度
  const avgDiscountPerLiter = calculateStationAvgDiscountPerLiter(orders);

  // 计算财务风险客户
  const financialRiskCustomerIds = detectFinancialRiskCustomers(orders, avgDiscountPerLiter);

  let total = customers.length;
  let base = 0;
  let risk = 0;
  let churn = 0;
  let random = 0;
  let financialRisk = 0;

  customers.forEach(c => {
    // 计算距离数据截止日的天数
    const daysFromCutoff = Math.floor((cutoffDate.getTime() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));

    if (financialRiskCustomerIds.has(c.customerId)) {
      financialRisk++;
      c.customerType = 'financialRisk';
    } else if (c.totalOrders === 1) {
      random++;
      c.customerType = 'random';
    } else if (c.totalOrders >= 3 && daysFromCutoff <= 20) {
      // 基本盘客户：消费次数≥3 且 最后消费距数据截止日≤20天
      base++;
      c.customerType = 'base';
    } else if (c.totalOrders >= 2 && daysFromCutoff >= 20 && daysFromCutoff < 30) {
      // 流失风险客户：消费次数≥2 且 最后消费距数据截止日≥20天且<30天
      risk++;
      c.customerType = 'risk';
    } else if (c.totalOrders >= 2 && daysFromCutoff >= 30) {
      // 流失客户：消费次数≥2 且 最后消费距数据截止日≥30天
      churn++;
      c.customerType = 'churn';
    } else {
      // 其他的归类为流失风险客户（消费≥2次但天数<20的，或消费次数2但天数<20的）
      risk++;
      c.customerType = 'risk';
    }
  });

  const calculatePercentage = (count: number) => total > 0 ? (count / total) * 100 : 0;

  return [
    { type: 'total', name: CUSTOMER_TYPE_CONFIG.total.name, count: total, percentage: 100, trend: 'stable', color: CUSTOMER_TYPE_CONFIG.total.color },
    { type: 'random', name: CUSTOMER_TYPE_CONFIG.random.name, count: random, percentage: calculatePercentage(random), trend: 'stable', color: CUSTOMER_TYPE_CONFIG.random.color },
    { type: 'base', name: CUSTOMER_TYPE_CONFIG.base.name, count: base, percentage: calculatePercentage(base), trend: 'stable', color: CUSTOMER_TYPE_CONFIG.base.color },
    { type: 'risk', name: CUSTOMER_TYPE_CONFIG.risk.name, count: risk, percentage: calculatePercentage(risk), trend: risk > 0 ? 'up' : 'stable', color: CUSTOMER_TYPE_CONFIG.risk.color },
    { type: 'churn', name: CUSTOMER_TYPE_CONFIG.churn.name, count: churn, percentage: calculatePercentage(churn), trend: churn > 0 ? 'up' : 'stable', color: CUSTOMER_TYPE_CONFIG.churn.color },
    { type: 'financialRisk', name: CUSTOMER_TYPE_CONFIG.financialRisk.name, count: financialRisk, percentage: calculatePercentage(financialRisk), trend: financialRisk > 0 ? 'up' : 'stable', color: CUSTOMER_TYPE_CONFIG.financialRisk.color },
  ];
}

// 计算加油站平均升优惠力度（优惠总额 / 总升数）
function calculateStationAvgDiscountPerLiter(orders: Order[]): number {
  if (orders.length === 0) return 0;
  const totalDiscount = orders.reduce((sum, o) => sum + (o.discountTotal || 0), 0);
  const totalQuantity = orders.reduce((sum, o) => sum + o.quantity, 0);
  return totalQuantity > 0 ? totalDiscount / totalQuantity : 0;
}

// 计算单个客户的升优惠力度（优惠总额 / 总升数）
function calculateCustomerDiscountPerLiter(customerId: string, orders: Order[]): number {
  const customerOrders = orders.filter(o => {
    const orderAny = o as any;
    const phone = orderAny.subCardPhone || orderAny.payUserPhone || orderAny.phone;
    const memberCode = orderAny.memberCode;
    const carPlate = o.carPlate;

    let id = '';
    if (phone) id = String(phone).trim();
    else if (memberCode) id = String(memberCode).trim();
    else if (carPlate) id = 'PLATE_' + String(carPlate).trim();

    return id === customerId;
  });

  if (customerOrders.length === 0) return 0;
  const totalDiscount = customerOrders.reduce((sum, o) => sum + (o.discountTotal || 0), 0);
  const totalQuantity = customerOrders.reduce((sum, o) => sum + o.quantity, 0);
  return totalQuantity > 0 ? totalDiscount / totalQuantity : 0;
}

// 检测财务风险客户
function detectFinancialRiskCustomers(orders: Order[], avgDiscountPerLiter: number): Set<string> {
  const riskCustomerIds = new Set<string>();

  // 按客户分组
  const customerOrderMap = new Map<string, Order[]>();
  orders.forEach(order => {
    const orderAny = order as any;
    const phone = orderAny.subCardPhone || orderAny.payUserPhone || orderAny.phone;
    const memberCode = orderAny.memberCode;
    const carPlate = order.carPlate;

    let customerId = '';
    if (phone && String(phone).trim() !== '') {
      customerId = String(phone).trim();
    } else if (memberCode && String(memberCode).trim() !== '') {
      customerId = String(memberCode).trim();
    } else if (carPlate && String(carPlate).trim() !== '') {
      customerId = 'PLATE_' + String(carPlate).trim();
    }

    if (!customerId) return;

    if (!customerOrderMap.has(customerId)) {
      customerOrderMap.set(customerId, []);
    }
    customerOrderMap.get(customerId)!.push(order);
  });

  // 检查每个客户的财务风险
  customerOrderMap.forEach((customerOrders, customerId) => {
    // 条件1：单日消费次数>=2
    const dayOrdersMap = new Map<string, number>();
    customerOrders.forEach(o => {
      const dayKey = dayjs(o.transactionTime).format('YYYY-MM-DD');
      dayOrdersMap.set(dayKey, (dayOrdersMap.get(dayKey) || 0) + 1);
    });
    const hasHighDayOrders = Array.from(dayOrdersMap.values()).some(count => count >= 2);

    // 条件2：7天内消费>=3次
    const sortedOrders = [...customerOrders].sort((a, b) =>
      new Date(a.transactionTime).getTime() - new Date(b.transactionTime).getTime()
    );
    let hasHigh7DayOrders = false;
    for (let i = 0; i < sortedOrders.length; i++) {
      const startDate = new Date(sortedOrders[i].transactionTime);
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const ordersIn7Days = sortedOrders.filter(o => {
        const orderDate = new Date(o.transactionTime);
        return orderDate >= startDate && orderDate <= endDate;
      });
      if (ordersIn7Days.length >= 3) {
        hasHigh7DayOrders = true;
        break;
      }
    }

    // 条件3：消费不同油品（多油品）
    const oilTypesSet = new Set<string>();
    customerOrders.forEach(o => oilTypesSet.add(o.oilType));
    const hasMultipleOilTypes = oilTypesSet.size >= 2;

    // 客户的升优惠力度
    const customerDiscountPerLiter = calculateCustomerDiscountPerLiter(customerId, orders);

    // 满足任一条件且升优惠力度高于站点平均
    if ((hasHighDayOrders || hasHigh7DayOrders || hasMultipleOilTypes) && customerDiscountPerLiter > avgDiscountPerLiter) {
      riskCustomerIds.add(customerId);
    }
  });

  return riskCustomerIds;
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
