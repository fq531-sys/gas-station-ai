'use client';

import { useState, useCallback, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatQuantity } from '@/lib/dataProcessor';
import { CUSTOMER_TYPE_CONFIG } from '@/lib/constants';
import dayjs from 'dayjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    }));

    // 按月分组
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
    }));

    return { weekly: weeklyData, monthly: monthlyData };
  }, [salesOverview]);

  // 导出客户表
  const exportCustomerTable = (type: string) => {
    let customersToExport: any[] = [];
    const allCustomers = useStore.getState().customers;

    if (type === 'base') {
      // 基本盘客户
      customersToExport = allCustomers.filter(c => c.customerType === 'base');
    } else if (type === 'risk') {
      // 流失风险客户
      customersToExport = allCustomers.filter(c => c.customerType === 'risk');
    } else if (type === 'churn') {
      // 流失客户
      customersToExport = allCustomers.filter(c => c.customerType === 'churn');
    }

    if (customersToExport.length === 0) {
      alert('没有可导出的客户');
      return;
    }

    const data = customersToExport.map((c, index) => ({
      '序号': index + 1,
      '客户标识': c.customerId,
      '客户电话': c.phone || '-',
      '加油油品': c.oilTypePreference?.join(', ') || '-',
      '累计加油金额': c.totalAmount?.toFixed(2) || '0',
      '最后一次消费时间': c.lastOrderDate ? dayjs(c.lastOrderDate).format('YYYY-MM-DD') : '-',
    }));

    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '客户表');
      XLSX.writeFile(wb, `客户表_${type}_${dayjs().format('YYYYMMDD')}.xlsx`);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <header className="text-center mb-8">
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
            {/* 数据概览卡片 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  📊 数据概览
                </h2>
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                      <div className="text-sm text-gray-500 mb-1">客单价</div>
                      <div className="text-2xl font-bold text-gray-700">
                        ¥{salesOverview.statistics.avgOrderAmount.toFixed(0)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                      <div className="text-sm text-gray-500 mb-1">客单升</div>
                      <div className="text-2xl font-bold text-gray-700">
                        {salesOverview.statistics.avgOrderQuantity.toFixed(1)}升
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                      <div className="text-sm text-gray-500 mb-1">升油优惠成本</div>
                      <div className="text-2xl font-bold text-gray-700">
                        ¥{salesOverview.statistics.avgDiscountCost.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                      <div className="text-sm text-gray-500 mb-1">统计天数</div>
                      <div className="text-2xl font-bold text-gray-700">
                        {salesOverview.statistics.totalDays}天
                      </div>
                    </div>
                  </div>

                  {/* 折线图切换 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
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
                    <h4 className="text-sm font-medium text-gray-600 mb-3">日均销量（升）</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartView === 'weekly' ? chartData.weekly : chartData.monthly}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis
                            dataKey={chartView === 'weekly' ? 'week' : 'month'}
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                          />
                          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="gasoline" name="汽油" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="diesel" name="柴油" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="total" name="总销量" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 客户构成 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">👥 客户构成分析</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                        className="mt-2 px-3 py-1 text-xs bg-white text-gray-700 rounded-full border border-gray-200 hover:bg-gray-50 hover:border-blue-400 transition-colors"
                      >
                        深度运营
                      </button>
                    )}
                    {(segment.type === 'risk' || segment.type === 'churn') && (
                      <button
                        onClick={() => exportCustomerTable(segment.type)}
                        className="mt-2 px-3 py-1 text-xs bg-white text-gray-700 rounded-full border border-gray-200 hover:bg-gray-50 hover:border-blue-400 transition-colors"
                      >
                        客户召回
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
          </div>
        )}
      </div>
    </div>
  );
}
