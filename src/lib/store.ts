// 加油站AI智能营销官 - 全局状态管理

import { create } from 'zustand';
import { Order, Customer, SalesOverview, RiskAlert, SystemConfig, DailySales, CustomerSegment, AnalysisRecord } from './types';
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

// 获取历史分析记录
function getAnalysisRecords(): AnalysisRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const recordsStr = localStorage.getItem('analysisRecords');
    return recordsStr ? JSON.parse(recordsStr) : [];
  } catch {
    return [];
  }
}

// 保存分析记录到localStorage（限制大小避免超出配额）
function saveAnalysisRecordToStorage(record: AnalysisRecord) {
  if (typeof window === 'undefined') return;
  try {
    // 只保存摘要信息，不保存完整订单数据以节省存储空间
    const summaryRecord = {
      id: record.id,
      createdAt: record.createdAt,
      fileName: record.fileName,
      dataSummary: record.dataSummary,
      // 不保存orders、salesOverview、dailySales、customerSegments、riskAlerts等大数据
    };
    const records = getAnalysisRecords();
    records.unshift(summaryRecord as AnalysisRecord);
    // 最多保存20条记录
    const trimmed = records.slice(0, 20);
    localStorage.setItem('analysisRecords', JSON.stringify(trimmed));
  } catch (e) {
    console.error('保存分析记录失败:', e);
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

  // 分析记录状态
  analysisRecords: AnalysisRecord[];
  currentRecordId: string | null;

  // 配置状态
  config: SystemConfig;

  // 操作方法
  importData: (file: File) => Promise<void>;
  clearData: () => void;
  updateConfig: (config: Partial<SystemConfig>) => void;
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (feature: string) => boolean;
  loadAnalysisRecord: (recordId: string) => void;
  deleteAnalysisRecord: (recordId: string) => void;
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
  analysisRecords: getAnalysisRecords(),
  currentRecordId: null,

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
      const transactionTimes = orders.map(o => new Date(o.transactionTime).getTime()).filter(t => !isNaN(t));
      if (transactionTimes.length === 0) {
        throw new Error('没有找到有效的订单数据（所有记录的交易时间均无效）');
      }
      const dataEndDate = new Date(Math.max(...transactionTimes));

      // 计算各项指标
      const salesOverview = calculateSalesOverview(orders);
      const dailySales = calculateDailySales(orders);
      const customers = aggregateCustomers(orders);
      console.log('聚合后的客户数量:', customers.length);
      console.log('客户样本:', customers.slice(0, 3).map(c => ({ id: c.customerId, phone: c.phone, orders: c.totalOrders })));
      const customerSegments = classifyCustomers(customers, orders, dataEndDate);
      const riskAlerts = detectAllRisks(orders);

      // 创建分析记录
      const record: AnalysisRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        fileName: file.name,
        dataSummary: {
          totalOrders: salesOverview.totalOrders,
          totalQuantity: salesOverview.totalQuantity,
          totalAmount: salesOverview.totalAmount,
          dateRange: {
            start: salesOverview.dateRange.start.toISOString(),
            end: salesOverview.dateRange.end.toISOString(),
          },
        },
        orders,
        salesOverview,
        dailySales,
        customerSegments,
        riskAlerts,
      };

      // 保存到localStorage
      saveAnalysisRecordToStorage(record);

      set({
        orders,
        customers,
        salesOverview,
        dailySales,
        customerSegments,
        riskAlerts,
        hasData: true,
        isLoading: false,
        analysisRecords: getAnalysisRecords(),
        currentRecordId: record.id,
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

  // 加载历史分析记录
  loadAnalysisRecord: (recordId: string) => {
    const records = getAnalysisRecords();
    const record = records.find(r => r.id === recordId);
    if (!record) {
      console.error('找不到分析记录:', recordId);
      return;
    }

    set({
      orders: record.orders,
      customers: aggregateCustomers(record.orders),
      salesOverview: record.salesOverview,
      dailySales: record.dailySales,
      customerSegments: record.customerSegments,
      riskAlerts: record.riskAlerts,
      hasData: true,
      currentRecordId: recordId,
    });
  },

  // 删除历史分析记录
  deleteAnalysisRecord: (recordId: string) => {
    const records = getAnalysisRecords();
    const filtered = records.filter(r => r.id !== recordId);
    localStorage.setItem('analysisRecords', JSON.stringify(filtered));
    set({ analysisRecords: filtered });
  },
}));
