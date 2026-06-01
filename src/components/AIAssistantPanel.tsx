'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { useStore } from '@/lib/store';

const QUICK_QUESTIONS = [
  { id: 'churn', text: '哪些客户最可能流失？', prompt: '分析流失风险客户，给出召回建议' },
  { id: 'sales', text: '近期销售趋势如何？', prompt: '分析销售趋势，指出异常' },
  { id: 'risk', text: '有哪些经营风险？', prompt: '列出检测到的财务风险，按优先级排序' },
  { id: 'marketing', text: '营销优化建议', prompt: '基于数据分析，给出营销优化建议' },
];

const TRIAL_QUESTIONS_LIMIT = 3;

export default function AIAssistantPanel() {
  const [trialCount, setTrialCount] = useState(0);
  const [isTrialLocked, setIsTrialLocked] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { sendMessage, isLoading, messages, clearMessages } = useChatStore();
  const orders = useStore(state => state.orders);
  const isLoggedIn = useStore(state => state.isLoggedIn);
  const hasData = orders.length > 0;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 当AI有回复时，自动打开聊天窗口
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant') {
        setShowChatWindow(true);
      }
    }
  }, [isLoading, messages]);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [showChatWindow, messages]);

  const handleQuestion = async (prompt: string) => {
    if (isTrialLocked) return;

    if (trialCount >= TRIAL_QUESTIONS_LIMIT) {
      setIsTrialLocked(true);
      return;
    }

    setShowChatWindow(true);
    await sendMessage(prompt);
    if (!isLoggedIn) {
      setTrialCount(prev => prev + 1);
    }
  };

  const handleCustomQuestion = async () => {
    if (!inputValue.trim()) return;
    await handleQuestion(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomQuestion();
    }
  };

  const closeChatWindow = () => {
    setShowChatWindow(false);
    clearMessages();
  };

  // 没有数据时
  if (!hasData) {
    return (
      <div className="bg-white/10 rounded-lg p-4 text-center">
        <div className="text-3xl mb-2">📊</div>
        <p className="text-sm text-blue-100">上传数据后体验AI分析</p>
      </div>
    );
  }

  return (
    <>
      {/* 紧凑模式：输入框 + 快捷问题 */}
      <div className="space-y-3">
        {/* 输入框 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您的问题..."
            className="flex-1 px-3 py-2 bg-white/20 text-white placeholder-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            onClick={handleCustomQuestion}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            提问
          </button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-100">快捷问题：</p>
          {!isLoggedIn && (
            <span className="text-xs text-blue-200">
              剩余{TRIAL_QUESTIONS_LIMIT - trialCount}次
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q.id}
              onClick={() => handleQuestion(q.prompt)}
              disabled={isLoading || isTrialLocked}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-left transition-colors disabled:opacity-50"
            >
              {q.text}
            </button>
          ))}
        </div>

        {isTrialLocked && (
          <div className="text-center">
            <a
              href="/member-center"
              className="text-sm text-blue-200 hover:text-white underline"
            >
              试用次数已用完，点击升级会员
            </a>
          </div>
        )}
      </div>

      {/* 大型悬浮聊天窗口 - 居中显示 */}
      {showChatWindow && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[32rem] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <div className="text-white font-bold text-lg">AI智能营销官</div>
                <div className="text-blue-100 text-sm">基于数据分析的智能顾问</div>
              </div>
            </div>
            <button
              onClick={closeChatWindow}
              className="text-white/80 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20"
            >
              ✕
            </button>
          </div>

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                <div className="text-5xl mb-4">👋</div>
                <p className="text-lg">您好！我是您的AI智能营销官</p>
                <p className="text-sm mt-2">请在上方输入您的问题，或选择快捷问题</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm mr-2 flex-shrink-0">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-white text-gray-700 shadow rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">AI</div>
                <div className="px-4 py-3 bg-gray-100 rounded-2xl">
                  <span className="animate-pulse">🤔 思考中...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="继续提问..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCustomQuestion}
                disabled={!inputValue.trim() || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}