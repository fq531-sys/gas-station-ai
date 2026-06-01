// 加油站AI智能营销官 - 数据处理逻辑

import * as XLSX from 'xlsx';
import { Order, SalesOverview, DailySales, TimeSlotAnalysis, OilTypeAnalysis, GunAnalysis, PaymentAnalysis } from './types';
import { FIELD_MAPPING, OIL_TYPES, HOURS, ALERT_THRESHOLDS } from './constants';
import dayjs from 'dayjs';

// 解析Excel文件
export function parseExcelFile(file: File): Promise<Order[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // 第一行是表头
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1).filter(row => row.length > 0);

        // 建立字段映射索引
        const fieldIndexMap: Record<string, number> = {};
        headers.forEach((header, index) => {
          const mappedField = FIELD_MAPPING[header.trim()];
          if (mappedField) {
            fieldIndexMap[mappedField] = index;
          }
        });

        // 解析数据行
        const orders: Order[] = dataRows.map(row => {
          const order: any = {};
          Object.keys(fieldIndexMap).forEach(field => {
            let value = row[fieldIndexMap[field]];
            if (field === 'transactionTime' && value) {
              // 处理日期时间
              if (typeof value === 'number') {
                // Excel日期序列号
                value = new Date((value - 25569) * 86400 * 1000);
              } else if (typeof value === 'string') {
                value = new Date(value);
              }
            } else if (['unitPrice', 'quantity', 'orderAmount', 'discountTotal', 'actualAmount',
                        'payWechat', 'payAlipay', 'payCash', 'payStoredCard', 'payBankCard',
                        'channelFee', 'channelSettleAmount', 'discountedPrice'].includes(field)) {
              value = parseFloat(value) || 0;
            }
            order[field] = value;
          });

          // 计算小时
          if (order.transactionTime) {
            order.hour = new Date(order.transactionTime).getHours();
          }

          return order as Order;
        }).filter(order => order.orderId && order.transactionTime);

        resolve(orders);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

