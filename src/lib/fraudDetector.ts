// 加油站AI智能营销官 - 财务风险检测逻辑

import { Order, RiskAlert, RiskType } from './types';
import { RISK_TYPE_CONFIG } from './constants';
import dayjs from 'dayjs';

// 检测所有财务风险
export function detectAllRisks(orders: Order[]): RiskAlert[] {
  const risks: RiskAlert[] = [];

  risks.push(...detectEmployeeFraud(orders));
  risks.push(...detectCustomerFraud(orders));
  risks.push(...detectRefundFraud(orders));
  risks.push(...detectQuantityAnomaly(orders));
  risks.push(...detectDiscountAnomaly(orders));
  risks.push(...detectGunMachineBehavior(orders));
  risks.push(...detectNightAnomaly(orders));
  risks.push(...detectNonBusinessTime(orders));

  return risks.sort((a, b) => {
    const levelOrder = { high: 0, medium: 1, low: 2 };
    return levelOrder[a.level] - levelOrder[b.level];
  });
}

// 检测员工套现
function detectEmployeeFraud(orders: Order[]): RiskAlert[] {
  const risks: RiskAlert[] = [];
  const thresholdMinutes = 30;
  const thresholdCount = 3;
  const thresholdAmount = 500;

  const employeeGroups = new Map<string, Order[]>();
  orders.forEach(order => {
    if (order.cashier && order.actualAmount >= thresholdAmount && order.discountTotal === 0) {
      const existing = employeeGroups.get(order.cashier) || [];
      existing.push(order);
      employeeGroups.set(order.cashier, existing);
    }
  });

  employeeGroups.forEach((empOrders, cashier) => {
    // 按时间排序
    empOrders.sort((a, b) => new Date(a.transactionTime).getTime() - new Date(b.transactionTime).getTime());

    let i = 0;
    while (i < empOrders.length) {
      const startTime = new Date(empOrders[i].transactionTime);
      const windowOrders = empOrders.filter(o => {
        const orderTime = new Date(o.transactionTime);
        return orderTime.getTime() - startTime.getTime() <= thresholdMinutes * 60 * 1000;
      });

      if (windowOrders.length >= thresholdCount) {
        const totalAmount = windowOrders.reduce((sum, o) => sum + o.actualAmount, 0);
        risks.push({
          id: `emp_fraud_${cashier}_${i}`,
          type: 'employee',
          riskType: 'employee_fraud',
          level: 'high',
          description: `员工${cashier}在${thresholdMinutes}分钟内操作${windowOrders.length}笔高额未优惠交易`,
          timestamp: startTime,
          orderId: windowOrders[0].orderId,
          amount: totalAmount,
          person: cashier,
          details: {
            orders: windowOrders.map(o => o.orderId),
            avgAmount: totalAmount / windowOrders.length,
          },
        });
        i += windowOrders.length; // 跳过已处理的订单
      } else {
        i++;
      }
    }
  });

  return risks;
}

// 检测客户小额套现
function detectCustomerFraud(orders: Order[]): RiskAlert[] {
  const risks: RiskAlert[] = [];

  // 按车牌分组
  const plateGroups = new Map<string, Order[]>();
  orders.forEach(order => {
    const plate = order.carPlate;
    if (plate && plate !== '--散客--') {
      const existing = plateGroups.get(plate) || [];
      existing.push(order);
      plateGroups.set(plate, existing);
    }
  });

  plateGroups.forEach((plateOrders, plate) => {
    plateOrders.sort((a, b) => new Date(a.transactionTime).getTime() - new Date(b.transactionTime).getTime());

    for (let i = 0; i < plateOrders.length - 1; i++) {
      const curr = plateOrders[i];
      const next = plateOrders[i + 1];
      const timeDiff = new Date(next.transactionTime).getTime() - new Date(curr.transactionTime).getTime();

      // 5分钟内连续加油且加油量完全相同
      if (timeDiff <= 5 * 60 * 1000 && curr.quantity === next.quantity && curr.quantity > 0) {
        risks.push({
          id: `cust_fraud_${plate}_${i}`,
          type: 'customer',
          riskType: 'quantity_anomaly',
          level: 'high',
          description: `客户${plate}在5分钟内连续加油2次，加油量完全相同(${curr.quantity}升)`,
          timestamp: new Date(curr.transactionTime),
          orderId: curr.orderId,
          amount: curr.actualAmount + next.actualAmount,
          person: plate,
          details: {
            orders: [curr.orderId, next.orderId],
            quantity: curr.quantity,
            timeDiff,
          },
        });
      }
    }
  });

  return risks;
}

