// 加油站AI智能营销官 - 全局状态管理

import { create } from 'zustand';
import { Order, Customer, SalesOverview, RiskAlert, SystemConfig, DailySales, CustomerSegment } from './types';
import { DEFAULT_CONFIG } from './constants';
import { calculateSalesOverview, calculateDailySales } from './dataProcessor';
import { aggregateCustomers, classifyCustomers } from './customerClassifier';
import { detectAllRisks } from './fraudDetector';
import { parseExcelFileSmart } from './excelParser';
import { api, User } from './api';

// 获取存储的用户信息
function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

function getStoredToken(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!localStorage.getItem('token');
  } catch {
    return false;
  }
}

// 会员权限配置
const MEMBER_PERMISSIONS = {
  free: ['basic_analysis', 'base_customer_export'],
  primary: ['basic_analysis', 'base_customer_export', 'churn_export', 'financial_risk_export'],
  advanced: ['basic_analysis', 'base_customer_export', 'churn_export', 'financial_risk_export', 'ai_insights', 'auto_recall'],
  ultimate: ['basic_analysis', 'base_customer_export', 'churn_export', 'financial_risk_export', 'ai_insights', 'auto_recall', 'priority_support', 'custom_report']
};

interface AppState {
  // 数据状态
  orders: Order[];
  customers: Customer[];
  salesOverview: SalesOverview | null;
  dailySales: DailySales[];
  customerSegments: CustomerSegment[];
  riskAlerts: RiskAlert[];

  // UI状态
  isLoading: boolean;
  error: string | null;
  hasData: boolean;

  // 用户状态
  user: User | null;
  isLoggedIn: boolean;

  // 配置状态
  config: SystemConfig;

  // 操作方法
  importData: (file: File) => Promise<void>;
  clearData: () => void;
  updateConfig: (config: Partial<SystemConfig>) => void;
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (feature: string) => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  // 初始状态
  orders: [],
  customers: [],
  salesOverview: null,
  dailySales: [],
  customerSegments: [],
  riskAlerts: [],
  isLoading: false,
  error: null,
  hasData: false,
  user: getStoredUser(),
  isLoggedIn: getStoredToken(),
  config: DEFAULT_CONFIG as unknown as SystemConfig,

  // 导入数据
  importData: async (file: File) => {
    set({ isLoading: true, error: null });

    try {
      // 解析Excel
      const result = await parseExcelFileSmart(file);

      if (result.orders.length === 0) {
        throw new Error('没有找到有效的订单数据');
      }

      const orders = result.orders;

      // 计算数据截止日（最后一笔消费时间）
      const transactionTimes = orders.map(o => new Date(o.transactionTime).getTime());
      const dataEndDate = new Date(Math.max(...transactionTimes));

      // 计算各项指标
      const salesOverview = calculateSalesOverview(orders);
      const dailySales = calculateDailySales(orders);
      const customers = aggregateCustomers(orders);
      const customerSegments = classifyCustomers(customers, orders, dataEndDate);
      const riskAlerts = detectAllRisks(orders);

      set({
        orders,
        customers,
        salesOverview,
        dailySales,
        customerSegments,
        riskAlerts,
        hasData: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || '数据导入失败',
        isLoading: false,
      });
      throw error;
    }
  },

  // 清除数据
  clearData: () => {
    set({
      orders: [],
      customers: [],
      salesOverview: null,
      dailySales: [],
      customerSegments: [],
      riskAlerts: [],
      hasData: false,
      error: null,
    });
  },

  // 更新配置
  updateConfig: (newConfig: Partial<SystemConfig>) => {
    const config = { ...get().config, ...newConfig };
    set({ config });

    // 如果有数据，重新计算客户分类
    if (get().hasData) {
      const customerSegments = classifyCustomers(get().customers, get().orders, new Date());
      set({ customerSegments });
    }
  },

  // 登录
  login: (user: User) => {
    set({ user, isLoggedIn: true });
  },

  // 登出
  logout: () => {
    api.clearToken();
    set({ user: null, isLoggedIn: false });
  },

  // 检查权限
  hasPermission: (feature: string) => {
    const { user } = get();
    if (!user) return false;
    const permissions = MEMBER_PERMISSIONS[user.memberLevel as keyof typeof MEMBER_PERMISSIONS] || [];
    return permissions.includes(feature);
  },
}));
