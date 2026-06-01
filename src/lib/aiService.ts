// AI服务层 - Anthropic API封装
// 复用constants.ts中的配置

import Anthropic from '@anthropic-ai/sdk';
import { SalesOverview, CustomerSegment, RiskAlert, Order, Customer, SystemConfig } from './types';
import { CUSTOMER_TYPE_CONFIG } from './constants';

interface DataContext {
  hasData: boolean;
  salesOverview: SalesOverview | null;
  customerSegments: CustomerSegment[];
  riskAlerts: RiskAlert[];
  orders: Order[];
  customers: Customer[];
  config: SystemConfig;
}

// 预置问题模板
export const QUICK_QUESTIONS = [
  { id: 'churn_analysis', text: '哪些客户最可能流失？', prompt: '分析流失风险客户，给出召回建议' },
  { id: 'sales_trend', text: '近期销售趋势如何？', prompt: '分析销售趋势，指出异常' },
  { id: 'risk_alert', text: '有哪些经营风险？', prompt: '列出检测到的财务风险，按优先级排序' },
  { id: 'marketing', text: '营销优化建议', prompt: '基于数据分析，给出营销优化建议' },
  { id: 'customer_value', text: '高价值客户是谁？', prompt: '找出高价值客户，分析其特征' },
  { id: 'peak_hours', text: '高峰时段分析', prompt: '分析销售高峰和低谷时段' },
  { id: 'oil_type', text: '油品结构分析', prompt: '分析各油品占比和趋势' },
  { id: 'discount', text: '优惠使用分析', prompt: '分析优惠使用效率和成本' },
];

// Anthropic客户端
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('未配置ANTHROPIC_API_KEY环境变量');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// 构建系统提示词
function buildSystemPrompt(): string {
  return `你是加油站AI智能营销官，一位专业的油站运营顾问。

你擅长：
- 分析加油站销售数据，发现问题和机会
- 客户分类和流失分析，制定召回策略
- 风险预警和合规建议
- 营销策略优化，提升营收

回答要求：
1. 专业、简洁、有洞察力
2. 用数据和事实支撑结论
3. 提出具体可执行的建议
4. 如涉及客户信息，注意隐私保护

当没有数据时，提示用户先上传Excel数据。`;
}

// 构建数据上下文摘要
function buildContextSummary(ctx: DataContext): string {
  if (!ctx.orders || ctx.orders.length === 0) {
    return '用户尚未上传数据，无法提供分析。';
  }

  let summary = '【当前数据概况】\n';

  // 销售概况
  if (ctx.salesOverview) {
    const so = ctx.salesOverview;
    const startDate = typeof so.dateRange.start === 'string' ? so.dateRange.start : so.dateRange.start?.toLocaleDateString();
    const endDate = typeof so.dateRange.end === 'string' ? so.dateRange.end : so.dateRange.end?.toLocaleDateString();
    summary += `\n📊 销售概况：
- 总订单：${so.totalOrders}笔
- 总销量：${(so.totalQuantity / 10000).toFixed(2)}万升
- 总销售额：¥${(so.totalAmount / 10000).toFixed(2)}万
- 客单价：¥${so.avgOrderAmount.toFixed(0)}
- 数据周期：${startDate} - ${endDate}
- 统计天数：${so.statistics.totalDays}天
`;
  }

  // 客户构成
  if (ctx.customerSegments.length > 0) {
    summary += '\n👥 客户构成：\n';
    ctx.customerSegments.forEach(seg => {
      const config = CUSTOMER_TYPE_CONFIG[seg.type];
      summary += `- ${config?.name || seg.type}：${seg.count}人（${seg.percentage.toFixed(1)}%）\n`;
    });
  }

  // 风险预警
  if (ctx.riskAlerts.length > 0) {
    const highRisk = ctx.riskAlerts.filter(r => r.level === 'high').length;
    const mediumRisk = ctx.riskAlerts.filter(r => r.level === 'medium').length;
    summary += `\n⚠️ 风险预警：共${ctx.riskAlerts.length}条（高危${highRisk}条，中危${mediumRisk}条）\n`;
    ctx.riskAlerts.slice(0, 3).forEach(alert => {
      summary += `- ${alert.description}\n`;
    });
  }

  return summary;
}

