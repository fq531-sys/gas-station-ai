'use client';

import { useStore } from '@/lib/store';
import { formatCurrency, formatQuantity } from '@/lib/dataProcessor';
import {
  calculateTimeSlotAnalysis,
  calculateOilTypeAnalysis,
  calculateGunAnalysis,
  calculatePaymentAnalysis,
  detectSalesAnomalies,
} from '@/lib/dataProcessor';
import { CHURN_LEVEL_CONFIG } from '@/lib/constants';
import dayjs from 'dayjs';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];

export default function Dashboard() {
  const { hasData, orders, salesOverview, dailySales, customerSegments, riskAlerts } = useStore();

  if (!hasData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">请先上传数据</h2>
          <a href="/" className="text-blue-600 hover:underline">返回首页</a>
        </div>
      </div>
    );
  }

  const timeSlotData = calculateTimeSlotAnalysis(orders);
  const oilTypeData = calculateOilTypeAnalysis(orders);
  const gunData = calculateGunAnalysis(orders);
  const paymentData = calculatePaymentAnalysis(orders);
  const anomalies = detectSalesAnomalies(dailySales);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📊 数据分析报告</h1>
            <p className="text-gray-500 text-sm">
              {dayjs().format('YYYY年MM月DD日')} · {salesOverview?.totalOrders || 0} 笔订单
            </p>
          </div>
          <a href="/" className="text-blue-600 hover:underline">返回首页</a>
        </header>

        {/* 1. 销售概况 */}
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">1. 销售概况总览</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600">总订单数</div>
              <div className="text-2xl font-bold text-blue-700">{salesOverview?.totalOrders}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600">总销量</div>
              <div className="text-2xl font-bold text-green-700">{formatQuantity(salesOverview?.totalQuantity || 0)}</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600">总销售额</div>
              <div className="text-2xl font-bold text-orange-700">¥{formatCurrency(salesOverview?.totalAmount || 0)}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600">客单价</div>
              <div className="text-2xl font-bold text-purple-700">¥{(salesOverview?.avgOrderAmount || 0).toFixed(0)}</div>
            </div>
          </div>
        </section>

        {/* 2. 销售趋势 */}
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">2. 销售趋势分析</h2>
          {anomalies.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg text-yellow-700 text-sm">
              ⚠️ 检测到 {anomalies.length} 个异常：
              {anomalies.slice(0, 3).map((a, i) => `${a.description}${i < 2 ? '、' : ''}`)}
            </div>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value, name) => [name === 'amount' ? `¥${Number(value).toFixed(0)}` : Number(value).toFixed(0), name === 'amount' ? '销售额' : '销量(升)']} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="quantity" stroke="#10B981" name="销量(升)" />
              <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#3B82F6" name="销售额(元)" />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* 3. 油品结构 */}
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">3. 油品结构分析</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={oilTypeData} dataKey="quantity" nameKey="oilType" cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}>
                  {oilTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${formatQuantity(Number(value || 0))}`} />
              </PieChart>
            </ResponsiveContainer>
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">油品</th>
                    <th className="pb-2 text-right">销量</th>
                    <th className="pb-2 text-right">占比</th>
                    <th className="pb-2 text-right">销售额</th>
                  </tr>
                </thead>
                <tbody>
                  {oilTypeData.map((item) => (
                    <tr key={item.oilType} className="border-b">
                      <td className="py-2 font-medium">{item.oilType}</td>
                      <td className="py-2 text-right">{formatQuantity(item.quantity)}</td>
                      <td className="py-2 text-right">{item.percentage.toFixed(1)}%</td>
                      <td className="py-2 text-right">¥{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. 时段分析 */}
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">4. 时段分析</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeSlotData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `${formatQuantity(Number(value || 0))}`} />
              <Bar dataKey="quantity" fill="#3B82F6" name="销量">
                {timeSlotData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isPeak ? '#EF4444' : entry.isValley ? '#F59E0B' : '#3B82F6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded"></span> 高峰时段</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded"></span> 低谷时段</span>
          </div>
        </section>

        {/* 5. 客户分析 - 复用客户构成 */}
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">5. 客户构成分析</h2>
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
                <div className="font-medium text-gray-700 text-sm">{segment.name}</div>
                <div className="text-xs text-gray-500">{segment.percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. 支付方式 */}
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">6. 支付方式分析</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {paymentData.slice(0, 8).map((item) => (
              <div key={item.payType} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 truncate">{item.payType}</div>
                <div className="text-lg font-bold text-gray-800">{item.percentage.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">¥{formatCurrency(item.amount)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. 财务风险预警 */}
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">7. 财务风险预警</h2>
          {riskAlerts.length === 0 ? (
            <div className="p-4 bg-green-50 rounded-lg text-green-700">
              ✅ 未检测到异常风险
            </div>
          ) : (
            <div className="space-y-3">
              {/* 风险概览 */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-700">{riskAlerts.filter(r => r.level === 'high').length}</div>
                  <div className="text-sm text-red-600">高危风险</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-700">{riskAlerts.filter(r => r.level === 'medium').length}</div>
                  <div className="text-sm text-orange-600">中危风险</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-700">{riskAlerts.filter(r => r.level === 'low').length}</div>
                  <div className="text-sm text-yellow-600">低危风险</div>
                </div>
              </div>

              {/* 风险明细 */}
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2">风险类型</th>
                      <th className="pb-2">人员</th>
                      <th className="pb-2">时间</th>
                      <th className="pb-2">等级</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskAlerts.slice(0, 10).map((alert) => (
                      <tr key={alert.id} className="border-b">
                        <td className="py-2">{alert.description}</td>
                        <td className="py-2">{alert.person}</td>
                        <td className="py-2 text-gray-500">{dayjs(alert.timestamp).format('MM/DD HH:mm')}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.level === 'high' ? 'bg-red-100 text-red-700' :
                            alert.level === 'medium' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {alert.level === 'high' ? '高危' : alert.level === 'medium' ? '中危' : '低危'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* 8. 油枪效率 */}
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">8. 油枪效率分析</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">油枪</th>
                  <th className="pb-2 text-right">订单数</th>
                  <th className="pb-2 text-right">总销量</th>
                  <th className="pb-2 text-right">单枪产量</th>
                  <th className="pb-2 text-right">状态</th>
                </tr>
              </thead>
              <tbody>
                {gunData.slice(0, 15).map((gun) => (
                  <tr key={gun.gunNo} className="border-b">
                    <td className="py-2 font-medium">{gun.gunNo}</td>
                    <td className="py-2 text-right">{gun.orders}</td>
                    <td className="py-2 text-right">{formatQuantity(gun.quantity)}</td>
                    <td className="py-2 text-right">{gun.avgQuantity.toFixed(1)}升/单</td>
                    <td className="py-2 text-right">
                      {gun.isEfficient ? (
                        <span className="text-green-600">✓ 正常</span>
                      ) : (
                        <span className="text-red-600">⚠️ 低效</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
