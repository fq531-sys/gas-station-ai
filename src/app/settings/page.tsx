'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { REFERENCE_STATIONS } from '@/lib/constants';

export default function SettingsPage() {
  const { config, updateConfig, hasData } = useStore();

  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    updateConfig(localConfig);
    alert('配置已保存');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">⚙️ 系统设置</h1>
            <p className="text-gray-500 text-sm">配置分析条件和系统参数</p>
          </div>
          <a href="/" className="text-blue-600 hover:underline">返回首页</a>
        </header>

        {/* 分析条件配置 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📊 分析条件配置</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">流失判定天数</label>
              <select
                value={localConfig.churnDays}
                onChange={(e) => setLocalConfig({ ...localConfig, churnDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={15}>超过15天</option>
                <option value={30}>超过30天（默认）</option>
                <option value={45}>超过45天</option>
                <option value={60}>超过60天</option>
                <option value={90}>超过90天</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">超过此天数未消费且消费≥2次，视为流失客户</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">基本盘客户判定</label>
              <select
                value={localConfig.baseCustomerMinOrders}
                onChange={(e) => setLocalConfig({ ...localConfig, baseCustomerMinOrders: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={2}>≥2次消费</option>
                <option value={3}>≥3次消费（默认）</option>
                <option value={5}>≥5次消费</option>
                <option value={10}>≥10次消费</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">油量异常阈值</label>
              <select
                value={localConfig.quantityAnomalyThreshold}
                onChange={(e) => setLocalConfig({ ...localConfig, quantityAnomalyThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={80}>超过80升</option>
                <option value={100}>超过100升（默认）</option>
                <option value={150}>超过150升</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">回灌结算预警</label>
              <select
                value={localConfig.refundAnomalyThreshold}
                onChange={(e) => setLocalConfig({ ...localConfig, refundAnomalyThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={5}>超过5%</option>
                <option value={10}>超过10%（默认）</option>
                <option value={15}>超过15%</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">夜间交易预警</label>
              <select
                value={localConfig.nightAnomalyThreshold}
                onChange={(e) => setLocalConfig({ ...localConfig, nightAnomalyThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={10}>超过10%</option>
                <option value={20}>超过20%（默认）</option>
                <option value={30}>超过30%</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">套现检测时间窗口</label>
              <select
                value={localConfig.fraudThresholdMinutes}
                onChange={(e) => setLocalConfig({ ...localConfig, fraudThresholdMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={15}>15分钟内</option>
                <option value={30}>30分钟（默认）</option>
                <option value={60}>60分钟内</option>
              </select>
            </div>
          </div>
        </div>

        {/* 参照站配置 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🏪 参照站配置</h2>
          <p className="text-sm text-gray-500 mb-4">
            选择加油站类型，用于两站对比分析时作为参照基准
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(REFERENCE_STATIONS).map(([key, station]) => (
              <div
                key={key}
                onClick={() => setLocalConfig({ ...localConfig, referenceStation: { ...station, peakHours: [...station.peakHours] } })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  localConfig.referenceStation.type === station.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="font-medium text-gray-800 mb-2">{station.name}</div>
                <div className="text-sm text-gray-500 space-y-1">
                  <div>日均销量：{station.avgDailyQuantity.toLocaleString()}升</div>
                  <div>客单价：¥{station.avgOrderAmount}</div>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  92#占{station.oilTypePercentage['92#']}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI能力配置 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🤖 AI能力配置</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.aiEnabled.dailyReport}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  aiEnabled: { ...localConfig.aiEnabled, dailyReport: e.target.checked }
                })}
                className="w-5 h-5 rounded text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-700">AI日报自动生成</div>
                <div className="text-sm text-gray-500">每日自动生成运营日报</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.aiEnabled.smartAlert}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  aiEnabled: { ...localConfig.aiEnabled, smartAlert: e.target.checked }
                })}
                className="w-5 h-5 rounded text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-700">智能预警推送</div>
                <div className="text-sm text-gray-500">异常情况立即通知</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.aiEnabled.churnPrediction}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  aiEnabled: { ...localConfig.aiEnabled, churnPrediction: e.target.checked }
                })}
                className="w-5 h-5 rounded text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-700">流失预测提醒</div>
                <div className="text-sm text-gray-500">客户即将流失前提前预警</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.aiEnabled.marketingSuggestion}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  aiEnabled: { ...localConfig.aiEnabled, marketingSuggestion: e.target.checked }
                })}
                className="w-5 h-5 rounded text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-700">AI营销建议</div>
                <div className="text-sm text-gray-500">基于数据自动生成营销建议</div>
              </div>
            </label>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setLocalConfig(config)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            重置
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}