// 核心聊天方法
export async function chat(message: string, context: DataContext): Promise<string> {
  const client = getAnthropicClient();

  const systemPrompt = buildSystemPrompt();
  const contextSummary = buildContextSummary(context);

  // 构建用户消息（包含上下文）
  const userMessage = `${contextSummary}

【用户问题】
${message}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-7-20252014',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // 提取文本内容
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('AI响应格式错误');
    }

    return textContent.text;
  } catch (error: any) {
    console.error('Anthropic API error:', error);

    // 处理API错误
    if (error.status === 401) {
      throw new Error('AI服务未授权，请检查API配置');
    }
    if (error.status === 429) {
      throw new Error('AI服务请求过于频繁，请稍后重试');
    }
    if (error.status === 400 && error.error?.type === 'invalid_request_error') {
      // 模型不支持等错误，降级处理
      return generateFallbackResponse(message, context);
    }

    throw error;
  }
}

// 降级响应（当API不可用时）
function generateFallbackResponse(message: string, ctx: DataContext): string {
  const lowerMessage = message.toLowerCase();

  // 无数据情况
  if (!ctx.hasData) {
    return '📋 请先上传加油站Excel数据，我才能进行分析。\n\n点击首页的"选择文件"按钮上传您的订单数据。';
  }

  // 流失分析
  if (lowerMessage.includes('流失') || lowerMessage.includes('召回') || lowerMessage.includes('客户')) {
    const churnSeg = ctx.customerSegments.find(s => s.type === 'churn');
    const riskSeg = ctx.customerSegments.find(s => s.type === 'risk');
    const baseSeg = ctx.customerSegments.find(s => s.type === 'base');

    return `📞 流失客户分析：

根据当前数据：
- 流失客户：${churnSeg?.count || 0}人（${churnSeg?.percentage.toFixed(1) || 0}%）
- 流失风险客户：${riskSeg?.count || 0}人（${riskSeg?.percentage.toFixed(1) || 0}%）
- 基本盘客户：${baseSeg?.count || 0}人（${baseSeg?.percentage.toFixed(1) || 0}%）

💡 建议：
1. 优先联系A级流失客户（高价值且流失时间较长）
2. 制定差异化召回策略
3. 对于基本盘客户，提供会员专属福利提升粘性

如需导出客户列表，请前往"会员召回"页面。`;
  }

  // 销售趋势
  if (lowerMessage.includes('销售') || lowerMessage.includes('趋势') || lowerMessage.includes('营收')) {
    if (!ctx.salesOverview) {
      return '暂无销售数据';
    }

    const so = ctx.salesOverview;
    return `📈 销售概况：

- 日均订单：${so.dailyOrders.toFixed(1)}笔
- 日均销量：${(so.dailyQuantity / 1000).toFixed(1)}千升
- 日均销售额：¥${(so.dailyAmount / 10000).toFixed(2)}万
- 客单价：¥${so.avgOrderAmount.toFixed(0)}

如需查看详细趋势，请前往"数据分析报告"页面。`;
  }

  // 风险预警
  if (lowerMessage.includes('风险') || lowerMessage.includes('异常') || lowerMessage.includes('预警')) {
    if (ctx.riskAlerts.length === 0) {
      return '✅ 暂未检测到明显异常，数据表现正常。';
    }

    const highRisk = ctx.riskAlerts.filter(r => r.level === 'high');
    const mediumRisk = ctx.riskAlerts.filter(r => r.level === 'medium');

    let response = `⚠️ 风险预警（共${ctx.riskAlerts.length}条）：

`;
    if (highRisk.length > 0) {
      response += '\n🔴 高危风险：\n';
      highRisk.forEach(r => {
        response += `- ${r.description}\n`;
      });
    }
    if (mediumRisk.length > 0) {
      response += '\n🟡 中危风险：\n';
      mediumRisk.forEach(r => {
        response += `- ${r.description}\n`;
      });
    }

    response += '\n💡 建议立即排查高危风险项。';
    return response;
  }

  // 营销建议
  if (lowerMessage.includes('营销') || lowerMessage.includes('优化') || lowerMessage.includes('建议')) {
    const suggestions = [];

    // 基于客户结构提建议
    const churnSeg = ctx.customerSegments.find(s => s.type === 'churn');
    if (churnSeg && churnSeg.count > 0) {
      suggestions.push(`流失客户较多(${churnSeg.count}人)，建议开展召回活动`);
    }

    // 基于客单价提建议
    if (ctx.salesOverview && ctx.salesOverview.avgOrderAmount < 200) {
      suggestions.push('客单价偏低，建议优化营销组合提升单笔消费');
    }

    // 基于优惠成本提建议
    if (ctx.salesOverview) {
      const gasDiscount = ctx.salesOverview.statistics.avgDiscountCost.gasoline;
      if (gasDiscount > 0.5) {
        suggestions.push('升优惠成本偏高，建议优化优惠发放策略');
      }
    }

    if (suggestions.length === 0) {
      return '📋 数据整体表现良好，建议继续保持当前运营策略。\n\n如需更多建议，可以问我关于特定方面的优化方案。';
    }

    return `💡 营销优化建议：\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
  }

  // 默认回复
  return `📋 您的问题是："${message}"

我可以帮您分析：
- 客户流失情况和召回建议
- 销售趋势和异常检测
- 风险预警和合规建议
- 营销优化策略

请描述您想了解的具体问题，或者选择快捷问题。`;
}

// AI服务单例
export const aiService = {
  chat,
  quickQuestions: QUICK_QUESTIONS,
};