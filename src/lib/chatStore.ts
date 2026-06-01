// AI对话状态管理
import { create } from 'zustand';
import { useStore } from './store';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  quickQuestions: { id: string; text: string; prompt: string }[];

  // Actions
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  sendMessage: (message: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  quickQuestions: [
    { id: 'churn_analysis', text: '哪些客户最可能流失？', prompt: '分析流失风险客户，给出召回建议' },
    { id: 'sales_trend', text: '近期销售趋势如何？', prompt: '分析销售趋势，指出异常' },
    { id: 'risk_alert', text: '有哪些经营风险？', prompt: '列出检测到的财务风险，按优先级排序' },
    { id: 'marketing', text: '营销优化建议', prompt: '基于数据分析，给出营销优化建议' },
    { id: 'customer_value', text: '高价值客户是谁？', prompt: '找出高价值客户，分析其特征' },
    { id: 'peak_hours', text: '高峰时段分析', prompt: '分析销售高峰和低谷时段' },
    { id: 'oil_type', text: '油品结构分析', prompt: '分析各油品占比和趋势' },
    { id: 'discount', text: '优惠使用分析', prompt: '分析优惠使用效率和成本' },
  ],

  addMessage: (role, content) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearMessages: () => set({ messages: [], error: null }),

  sendMessage: async (message) => {
    const { addMessage, setLoading, setError } = get();

    // 添加用户消息
    addMessage('user', message);
    setLoading(true);
    setError(null);

    try {
      // 从store获取当前数据上下文
      const storeState = useStore.getState();
      const dataContext = {
        orders: storeState.orders,
        customers: storeState.customers,
        salesOverview: storeState.salesOverview,
        customerSegments: storeState.customerSegments,
        riskAlerts: storeState.riskAlerts,
        config: storeState.config,
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context: dataContext }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'AI服务出错');
      }

      // 添加AI回复
      addMessage('assistant', data.data.response);
    } catch (error: any) {
      const errorMessage = error.message || '发送失败，请稍后重试';
      setError(errorMessage);
      addMessage('assistant', `❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  },
}));