// 检测回灌结算异常
function detectRefundFraud(orders: Order[]): RiskAlert[] {
  const risks: RiskAlert[] = [];
  const thresholdPercent = 10;

  const refundOrders = orders.filter(o => o.payType === '回灌结算');
  const refundPercent = (refundOrders.length / orders.length) * 100;

  if (refundPercent > thresholdPercent) {
    const totalAmount = refundOrders.reduce((sum, o) => sum + o.actualAmount, 0);
    risks.push({
      id: 'refund_fraud_overall',
      type: 'system',
      riskType: 'refund_fraud',
      level: 'high',
      description: `回灌结算笔数占比${refundPercent.toFixed(1)}%，超过${thresholdPercent}%阈值`,
      timestamp: new Date(),
      orderId: '',
      amount: totalAmount,
      person: '系统',
      details: {
        refundCount: refundOrders.length,
        totalCount: orders.length,
        refundPercent,
      },
    });

    // 按员工分组检测
    const empRefundGroups = new Map<string, Order[]>();
    refundOrders.forEach(o => {
      const existing = empRefundGroups.get(o.cashier) || [];
      existing.push(o);
      empRefundGroups.set(o.cashier, existing);
    });

    empRefundGroups.forEach((empOrders, cashier) => {
      const empRefundPercent = (empOrders.length / orders.length) * 100;
      if (empRefundPercent > thresholdPercent) {
        const empTotalAmount = empOrders.reduce((sum, o) => sum + o.actualAmount, 0);
        risks.push({
          id: `refund_fraud_${cashier}`,
          type: 'employee',
          riskType: 'refund_fraud',
          level: 'high',
          description: `员工${cashier}回灌结算占比${empRefundPercent.toFixed(1)}%显著高于均值`,
          timestamp: new Date(),
          orderId: empOrders[0].orderId,
          amount: empTotalAmount,
          person: cashier,
          details: {
            refundCount: empOrders.length,
            totalCount: orders.length,
            refundPercent: empRefundPercent,
          },
        });
      }
    });
  }

  return risks;
}

// 检测油量异常
function detectQuantityAnomaly(orders: Order[]): RiskAlert[] {
  const risks: RiskAlert[] = [];
  const thresholdQuantity = 100; // 100升

  orders.forEach(order => {
    if (order.quantity > thresholdQuantity) {
      risks.push({
        id: `qty_anomaly_${order.orderId}`,
        type: 'customer',
        riskType: 'quantity_anomaly',
        level: 'medium',
        description: `单笔加油量${order.quantity}升，超出普通车辆油箱容量`,
        timestamp: new Date(order.transactionTime),
        orderId: order.orderId,
        amount: order.actualAmount,
        person: order.carPlate || '未知',
        details: {
          quantity: order.quantity,
          oilType: order.oilType,
          gunNo: order.gunNo,
        },
      });
    }
  });

  return risks;
}

// 检测优惠异常
function detectDiscountAnomaly(orders: Order[]): RiskAlert[] {
  const risks: RiskAlert[] = [];
  const thresholdDiscountAmount = 100;
  const thresholdDiscountPercent = 30;

  orders.forEach(order => {
    if (order.discountTotal > thresholdDiscountAmount) {
      const discountPercent = order.orderAmount > 0
        ? (order.discountTotal / order.orderAmount) * 100
        : 0;

      if (discountPercent > thresholdDiscountPercent) {
        risks.push({
          id: `disc_anomaly_${order.orderId}`,
          type: 'customer',
          riskType: 'discount_anomaly',
          level: 'medium',
          description: `单笔优惠金额${order.discountTotal}元，占比${discountPercent.toFixed(0)}%`,
          timestamp: new Date(order.transactionTime),
          orderId: order.orderId,
          amount: order.discountTotal,
          person: order.carPlate || '未知',
          details: {
            discountAmount: order.discountTotal,
            discountPercent,
            orderAmount: order.orderAmount,
          },
        });
      }
    }
  });

  return risks;
}

