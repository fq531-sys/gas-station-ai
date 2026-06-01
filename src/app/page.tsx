'use client';

import { useState, useCallback, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatQuantity } from '@/lib/dataProcessor';
import { CUSTOMER_TYPE_CONFIG } from '@/lib/constants';
import dayjs from 'dayjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoginModal from '@/components/LoginModal';
import AIChatBox from '@/components/AIChatBox';
import AIAssistantPanel from '@/components/AIAssistantPanel';

export default function Home() {
  const {
    isLoading,
    error,
    hasData,
    orders,
    salesOverview,
    customerSegments,
    riskAlerts,
    config,
    importData,
    clearData,
  } = useStore();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chartView, setChartView] = useState<'weekly' | 'monthly'>('weekly');
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginSuccessCallback, setLoginSuccessCallback] = useState<(() => void) | null>(null);

  // 登录状态
  const isLoggedIn = useStore(state => state.isLoggedIn);
  const user = useStore(state => state.user);
  const login = useStore(state => state.login);
  const hasPermission = useStore(state => state.hasPermission);

  // 处理登录成功
  const handleLoginSuccess = (loggedInUser: any) => {
    if (loggedInUser) {
      login(loggedInUser);
      // 如果有回调函数，执行它
      if (loginSuccessCallback) {
        loginSuccessCallback();
        setLoginSuccessCallback(null);
      }
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.xlsx')) {
      setSelectedFile(file);
      await importData(file);
    }
  }, [importData]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      await importData(file);
    }
  };

  // 处理图表数据 - 按周和按月
  const chartData = useMemo(() => {
    if (!salesOverview?.oilTypeDailySales?.length) return { weekly: [], monthly: [] };

    const data = salesOverview.oilTypeDailySales;

    // 按周分组
    const weeklyMap = new Map<string, { week: string; '92#': number; '95#': number; '98#': number; '0#': number; gasoline: number; diesel: number; dayCount: number }>();
    data.forEach(d => {
      const date = dayjs(d.date);
      const weekStart = date.startOf('week').format('YYYY-MM-DD');
      const weekLabel = `${date.startOf('week').format('MM/DD')}-${date.endOf('week').format('MM/DD')}`;

      if (!weeklyMap.has(weekStart)) {
        weeklyMap.set(weekStart, { week: weekLabel, '92#': 0, '95#': 0, '98#': 0, '0#': 0, gasoline: 0, diesel: 0, dayCount: 0 });
      }
      const week = weeklyMap.get(weekStart)!;
      week['92#'] += d['92#'] || 0;
      week['95#'] += d['95#'] || 0;
      week['98#'] += d['98#'] || 0;
      week['0#'] += d['0#'] || 0;
      week.gasoline += d.gasoline || 0;
      week.diesel += d.diesel || 0;
      week.dayCount += 1; // 记录该周有数据的天数
    });

    // 按周计算日均（用实际数据天数去除）
    const weeklyData = Array.from(weeklyMap.values()).map(w => ({
      week: w.week,
      '92#': Math.round(w['92#'] / w.dayCount * 10) / 10,
      '95#': Math.round(w['95#'] / w.dayCount * 10) / 10,
      '98#': Math.round(w['98#'] / w.dayCount * 10) / 10,
      '0#': Math.round(w['0#'] / w.dayCount * 10) / 10,
      gasoline: Math.round(w.gasoline / w.dayCount * 10) / 10,
      diesel: Math.round(w.diesel / w.dayCount * 10) / 10,
      total: Math.round((w.gasoline + w.diesel) / w.dayCount * 10) / 10,
      gasolineTon: Math.round(w.gasoline / w.dayCount / 1350 * 100) / 100,
      dieselTon: Math.round(w.diesel / w.dayCount / 1200 * 100) / 100,
      totalTon: Math.round(w.gasoline / w.dayCount / 1350 * 100) / 100 + Math.round(w.diesel / w.dayCount / 1200 * 100) / 100,
    }));
    const monthlyMap = new Map<string, { monthKey: string; month: string; '92#': number; '95#': number; '98#': number; '0#': number; gasoline: number; diesel: number; dayCount: number }>();
    data.forEach(d => {
      const date = dayjs(d.date);
      const monthKey = date.format('YYYY-MM');
      const monthLabel = date.format('YYYY年MM月');

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { monthKey, month: monthLabel, '92#': 0, '95#': 0, '98#': 0, '0#': 0, gasoline: 0, diesel: 0, dayCount: 0 });
      }
      const month = monthlyMap.get(monthKey)!;
      month['92#'] += d['92#'] || 0;
      month['95#'] += d['95#'] || 0;
      month['98#'] += d['98#'] || 0;
      month['0#'] += d['0#'] || 0;
      month.gasoline += d.gasoline || 0;
      month.diesel += d.diesel || 0;
      month.dayCount += 1; // 记录该月有数据的天数
    });

    // 按月计算日均（用实际数据天数去除）
    const monthlyData = Array.from(monthlyMap.values()).map(m => ({
      month: m.month.replace('年', '/').replace('月', ''),
      '92#': Math.round(m['92#'] / m.dayCount * 10) / 10,
      '95#': Math.round(m['95#'] / m.dayCount * 10) / 10,
      '98#': Math.round(m['98#'] / m.dayCount * 10) / 10,
      '0#': Math.round(m['0#'] / m.dayCount * 10) / 10,
      gasoline: Math.round(m.gasoline / m.dayCount * 10) / 10,
      diesel: Math.round(m.diesel / m.dayCount * 10) / 10,
      total: Math.round((m.gasoline + m.diesel) / m.dayCount * 10) / 10,
      gasolineTon: Math.round(m.gasoline / m.dayCount / 1350 * 100) / 100,
      dieselTon: Math.round(m.diesel / m.dayCount / 1200 * 100) / 100,
      totalTon: Math.round(m.gasoline / m.dayCount / 1350 * 100) / 100 + Math.round(m.diesel / m.dayCount / 1200 * 100) / 100,
    }));

    return { weekly: weeklyData, monthly: monthlyData, yAxisMax: 0 };
  }, [salesOverview]);

  // 计算Y轴最大值（向上取整到最接近的5的倍数，如果恰好是5的倍数则再加一个5）
  const yAxisMax = useMemo(() => {
    const allData = [...chartData.weekly, ...chartData.monthly];
    if (allData.length === 0) return 50;
    const maxTotal = Math.max(...allData.map(d => d.totalTon || 0));
    const rounded = Math.ceil(maxTotal / 5) * 5;
    if (rounded <= maxTotal) {
      return rounded + 5;
    }
    return rounded;
  }, [chartData]);

  // 导出客户表
  const exportCustomerTable = (type: string) => {
    // 免费类型直接导出（暂时隐藏付费功能）
    doExportCustomerTable(type);
  };

  // 执行导出
  const doExportCustomerTable = (type: string) => {
    let customersToExport: any[] = [];
    const allCustomers = useStore.getState().customers;
    const orders = useStore.getState().orders;

    const typeNameMap: Record<string, string> = {
      base: '基本盘客户',
      risk: '流失风险客户',
      churn: '流失客户',
      financialRisk: '财务风险客户',
    };

    if (type === 'base') {
      customersToExport = allCustomers.filter(c => c.customerType === 'base');
    } else if (type === 'risk') {
      customersToExport = allCustomers.filter(c => c.customerType === 'risk');
    } else if (type === 'churn') {
      customersToExport = allCustomers.filter(c => c.customerType === 'churn');
    } else if (type === 'financialRisk') {
      customersToExport = allCustomers.filter(c => c.customerType === 'financialRisk');
    }

    if (customersToExport.length === 0) {
      alert('没有可导出的客户');
      return;
    }

    alert(`正在导出${typeNameMap[type] || type}，请稍候...`);

    const data = customersToExport.map((c, index) => {
      const baseData: any = {
        '序号': index + 1,
        '客户标识': c.customerId,
        '客户电话': c.phone || '-',
        '加油油品': c.oilTypePreference?.join(', ') || '-',
        '累计加油金额': c.totalAmount?.toFixed(2) || '0',
        '最后一次消费时间': c.lastOrderDate ? dayjs(c.lastOrderDate).format('YYYY-MM-DD') : '-',
      };

      // 财务风险客户需要添加原因说明和消费时间段
      if (type === 'financialRisk') {
        const { reason, timePeriods } = getFinancialRiskDetail(c.customerId, orders);
        baseData['风险原因'] = reason;
        baseData['消费时间段'] = timePeriods;
      }

      return baseData;
    });

    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      const typeNameMap: Record<string, string> = {
        base: '基本盘客户',
        risk: '流失风险客户',
        churn: '流失客户',
        financialRisk: '财务风险客户',
      };
      const actionNameMap: Record<string, string> = {
        base: '深度运营',
        risk: '客户召回',
        churn: '客户召回',
        financialRisk: '风险排查',
      };
      XLSX.utils.book_append_sheet(wb, ws, typeNameMap[type] || '客户表');
      const fileName = `客户表_${actionNameMap[type] || '导出'}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`${typeNameMap[type] || '客户表'}导出成功！共 ${customersToExport.length} 条记录`);
    });
  };

  // 模拟支付（实际生产环境需要接入真实支付）
  const handlePay = () => {
    setShowPaywallModal(false);
    alert('支付功能开发中，请联系客服开通会员权限！\n\n客服电话：400-XXX-XXXX');
  };

  // 获取财务风险原因和消费时间段
  const getFinancialRiskDetail = (customerId: string, orders: any[]): { reason: string; timePeriods: string } => {
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

    const reasons: string[] = [];
    const timePeriods: string[] = [];

    // 检查单日消费>=2
    const dayOrdersMap = new Map<string, any[]>();
    customerOrders.forEach(o => {
      const dayKey = dayjs(o.transactionTime).format('YYYY-MM-DD');
      if (!dayOrdersMap.has(dayKey)) {
        dayOrdersMap.set(dayKey, []);
      }
      dayOrdersMap.get(dayKey)!.push(o);
    });

    dayOrdersMap.forEach((dayOrders, dayKey) => {
      if (dayOrders.length >= 2) {
        reasons.push(`单日消费≥2次(${dayKey})`);
        const times = dayOrders.map(o => dayjs(o.transactionTime).format('HH:mm')).join(', ');
        timePeriods.push(`${dayKey} ${times} (${dayOrders.length}次)`);
      }
    });

    // 检查7天内消费>=3
    const sortedOrders = [...customerOrders].sort((a, b) =>
      new Date(a.transactionTime).getTime() - new Date(b.transactionTime).getTime()
    );
    for (let i = 0; i < sortedOrders.length; i++) {
      const startDate = new Date(sortedOrders[i].transactionTime);
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const ordersIn7Days = sortedOrders.filter(o => {
        const orderDate = new Date(o.transactionTime);
        return orderDate >= startDate && orderDate <= endDate;
      });
      if (ordersIn7Days.length >= 3 && !reasons.some(r => r.includes('7天内消费'))) {
        reasons.push(`7天内消费≥3次(${dayjs(startDate).format('MM/DD')}-${dayjs(endDate).format('MM/DD')})`);
        timePeriods.push(`7天周期: ${dayjs(startDate).format('YYYY-MM-DD')} 起，${ordersIn7Days.length}次消费`);
        break;
      }
    }

    // 检查多油品
    const oilTypesSet = new Set<string>();
    customerOrders.forEach(o => oilTypesSet.add(o.oilType));
    if (oilTypesSet.size >= 2) {
      reasons.push(`消费多油品(${Array.from(oilTypesSet).join(', ')})`);
    }

    return {
      reason: reasons.length > 0 ? reasons.join('; ') : '升优惠力度异常',
      timePeriods: timePeriods.length > 0 ? timePeriods.join('; ') : '-',
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-end mb-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow">
                <a href="/member-center" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  👑 会员中心
                </a>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-600">👤 {user?.phone}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user?.memberLevel === 'ultimate' ? 'bg-purple-100 text-purple-700' :
                  user?.memberLevel === 'advanced' ? 'bg-blue-100 text-blue-700' :
                  user?.memberLevel === 'primary' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {user?.memberLevel === 'ultimate' ? '终极' :
                   user?.memberLevel === 'advanced' ? '高级' :
                   user?.memberLevel === 'primary' ? '初级' : '免费'}会员
                </span>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-white rounded-full shadow text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                登录/注册
              </button>
            )}
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🚗 加油站AI智能营销官
          </h1>
          <p className="text-lg text-gray-600">
            你的加油站有一位24小时在线的AI运营专家
          </p>
        </header>

        {!hasData ? (
          /* 数据导入区域 */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                上传加油站订单数据
              </h2>
              <p className="text-gray-500 mb-6">
                支持Excel格式（.xlsx），数据将仅存储在本地浏览器中
              </p>

              <label className="inline-block cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      解析中...
                    </>
                  ) : (
                    <>
                      选择文件
                    </>
                  )}
                </span>
              </label>

              {selectedFile && (
                <p className="mt-4 text-sm text-gray-500">
                  已选择: {selectedFile.name}
                </p>
              )}

              {error && (
                <p className="mt-4 text-red-500">{error}</p>
              )}
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">8+</div>
                <div className="text-sm text-gray-500">分析维度</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">5+</div>
                <div className="text-sm text-gray-500">AI引擎</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">4级</div>
                <div className="text-sm text-gray-500">流失分层</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">AI</div>
                <div className="text-sm text-gray-500">智能解读</div>
              </div>
            </div>
          </div>
        ) : (
          /* 数据展示区域 */
          <div className="space-y-6">
            {/* AI助手 + 智能分析摘要 并排 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧：油站问题智能分析摘要 */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  🔍 油站问题智能分析摘要
                </h2>
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    ⚠️ <strong>仅根据数据分析得出，请结合油站实际情况判断，具体数据见下方数据概览</strong>
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    {salesOverview && customerSegments.length > 0 ? (
                      <>
                        {customerSegments.find(s => s.type === 'churn') && (
                          <p>• 检测到 <span className="text-red-600 font-medium">{customerSegments.find(s => s.type === 'churn')?.count}</span> 位流失客户，建议及时开展召回活动</p>
                        )}
                        {customerSegments.find(s => s.type === 'risk') && (
                          <p>• 有 <span className="text-orange-600 font-medium">{customerSegments.find(s => s.type === 'risk')?.count}</span> 位客户处于流失风险期，需重点关注</p>
                        )}
                        {customerSegments.find(s => s.type === 'financialRisk')?.count && customerSegments.find(s => s.type === 'financialRisk')!.count > 0 && (
                          <p>• 发现 <span className="text-red-600 font-medium">{customerSegments.find(s => s.type === 'financialRisk')!.count}</span> 位客户存在财务风险，建议重点排查</p>
                        )}
                        {(salesOverview.statistics.avgOrderAmount.gasoline < 200 || salesOverview.statistics.avgOrderAmount.diesel < 200) && (
                          <p>• 客单价偏低，建议优化营销策略提升单笔消费</p>
                        )}
                        {(salesOverview.statistics.avgDiscountCost.gasoline > 0.5 || salesOverview.statistics.avgDiscountCost.diesel > 0.5) && (
                          <p>• 升油优惠成本偏高，建议优化优惠发放策略</p>
                        )}
                        {!customerSegments.find(s => s.type === 'churn') && !customerSegments.find(s => s.type === 'risk') && (!customerSegments.find(s => s.type === 'financialRisk') || customerSegments.find(s => s.type === 'financialRisk')!.count === 0) && (
                          <p>• 数据整体表现良好，暂未检测到明显异常</p>
                        )}
                      </>
                    ) : (
                      <p>请先上传数据，系统将自动分析油站运营问题</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 右侧：AI智能助手 */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🤖</span>
                  <h2 className="text-lg font-bold">AI智能营销官</h2>
                </div>
                <p className="text-blue-100 text-sm mb-4">
                  基于数据分析的智能顾问，帮你诊断油站问题、提供运营建议
                </p>

                {orders.length > 0 ? (
                  <AIAssistantPanel />
                ) : (
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <p className="text-sm text-blue-100">上传数据后体验AI分析</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-blue-400/30">
                  <a
                    href="/member-center"
                    className="block w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-center text-sm transition-colors"
                  >
                    升级会员解锁更多功能
                  </a>
                </div>
              </div>
            </div>

            {/* 客户构成 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">👥 客户构成分析</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {customerSegments.map((segment) => (
                  <div
                    key={segment.type}
                    className="p-4 rounded-xl text-center cursor-help relative"
                    style={{ backgroundColor: segment.color + '15' }}
                    title={CUSTOMER_TYPE_CONFIG[segment.type]?.description || ''}
                  >
                    <div
                      className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold"
                      style={{ backgroundColor: segment.color }}
                    >
                      {segment.count}
                    </div>
                    <div className="font-medium text-gray-700 text-sm">
                      {segment.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {segment.percentage.toFixed(1)}%
                    </div>
                    {segment.type === 'base' && (
                      <button
                        onClick={() => exportCustomerTable('base')}
                        title="下载客户列表，进行深度运营"
                        className="mt-2 w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-1"
                      >
                        <span className="text-lg">⬇</span> 深度运营
                      </button>
                    )}
                    {(segment.type === 'risk' || segment.type === 'churn') && (
                      <button
                        onClick={() => exportCustomerTable(segment.type)}
                        title="下载客户列表，进行客户召回"
                        className="mt-2 w-full px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm flex items-center justify-center gap-1"
                      >
                        <span className="text-lg">⬇</span> 客户召回
                      </button>
                    )}
                    {segment.type === 'financialRisk' && (
                      <button
                        onClick={() => exportCustomerTable('financialRisk')}
                        title="下载客户列表，进行风险排查"
                        className="mt-2 w-full px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-1"
                      >
                        <span className="text-lg">⬇</span> 风险排查
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 数据概览卡片 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-800">
                    📊 数据概览
                  </h2>
                  {salesOverview?.statistics && (
                    <div className="px-3 py-1 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full text-center">
                      <span className="text-xs text-slate-500">统计</span>
                      <span className="text-sm font-bold text-slate-700 ml-1">{salesOverview.statistics.totalDays}</span>
                      <span className="text-xs text-slate-500">天</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={clearData}
                  className="text-sm text-gray-500 hover:text-red-500"
                >
                  重新上传数据
                </button>
              </div>

              {salesOverview?.statistics && (
                <>
                  {/* 核心数据指标 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-center">
                      <div className="text-xs text-blue-600 mb-1">92#日均</div>
                      <div className="text-xl font-bold text-blue-700">
                        {salesOverview.statistics.dailyAvgByOilType['92#'].toFixed(1)}升
                      </div>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl text-center">
                      <div className="text-xs text-green-600 mb-1">95#日均</div>
                      <div className="text-xl font-bold text-green-700">
                        {salesOverview.statistics.dailyAvgByOilType['95#'].toFixed(1)}升
                      </div>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl text-center">
                      <div className="text-xs text-purple-600 mb-1">98#日均</div>
                      <div className="text-xl font-bold text-purple-700">
                        {salesOverview.statistics.dailyAvgByOilType['98#'].toFixed(1)}升
                      </div>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl text-center">
                      <div className="text-xs text-orange-600 mb-1">0#日均</div>
                      <div className="text-xl font-bold text-orange-700">
                        {salesOverview.statistics.dailyAvgByOilType['0#'].toFixed(1)}升
                      </div>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl text-center">
                      <div className="text-xs text-cyan-600 mb-1">总日均</div>
                      <div className="text-xl font-bold text-cyan-700">
                        {(salesOverview.statistics.dailyAvgByOilType['92#'] + salesOverview.statistics.dailyAvgByOilType['95#'] + salesOverview.statistics.dailyAvgByOilType['98#'] + salesOverview.statistics.dailyAvgByOilType['0#']).toFixed(1)}升
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* 客单价 */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm">
                      <div className="text-sm text-blue-600 font-medium mb-3 text-center">客单价</div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white/60 p-2 rounded-lg text-center">
                          <div className="text-xs text-blue-400 mb-1">汽油</div>
                          <div className="text-xl font-bold text-blue-700">
                            ¥{salesOverview.statistics.avgOrderAmount.gasoline.toFixed(0)}
                          </div>
                        </div>
                        <div className="flex-1 bg-white/60 p-2 rounded-lg text-center">
                          <div className="text-xs text-orange-500 mb-1">柴油</div>
                          <div className="text-xl font-bold text-orange-700">
                            ¥{salesOverview.statistics.avgOrderAmount.diesel.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* 客单升 */}
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm">
                      <div className="text-sm text-green-600 font-medium mb-3 text-center">客单升</div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white/60 p-2 rounded-lg text-center">
                          <div className="text-xs text-blue-400 mb-1">汽油</div>
                          <div className="text-xl font-bold text-green-700">
                            {salesOverview.statistics.avgOrderQuantity.gasoline.toFixed(1)}升
                          </div>
                        </div>
                        <div className="flex-1 bg-white/60 p-2 rounded-lg text-center">
                          <div className="text-xs text-orange-500 mb-1">柴油</div>
                          <div className="text-xl font-bold text-orange-700">
                            {salesOverview.statistics.avgOrderQuantity.diesel.toFixed(1)}升
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* 升优惠成本 */}
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm">
                      <div className="text-sm text-purple-600 font-medium mb-3 text-center">升优惠成本</div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white/60 p-2 rounded-lg text-center">
                          <div className="text-xs text-blue-400 mb-1">汽油</div>
                          <div className="text-xl font-bold text-purple-700">
                            ¥{salesOverview.statistics.avgDiscountCost.gasoline.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex-1 bg-white/60 p-2 rounded-lg text-center">
                          <div className="text-xs text-orange-500 mb-1">柴油</div>
                          <div className="text-xl font-bold text-orange-700">
                            ¥{salesOverview.statistics.avgDiscountCost.diesel.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 折线图切换 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setChartView('weekly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          chartView === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        周日均
                      </button>
                      <button
                        onClick={() => setChartView('monthly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          chartView === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        月日均
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      数据周期：{dayjs(salesOverview.statistics.dateRange.start).format('YYYY/MM/DD')} - {dayjs(salesOverview.statistics.dateRange.end).format('YYYY/MM/DD')}
                    </div>
                  </div>

                  {/* 日均销量折线图 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-3">日均销量（吨）</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartView === 'weekly' ? chartData.weekly : chartData.monthly as any}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis
                            dataKey={chartView === 'weekly' ? 'week' : 'month'}
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                          />
                          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}t`} domain={[0, yAxisMax]} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                            formatter={(value) => [`${Number(value).toFixed(2)}吨`, '']}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="gasolineTon" name="汽油" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="dieselTon" name="柴油" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="totalTon" name="总销量" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 快捷操作 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/dashboard"
                className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform">📈</span>
                  <div>
                    <div className="font-semibold text-gray-800">查看详细报告</div>
                    <div className="text-sm text-gray-500">8大分析维度，问题预警</div>
                  </div>
                </div>
              </a>

              <a
                href="/recall"
                className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform">📞</span>
                  <div>
                    <div className="font-semibold text-gray-800">会员召回</div>
                    <div className="text-sm text-gray-500">AI筛选流失客户</div>
                  </div>
                </div>
              </a>

              <a
                href="/settings"
                className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform">⚙️</span>
                  <div>
                    <div className="font-semibold text-gray-800">系统设置</div>
                    <div className="text-sm text-gray-500">配置分析条件</div>
                  </div>
                </div>
              </a>
            </div>

            {/* 数据统计 */}
            <div className="bg-white rounded-xl shadow p-4 text-center text-sm text-gray-500">
              共导入 {orders.length} 条订单记录 · 数据时间范围：{salesOverview?.dateRange && dayjs(salesOverview.dateRange.start).format('MM/DD')} - {salesOverview?.dateRange && dayjs(salesOverview.dateRange.end).format('MM/DD')}
            </div>

            {/* 付费弹窗 */}
            {showPaywallModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                  <div className="text-center">
                    <div className="text-6xl mb-4">👑</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">开通初级会员</h3>
                    <p className="text-gray-600 mb-4">
                      {pendingExportType === 'churn' ? '客户召回功能' : '风险排查功能'}属于初级会员服务
                    </p>

                    {/* 价值说明 */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-5 mb-5 text-left">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{pendingExportType === 'churn' ? '📞' : '🔍'}</span>
                        <span className="font-bold text-gray-800">
                          {pendingExportType === 'churn' ? '流失客户召回' : '财务风险排查'}
                        </span>
                      </div>
                      {pendingExportType === 'churn' ? (
                        <ul className="text-sm text-gray-600 space-y-2 ml-8">
                          <li>• 识别已沉默的客户群体</li>
                          <li>• 获取客户消费记录和联系方式</li>
                          <li>• 针对性的召回策略提升复购</li>
                          <li>• 挽回流失客户，提升营收</li>
                        </ul>
                      ) : (
                        <ul className="text-sm text-gray-600 space-y-2 ml-8">
                          <li>• 发现异常消费模式和潜在欺诈</li>
                          <li>• 查看详细消费时间段和频次</li>
                          <li>• 识别恶意套现风险客户</li>
                          <li>• 保护加油站经营利益</li>
                        </ul>
                      )}
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-5">
                      <div className="text-sm text-gray-500 mb-1">终身有效会员</div>
                      <div className="text-4xl font-bold text-blue-600">¥28.8</div>
                      <div className="text-xs text-gray-400 mt-1">一次付费，永久使用</div>
                    </div>

                    <div className="text-left text-sm text-gray-600 mb-5 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> 无限下载流失客户名单
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> 无限下载财务风险客户名单
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> 获取详细消费时间段
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> 优先客服支持
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowPaywallModal(false)}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        稍后再说
                      </button>
                      <button
                        onClick={() => {
                          setShowPaywallModal(false);
                          // 模拟支付成功，直接执行导出
                          doExportCustomerTable(pendingExportType!);
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium shadow-lg"
                      >
                        立即开通 ¥28.8
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">
                      支付遇到问题？联系客服：400-XXX-XXXX
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 登录弹窗 */}
            <LoginModal
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              onLoginSuccess={handleLoginSuccess}
            />

            {/* AI对话助手 */}
            <AIChatBox />
          </div>
        )}
      </div>
    </div>
  );
}