// 计算销售概况
export function calculateSalesOverview(orders: Order[]): SalesOverview {
  if (orders.length === 0) {
    return {
      totalOrders: 0,
      totalQuantity: 0,
      totalAmount: 0,
      avgOrderAmount: 0,
      dailyOrders: 0,
      dailyQuantity: 0,
      dailyAmount: 0,
      dateRange: { start: new Date(), end: new Date() },
      comparisonRate: { orders: 0, quantity: 0, amount: 0 },
      statistics: {
        dailyAvgByOilType: { '92#': 0, '95#': 0, '98#': 0, '0#': 0 },
        avgOrderAmount: { gasoline: 0, diesel: 0, total: 0 },
        avgOrderQuantity: { gasoline: 0, diesel: 0, total: 0 },
        avgDiscountCost: { gasoline: 0, diesel: 0, total: 0 },
        totalDays: 0,
        dateRange: { start: new Date(), end: new Date() },
      },
      oilTypeDailySales: [],
    };
  }

  const dates = orders.map(o => new Date(o.transactionTime)).filter(d => !isNaN(d.getTime()));
  if (dates.length === 0) {
    return {
      totalOrders: 0,
      totalQuantity: 0,
      totalAmount: 0,
      avgOrderAmount: 0,
      dailyOrders: 0,
      dailyQuantity: 0,
      dailyAmount: 0,
      dateRange: { start: new Date(), end: new Date() },
      comparisonRate: { orders: 0, quantity: 0, amount: 0 },
      statistics: {
        dailyAvgByOilType: { '92#': 0, '95#': 0, '98#': 0, '0#': 0 },
        avgOrderAmount: { gasoline: 0, diesel: 0, total: 0 },
        avgOrderQuantity: { gasoline: 0, diesel: 0, total: 0 },
        avgDiscountCost: { gasoline: 0, diesel: 0, total: 0 },
        totalDays: 0,
        dateRange: { start: new Date(), end: new Date() },
      },
      oilTypeDailySales: [],
    };
  }
  const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const days = Math.max(1, dayjs(endDate).diff(dayjs(startDate), 'day') + 1);

  const totalOrders = orders.length;
  const totalQuantity = orders.reduce((sum, o) => sum + o.quantity, 0);
  const totalAmount = orders.reduce((sum, o) => sum + o.actualAmount, 0);
  const totalDiscount = orders.reduce((sum, o) => sum + ((o.orderAmount || 0) - (o.actualAmount || 0)), 0);

  // 按油品分类统计
  const gasolineOrders = orders.filter(o => ['92#', '95#', '98#'].includes(normalizeOilType(o.oilType)));
  const dieselOrders = orders.filter(o => normalizeOilType(o.oilType) === '0#');

  const gasolineQuantity = gasolineOrders.reduce((sum, o) => sum + o.quantity, 0);
  const gasolineAmount = gasolineOrders.reduce((sum, o) => sum + o.actualAmount, 0);
  const gasolineDiscount = gasolineOrders.reduce((sum, o) => sum + ((o.orderAmount || 0) - (o.actualAmount || 0)), 0);

  const dieselQuantity = dieselOrders.reduce((sum, o) => sum + o.quantity, 0);
  const dieselAmount = dieselOrders.reduce((sum, o) => sum + o.actualAmount, 0);
  const dieselDiscount = dieselOrders.reduce((sum, o) => sum + ((o.orderAmount || 0) - (o.actualAmount || 0)), 0);

  // 计算按油品分组的日销量
  const oilTypeDailyMap = new Map<string, { '92#': number; '95#': number; '98#': number; '0#': number }>();

  // 按日期和油品汇总
  const dailyOilTypeMap = new Map<string, { '92#': number; '95#': number; '98#': number; '0#': number }>();
  orders.forEach(order => {
    const dateKey = dayjs(order.transactionTime).format('YYYY-MM-DD');
    const oilType = normalizeOilType(order.oilType);

    if (!dailyOilTypeMap.has(dateKey)) {
      dailyOilTypeMap.set(dateKey, { '92#': 0, '95#': 0, '98#': 0, '0#': 0 });
    }
    const existing = dailyOilTypeMap.get(dateKey)!;
    existing[oilType as keyof typeof existing] += order.quantity;
  });

  // 转换为数组
  const oilTypeDailySales = Array.from(dailyOilTypeMap.entries())
    .map(([date, data]) => ({
      date,
      ...data,
      gasoline: (data['92#'] || 0) + (data['95#'] || 0) + (data['98#'] || 0),
      diesel: data['0#'] || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 计算按油品的日均销量
  const dailyAvgByOilType = { '92#': 0, '95#': 0, '98#': 0, '0#': 0 };
  for (const daily of oilTypeDailySales) {
    dailyAvgByOilType['92#'] += daily['92#'];
    dailyAvgByOilType['95#'] += daily['95#'];
    dailyAvgByOilType['98#'] += daily['98#'];
    dailyAvgByOilType['0#'] += daily['0#'];
  }
  for (const key of ['92#', '95#', '98#', '0#'] as const) {
    dailyAvgByOilType[key] = dailyAvgByOilType[key] / days;
  }

  return {
    totalOrders,
    totalQuantity,
    totalAmount,
    avgOrderAmount: totalOrders > 0 ? totalAmount / totalOrders : 0,
    dailyOrders: totalOrders / days,
    dailyQuantity: totalQuantity / days,
    dailyAmount: totalAmount / days,
    dateRange: { start: startDate, end: endDate },
    comparisonRate: { orders: 0, quantity: 0, amount: 0 },
    statistics: {
      dailyAvgByOilType,
      avgOrderAmount: {
        gasoline: gasolineOrders.length > 0 ? gasolineAmount / gasolineOrders.length : 0,
        diesel: dieselOrders.length > 0 ? dieselAmount / dieselOrders.length : 0,
        total: totalOrders > 0 ? totalAmount / totalOrders : 0,
      },
      avgOrderQuantity: {
        gasoline: gasolineOrders.length > 0 ? gasolineQuantity / gasolineOrders.length : 0,
        diesel: dieselOrders.length > 0 ? dieselQuantity / dieselOrders.length : 0,
        total: totalOrders > 0 ? totalQuantity / totalOrders : 0,
      },
      avgDiscountCost: {
        gasoline: gasolineQuantity > 0 ? gasolineDiscount / gasolineQuantity : 0,
        diesel: dieselQuantity > 0 ? dieselDiscount / dieselQuantity : 0,
        total: totalQuantity > 0 ? totalDiscount / totalQuantity : 0,
      },
      totalDays: days,
      dateRange: { start: startDate, end: endDate },
    },
    oilTypeDailySales,
  };
}

// 规范化油品类型
function normalizeOilType(oilType: string): string {
  if (!oilType) return '0#';
  const normalized = oilType.trim().toUpperCase();
  if (normalized === '92#' || normalized === '92' || normalized === '汽油92') return '92#';
  if (normalized === '95#' || normalized === '95' || normalized === '汽油95') return '95#';
  if (normalized === '98#' || normalized === '98' || normalized === '汽油98') return '98#';
  if (normalized === '0#' || normalized === '0' || normalized === '柴油0') return '0#';
  return '0#'; // 默认柴油
}

// 计算日销售趋势
export function calculateDailySales(orders: Order[]): DailySales[] {
  const dailyMap = new Map<string, { orders: number; quantity: number; amount: number }>();

  orders.forEach(order => {
    const dateKey = dayjs(order.transactionTime).format('YYYY-MM-DD');
    const existing = dailyMap.get(dateKey) || { orders: 0, quantity: 0, amount: 0 };
    existing.orders += 1;
    existing.quantity += order.quantity;
    existing.amount += order.actualAmount;
    dailyMap.set(dateKey, existing);
  });

  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      orders: data.orders,
      quantity: data.quantity,
      amount: data.amount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// 计算时段分析
export function calculateTimeSlotAnalysis(orders: Order[]): TimeSlotAnalysis[] {
  const hourlyData = HOURS.map(hour => {
    const hourOrders = orders.filter(o => new Date(o.transactionTime).getHours() === hour);
    return {
      hour,
      orders: hourOrders.length,
      quantity: hourOrders.reduce((sum, o) => sum + o.quantity, 0),
      amount: hourOrders.reduce((sum, o) => sum + o.actualAmount, 0),
      isPeak: false,
      isValley: false,
    };
  });

  // 找出高峰和低谷（按销量）
  const avgQuantity = hourlyData.reduce((sum, h) => sum + h.quantity, 0) / 24;
  const maxQuantity = Math.max(...hourlyData.map(h => h.quantity));
  const minQuantity = Math.min(...hourlyData.filter(h => h.quantity > 0).map(h => h.quantity));

  return hourlyData.map(h => ({
    ...h,
    isPeak: h.quantity > avgQuantity * 1.3 && h.quantity >= maxQuantity * 0.7,
    isValley: h.quantity < avgQuantity * 0.5 && h.quantity <= minQuantity * 1.5 && h.quantity > 0,
  }));
}

// 计算油品分析
export function calculateOilTypeAnalysis(orders: Order[]): OilTypeAnalysis[] {
  const totalQuantity = orders.reduce((sum, o) => sum + o.quantity, 0);
  const totalAmount = orders.reduce((sum, o) => sum + o.actualAmount, 0);

  return OIL_TYPES.map(oilType => {
    const oilOrders = orders.filter(o => o.oilType === oilType);
    const quantity = oilOrders.reduce((sum, o) => sum + o.quantity, 0);
    const amount = oilOrders.reduce((sum, o) => sum + o.actualAmount, 0);
    return {
      oilType,
      orders: oilOrders.length,
      quantity,
      amount,
      percentage: totalQuantity > 0 ? (quantity / totalQuantity) * 100 : 0,
    };
  });
}

// 计算油枪分析
export function calculateGunAnalysis(orders: Order[]): GunAnalysis[] {
  const gunMap = new Map<string, { orders: number; quantity: number; amount: number }>();

  orders.forEach(order => {
    const existing = gunMap.get(order.gunNo) || { orders: 0, quantity: 0, amount: 0 };
    existing.orders += 1;
    existing.quantity += order.quantity;
    existing.amount += order.actualAmount;
    gunMap.set(order.gunNo, existing);
  });

  const gunList = Array.from(gunMap.entries()).map(([gunNo, data]) => ({
    gunNo,
    orders: data.orders,
    quantity: data.quantity,
    amount: data.amount,
    avgQuantity: data.orders > 0 ? data.quantity / data.orders : 0,
    avgAmount: data.orders > 0 ? data.amount / data.orders : 0,
    isEfficient: true,
  }));

  // 计算效率排名，最低3把标记为低效
  const avgAllQuantity = gunList.reduce((sum, g) => sum + g.avgQuantity, 0) / gunList.length;
  const sortedByQuantity = [...gunList].sort((a, b) => a.avgQuantity - b.avgQuantity);
  const inefficientGuns = sortedByQuantity.slice(0, 3).map(g => g.gunNo);

  return gunList.map(g => ({
    ...g,
    isEfficient: !inefficientGuns.includes(g.gunNo) || g.avgQuantity >= avgAllQuantity * 0.7,
  }));
}

// 计算支付方式分析
export function calculatePaymentAnalysis(orders: Order[]): PaymentAnalysis[] {
  const payTypeMap = new Map<string, { orders: number; amount: number }>();

  orders.forEach(order => {
    const payType = order.payType || '其他';
    const existing = payTypeMap.get(payType) || { orders: 0, amount: 0 };
    existing.orders += 1;
    existing.amount += order.actualAmount;
    payTypeMap.set(payType, existing);
  });

  const totalAmount = orders.reduce((sum, o) => sum + o.actualAmount, 0);

  return Array.from(payTypeMap.entries())
    .map(([payType, data]) => ({
      payType,
      orders: data.orders,
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// 检测销售异常
export function detectSalesAnomalies(dailySales: DailySales[]) {
  const anomalies: { date: string; type: string; description: string }[] = [];

  if (dailySales.length < 3) return anomalies;

  // 计算均值和标准差
  const amounts = dailySales.map(d => d.amount);
  const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
  const stdDev = Math.sqrt(amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length);

  // 检测突增突降
  for (let i = 1; i < dailySales.length; i++) {
    const prev = dailySales[i - 1].amount;
    const curr = dailySales[i].amount;
    const changeRate = prev > 0 ? (curr - prev) / prev : 0;

    if (changeRate > ALERT_THRESHOLDS.surgeRate) {
      anomalies.push({
        date: dailySales[i].date,
        type: 'surge',
        description: `销量突增${(changeRate * 100).toFixed(0)}%`,
      });
    } else if (changeRate < -ALERT_THRESHOLDS.dropRate) {
      anomalies.push({
        date: dailySales[i].date,
        type: 'drop',
        description: `销量突降${(Math.abs(changeRate) * 100).toFixed(0)}%`,
      });
    }

    // 偏离均值
    if (Math.abs(curr - avg) > stdDev * ALERT_THRESHOLDS.stdDevMultiplier) {
      anomalies.push({
        date: dailySales[i].date,
        type: 'deviation',
        description: `销量偏离均值${(Math.abs(curr - avg) / avg * 100).toFixed(0)}%`,
      });
    }
  }

  // 检测连续下滑
  let declineDays = 0;
  for (let i = dailySales.length - 1; i >= 0 && declineDays < ALERT_THRESHOLDS.consecutiveDeclineDays; i--) {
    if (i > 0 && dailySales[i].amount < dailySales[i - 1].amount) {
      declineDays++;
    } else {
      declineDays = 0;
    }
  }

  if (declineDays >= ALERT_THRESHOLDS.consecutiveDeclineDays) {
    anomalies.push({
      date: dailySales[dailySales.length - 1].date,
      type: 'consecutive_decline',
      description: `连续${declineDays}天下滑`,
    });
  }

  return anomalies;
}

// 计算环比
export function calculateComparisonRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// 格式化金额
export function formatCurrency(amount: number): string {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(2)}万`;
  }
  return amount.toFixed(2);
}

// 格式化数量
export function formatQuantity(liters: number): string {
  if (liters >= 10000) {
    return `${(liters / 10000).toFixed(2)}万升`;
  }
  return `${liters.toFixed(0)}升`;
}