// 检测油枪机器行为
function detectGunMachineBehavior(orders: Order[]): RiskAlert[] {
  const risks: RiskAlert[] = [];
  const thresholdMinutes = 10;
  const thresholdCount = 5;

  const gunGroups = new Map<string, Order[]>();
  orders.forEach(order => {
    const existing = gunGroups.get(order.gunNo) || [];
    existing.push(order);
    gunGroups.set(order.gunNo, existing);
  });

  gunGroups.forEach((gunOrders, gunNo) => {
    gunOrders.sort((a, b) => new Date(a.transactionTime).getTime() - new Date(b.transactionTime).getTime());

    for (let i = 0; i < gunOrders.length; i++) {
      const startTime = new Date(gunOrders[i].transactionTime);
      const targetQuantity = gunOrders[i].quantity;

      const windowOrders = gunOrders.filter(o => {
        const orderTime = new Date(o.transactionTime);
        const timeDiff = orderTime.getTime() - startTime.getTime();
        return timeDiff <= thresholdMinutes * 60 * 1000 && o.quantity === targetQuantity;
      });

      if (windowOrders.length >= thresholdCount) {
        const totalAmount = windowOrders.reduce((sum, o) => sum + o.actualAmount, 0);
        risks.push({
          id: `gun_machine_${gunNo}_${i}`,
          type: 'employee',
          riskType: 'gun_machine_behavior',
          level: 'high',
          description: `${gunNo}在${thresholdMinutes}分钟内${windowOrders.length}笔加油量完全相同(${targetQuantity}升)`,
          timestamp: startTime,
          orderId: windowOrders[0].orderId,
          amount: totalAmount,
          person: gunNo,
          details: {
            orders: windowOrders.map(o => o.orderId),
            quantity: targetQuantity,
            count: windowOrders.length,
          },
        });
        i += windowOrders.length - 1; // 跳过已处理的
      }
    }
  });

  return risks;
}

// 检测夜间异常
function detectNightAnomaly(orders: Order[]): RiskAlert[] {
  const risks: RiskAlert[] = [];
  const thresholdPercent = 20;
  const nightStart = 22;
  const nightEnd = 6;

  const nightOrders = orders.filter(o => {
    const hour = new Date(o.transactionTime).getHours();
    return hour >= nightStart || hour < nightEnd;
  });

  const nightPercent = (nightOrders.length / orders.length) * 100;

  if (nightPercent > thresholdPercent) {
    risks.push({
      id: 'night_anomaly_overall',
      type: 'system',
      riskType: 'night_anomaly',
      level: 'low',
      description: `夜间(22:00-06:00)交易占比${nightPercent.toFixed(1)}%，超过${thresholdPercent}%阈值`,
      timestamp: new Date(),
      orderId: '',
      amount: nightOrders.reduce((sum, o) => sum + o.actualAmount, 0),
      person: '系统',
      details: {
        nightCount: nightOrders.length,
        totalCount: orders.length,
        nightPercent,
      },
    });
  }

  return risks;
}

// 检测非营业时间
function detectNonBusinessTime(orders: Order[]): RiskAlert[] {
  const risks: RiskAlert[] = [];
  const nonBusinessStart = 2;
  const nonBusinessEnd = 5;

  const nonBusinessOrders = orders.filter(o => {
    const hour = new Date(o.transactionTime).getHours();
    return hour >= nonBusinessStart && hour < nonBusinessEnd;
  });

  if (nonBusinessOrders.length > 0) {
    nonBusinessOrders.forEach(order => {
      risks.push({
        id: `non_biz_${order.orderId}`,
        type: 'employee',
        riskType: 'non_business_time',
        level: 'low',
        description: `非营业时间(02:00-05:00)存在交易记录`,
        timestamp: new Date(order.transactionTime),
        orderId: order.orderId,
        amount: order.actualAmount,
        person: order.cashier,
        details: {
          hour: new Date(order.transactionTime).getHours(),
          terminal: order.terminal,
        },
      });
    });
  }

  return risks;
}

// 统计风险客户
export function getRiskCustomerStats(risks: RiskAlert[]) {
  const customerRisks = new Map<string, { high: number; medium: number; low: number }>();

  risks.forEach(risk => {
    if (risk.type === 'customer') {
      const existing = customerRisks.get(risk.person) || { high: 0, medium: 0, low: 0 };
      existing[risk.level]++;
      customerRisks.set(risk.person, existing);
    }
  });

  return customerRisks;
}

// 按风险等级汇总
export function summarizeRisksByLevel(risks: RiskAlert[]) {
  return {
    high: risks.filter(r => r.level === 'high').length,
    medium: risks.filter(r => r.level === 'medium').length,
    low: risks.filter(r => r.level === 'low').length,
  };
}
