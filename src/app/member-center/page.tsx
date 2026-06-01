'use client';

import { useStore } from '@/lib/store';
import { formatCurrency, formatQuantity } from '@/lib/dataProcessor';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

const SUBSCRIPTION_PLANS = [
  {
    level: 'primary',
    name: '初级会员',
    price: 99,
    priceYearly: 990,
    features: ['客户召回导出', '风险排查导出', '历史记录管理'],
    color: 'from-green-500 to-emerald-600',
  },
  {
    level: 'advanced',
    name: '高级会员',
    price: 199,
    priceYearly: 1980,
    features: ['AI智能对话', '客户洞察分析', '智能召回策略', '全部导出功能', '优先客服支持'],
    color: 'from-blue-500 to-indigo-600',
    recommended: true,
  },
  {
    level: 'ultimate',
    name: '终极会员',
    price: 399,
    priceYearly: 3980,
    features: ['高级会员全部功能', '自动化任务管理', '企业微信集成', '供应链分润', '专属客服1对1'],
    color: 'from-purple-500 to-pink-600',
  },
];

export default function MemberCenterPage() {
  const { isLoggedIn, user, analysisRecords, loadAnalysisRecord, deleteAnalysisRecord } = useStore();
  const router = useRouter();

  // 未登录重定向到首页
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">请先登录</h2>
          <a href="/" className="text-blue-600 hover:underline">返回首页</a>
        </div>
      </div>
    );
  }

  const handleViewRecord = (recordId: string) => {
    loadAnalysisRecord(recordId);
    router.push('/dashboard');
  };

  const handleDeleteRecord = (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定删除这条分析记录？')) {
      deleteAnalysisRecord(recordId);
    }
  };

  const handleUpgrade = (targetLevel: string) => {
    // TODO: 调用支付API
    alert(`${SUBSCRIPTION_PLANS.find(p => p.level === targetLevel)?.name}功能开发中，请联系客服开通！\n\n客服电话：400-XXX-XXXX`);
  };

  const currentLevelIndex = SUBSCRIPTION_PLANS.findIndex(p => p.level === user?.memberLevel);
  const isFreeUser = !user?.memberLevel || user.memberLevel === 'free';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">👑 会员中心</h1>
            <p className="text-gray-500 text-sm">管理您的分析记录</p>
          </div>
          <div className="flex gap-4">
            <a href="/" className="text-blue-600 hover:underline">返回首页</a>
          </div>
        </header>

        {/* 会员信息卡片 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.phone?.slice(-4) || '8888'}
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-gray-800">手机尾号 {user?.phone?.slice(-4)}</div>
              <div className="text-sm text-gray-500 mt-1">
                会员等级：
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ml-1 ${
                  user?.memberLevel === 'ultimate' ? 'bg-purple-100 text-purple-700' :
                  user?.memberLevel === 'advanced' ? 'bg-blue-100 text-blue-700' :
                  user?.memberLevel === 'primary' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {user?.memberLevel === 'ultimate' ? '终极会员' :
                   user?.memberLevel === 'advanced' ? '高级会员' :
                   user?.memberLevel === 'primary' ? '初级会员' : '免费会员'}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                注册时间：{user?.createdAt ? dayjs(user.createdAt).format('YYYY-MM-DD') : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* 订阅方案 */}
        {(isFreeUser || currentLevelIndex < SUBSCRIPTION_PLANS.length - 1) && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">💎 升级会员</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isCurrent = user?.memberLevel === plan.level;
                const isDowngrade = currentLevelIndex > SUBSCRIPTION_PLANS.findIndex(p => p.level === plan.level);
                return (
                  <div
                    key={plan.level}
                    className={`relative p-5 rounded-xl border-2 transition-all ${
                      plan.recommended
                        ? 'border-blue-500 shadow-lg'
                        : isCurrent
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
                        推荐
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs rounded-full">
                        当前
                      </div>
                    )}

                    <div className={`text-xl font-bold mb-1 bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                      {plan.name}
                    </div>

                    <div className="mb-3">
                      <span className="text-3xl font-bold text-gray-800">¥{plan.price}</span>
                      <span className="text-gray-500 text-sm">/月</span>
                    </div>
                    <div className="text-sm text-gray-500 mb-4">
                      年付仅 ¥{plan.priceYearly}（省2个月）
                    </div>

                    <ul className="space-y-2 mb-5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="text-green-500">✓</span> {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade(plan.level)}
                      disabled={isCurrent}
                      className={`w-full py-2 rounded-lg font-medium transition-colors ${
                        isCurrent
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : plan.recommended
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isCurrent ? '当前方案' : isDowngrade ? '降级' : '立即开通'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 历史分析记录 */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📊 历史分析记录</h2>

          {analysisRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">📂</div>
              <p>暂无分析记录</p>
              <p className="text-sm mt-2">上传数据后即可自动保存分析记录</p>
              <a href="/" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                去上传数据
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {analysisRecords.map((record) => (
                <div
                  key={record.id}
                  onClick={() => handleViewRecord(record.id)}
                  className="p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {dayjs(record.createdAt).format('MM/DD HH:mm')}
                        </span>
                        <span className="font-medium text-gray-800">{record.fileName}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="text-gray-400">订单数：</span>
                          <span className="font-medium">{record.dataSummary.totalOrders}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">总销量：</span>
                          <span className="font-medium">{formatQuantity(record.dataSummary.totalQuantity)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">总销售额：</span>
                          <span className="font-medium">¥{formatCurrency(record.dataSummary.totalAmount)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">数据周期：</span>
                          <span className="font-medium">
                            {dayjs(record.dataSummary.dateRange.start).format('MM/DD')}-{dayjs(record.dataSummary.dateRange.end).format('MM/DD')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewRecord(record.id);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={(e) => handleDeleteRecord(record.id, e)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}