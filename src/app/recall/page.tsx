'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { filterRecallCustomers, calculateChurnLevel } from '@/lib/customerClassifier';
import { RecallFilter, RecallCustomer } from '@/lib/types';
import { CHURN_LEVEL_CONFIG } from '@/lib/constants';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const CHURN_OPTIONS = [
  { label: '全部', value: undefined },
  { label: 'A级（高危流失）', value: 'A' },
  { label: 'B级（中危流失）', value: 'B' },
  { label: 'C级（低危流失）', value: 'C' },
  { label: 'D级（休眠会员）', value: 'D' },
];

const DAYS_OPTIONS = [
  { label: '全部', value: undefined },
  { label: '超过15天', value: 15 },
  { label: '超过30天', value: 30 },
  { label: '超过45天', value: 45 },
  { label: '超过60天', value: 60 },
  { label: '超过90天', value: 90 },
];

export default function RecallPage() {
  const { hasData, customers } = useStore();

  const [filter, setFilter] = useState<RecallFilter>({
    excludeRandomCustomer: true,
  });

  const [aiQuery, setAiQuery] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // 筛选流失客户
  const recallCustomers = useMemo(() => {
    if (!hasData) return [];
    return filterRecallCustomers(customers, filter);
  }, [customers, filter, hasData]);

  // 按等级分组统计
  const levelStats = useMemo(() => {
    return {
      A: recallCustomers.filter(c => c.churnLevel === 'A').length,
      B: recallCustomers.filter(c => c.churnLevel === 'B').length,
      C: recallCustomers.filter(c => c.churnLevel === 'C').length,
      D: recallCustomers.filter(c => c.churnLevel === 'D').length,
    };
  }, [recallCustomers]);

  // 导出Excel
  const exportExcel = () => {
    if (recallCustomers.length === 0) return;

    const data = recallCustomers.map((c, index) => ({
      '序号': index + 1,
      '流失等级': CHURN_LEVEL_CONFIG[c.churnLevel!]?.name || c.churnLevel,
      '手机号码': c.phone,
      '车牌号': c.carPlate || '-',
      '累计消费次数': c.totalOrders,
      '累计消费金额': c.totalAmount.toFixed(2),
      '平均客单价': c.avgOrderAmount.toFixed(2),
      '最后消费时间': dayjs(c.lastOrderDate).format('YYYY-MM-DD'),
      '流失天数': c.daysSinceLastOrder,
      '油品偏好': c.oilTypePreference.join(', '),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '流失客户');
    XLSX.writeFile(wb, `流失客户_${dayjs().format('YYYYMMDD')}.xlsx`);
  };

  // 导出电话清单（TXT格式）
  const exportPhoneList = () => {
    if (recallCustomers.length === 0) return;
    const phones = recallCustomers.map(c => c.phone).filter(p => p && p !== '--未知--');
    const text = phones.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `电话清单_${dayjs().format('YYYYMMDD')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hasData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📞</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">请先上传数据</h2>
          <a href="/" className="text-blue-600 hover:underline">返回首页</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📞 会员召回</h1>
            <p className="text-gray-500 text-sm">筛选流失客户，导出联系方式进行召回</p>
          </div>
          <a href="/" className="text-blue-600 hover:underline">返回首页</a>
        </header>

        {/* AI筛选 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">💬 AI智能筛选</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="例如：帮我筛选最近60天没来的高价值会员"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                // TODO: 调用AI解析
                setIsAiProcessing(true);
                setTimeout(() => setIsAiProcessing(false), 1000);
              }}
              disabled={isAiProcessing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isAiProcessing ? '解析中...' : 'AI解析'}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            💡 提示：也可以手动设置筛选条件
          </p>
        </div>

        {/* 筛选条件 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📝 筛选条件</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">流失天数</label>
              <select
                value={filter.daysSinceLastOrder || ''}
                onChange={(e) => setFilter({ ...filter, daysSinceLastOrder: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {DAYS_OPTIONS.map(opt => (
                  <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">消费次数</label>
              <select
                value={filter.totalOrdersMin || ''}
                onChange={(e) => setFilter({ ...filter, totalOrdersMin: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">全部</option>
                <option value="2">≥2次</option>
                <option value="3">≥3次</option>
                <option value="5">≥5次</option>
                <option value="10">≥10次</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">流失等级</label>
              <select
                value={filter.churnLevels?.[0] || ''}
                onChange={(e) => setFilter({ ...filter, churnLevels: e.target.value ? [e.target.value as any] : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {CHURN_OPTIONS.map(opt => (
                  <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">车牌前缀</label>
              <input
                type="text"
                value={filter.carPlatePrefix || ''}
                onChange={(e) => setFilter({ ...filter, carPlatePrefix: e.target.value || undefined })}
                placeholder="如：云A"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* 结果统计 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              筛选结果 · {recallCustomers.length} 位客户
            </h2>
            <div className="flex gap-2">
              <button
                onClick={exportExcel}
                disabled={recallCustomers.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                导出Excel
              </button>
              <button
                onClick={exportPhoneList}
                disabled={recallCustomers.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                导出电话清单
              </button>
            </div>
          </div>

          {/* 等级分布 */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {Object.entries(levelStats).map(([level, count]) => (
              <div
                key={level}
                className="p-3 rounded-lg text-center"
                style={{ backgroundColor: CHURN_LEVEL_CONFIG[level as keyof typeof CHURN_LEVEL_CONFIG].color + '15' }}
              >
                <div className="text-2xl font-bold" style={{ color: CHURN_LEVEL_CONFIG[level as keyof typeof CHURN_LEVEL_CONFIG].color }}>
                  {count}
                </div>
                <div className="text-sm text-gray-600">{CHURN_LEVEL_CONFIG[level as keyof typeof CHURN_LEVEL_CONFIG].name}</div>
              </div>
            ))}
          </div>

          {/* 客户列表 */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 px-2">等级</th>
                  <th className="py-3 px-2">手机号码</th>
                  <th className="py-3 px-2">车牌号</th>
                  <th className="py-3 px-2 text-right">消费次数</th>
                  <th className="py-3 px-2 text-right">累计金额</th>
                  <th className="py-3 px-2 text-right">流失天数</th>
                  <th className="py-3 px-2">最后消费</th>
                </tr>
              </thead>
              <tbody>
                {recallCustomers.slice(0, 50).map((customer, index) => (
                  <tr key={customer.phone + index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: CHURN_LEVEL_CONFIG[customer.churnLevel!]?.color }}
                      >
                        {customer.churnLevel}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-medium">{customer.phone}</td>
                    <td className="py-2 px-2">{customer.carPlate || '-'}</td>
                    <td className="py-2 px-2 text-right">{customer.totalOrders}</td>
                    <td className="py-2 px-2 text-right">¥{customer.totalAmount.toFixed(0)}</td>
                    <td className="py-2 px-2 text-right">
                      <span className={customer.daysSinceLastOrder > 60 ? 'text-red-600 font-medium' : ''}>
                        {customer.daysSinceLastOrder}天
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-500">
                      {dayjs(customer.lastOrderDate).format('MM/DD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recallCustomers.length > 50 && (
              <p className="text-center text-gray-500 py-4">
                仅显示前50条，更多数据请导出查看
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
