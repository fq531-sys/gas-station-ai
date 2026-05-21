'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatQuantity } from '@/lib/dataProcessor';
import { CUSTOMER_TYPE_CONFIG } from '@/lib/constants';
import dayjs from 'dayjs';

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
            {/* AI日报卡片 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  📊 AI日报 · {dayjs().format('YYYY年MM月DD日')}
                </h2>
                <button
                  onClick={clearData}
                  className="text-sm text-gray-500 hover:text-red-500"
                >
                  重新上传数据
                </button>
              </div>

              {salesOverview && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <div className="text-sm text-blue-600 mb-1">今日销售额</div>
                    <div className="text-2xl font-bold text-blue-700">
                      ¥{formatCurrency(salesOverview.totalAmount)}
                    </div>
                    <div className="text-xs text-blue-500 mt-1">
                      {salesOverview.comparisonRate.amount >= 0 ? '↑' : '↓'}{Math.abs(salesOverview.comparisonRate.amount).toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <div className="text-sm text-green-600 mb-1">今日销量</div>
                    <div className="text-2xl font-bold text-green-700">
                      {formatQuantity(salesOverview.totalQuantity)}
                    </div>
                    <div className="text-xs text-green-500 mt-1">
                      日均 {formatQuantity(salesOverview.dailyQuantity)}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                    <div className="text-sm text-orange-600 mb-1">客单价</div>
                    <div className="text-2xl font-bold text-orange-700">
                      ¥{salesOverview.avgOrderAmount.toFixed(0)}
                    </div>
                    <div className="text-xs text-orange-500 mt-1">
                      {salesOverview.totalOrders} 笔订单
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                    <div className="text-sm text-red-600 mb-1">异常预警</div>
                    <div className="text-2xl font-bold text-red-700">
                      {riskAlerts.length}
                    </div>
                    <div className="text-xs text-red-500 mt-1">
                      {riskAlerts.filter(r => r.level === 'high').length}条高危
                    </div>
                  </div>
                </div>
              )}

              {/* AI概览 */}
              <div className="p-4 bg-indigo-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <div className="font-medium text-indigo-700 mb-1">AI智能概览</div>
                    <p className="text-indigo-600 text-sm">
                      您的加油站整体运营状况良好，基本盘客户占比稳定。
                      {customerSegments.find(s => s.type === 'churn') && (
                        <> 检测到 <span className="font-semibold text-orange-600">{customerSegments.find(s => s.type === 'churn')?.count}</span> 位流失客户需要关注。</>
                      )}
                      {riskAlerts.filter(r => r.level === 'high').length > 0 && (
                        <> ⚠️ 有 <span className="font-semibold text-red-600">{riskAlerts.filter(r => r.level === 'high').length}</span> 条高危预警需要立即处理。</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 客户构成 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">👥 客户构成分析</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {customerSegments.map((segment) => (
                  <div
                    key={segment.type}
                    className="p-4 rounded-xl text-center"
                    style={{ backgroundColor: segment.color + '15' }}
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
