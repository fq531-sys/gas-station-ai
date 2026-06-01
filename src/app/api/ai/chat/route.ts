import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/aiService';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json({ success: false, error: '消息内容不能为空' }, { status: 400 });
    }

    // 使用客户端传来的上下文（已包含当前数据）
    const dataContext = {
      hasData: context?.orders?.length > 0,
      orders: context?.orders || [],
      customers: context?.customers || [],
      salesOverview: context?.salesOverview || null,
      customerSegments: context?.customerSegments || [],
      riskAlerts: context?.riskAlerts || [],
      config: context?.config || {},
    };

    // 调用AI服务
    const response = await aiService.chat(message, dataContext);

    return NextResponse.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'AI服务出错，请稍后重试' },
      { status: 500 }
    );
  }
}