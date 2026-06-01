'use client';

import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { useStore } from '@/lib/store';

export default function AIChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, quickQuestions, sendMessage, clearMessages } = useChatStore();
  const { isLoggedIn, hasPermission } = useStore();
  const hasAI = isLoggedIn && hasPermission('ai_insights');

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = async (prompt: string) => {
    if (isLoading) return;
    await sendMessage(prompt);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl z-50 transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
        }`}
        title={isOpen ? '关闭助手' : 'AI助手'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[32rem] max-h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <div className="text-white font-semibold">AI智能营销官</div>
                <div className="text-blue-100 text-xs">基于数据分析的智能顾问</div>
              </div>
            </div>
            <button
              onClick={() => { setIsOpen(false); clearMessages(); }}
              className="text-white/80 hover:text-white text-lg"
            >
              ✕
            </button>
          </div>

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">👋</div>
                <p className="text-sm">您好！我是您的AI智能营销官</p>
                <p className="text-xs mt-1">上传数据后，我可以帮您分析油站运营情况</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
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
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 px-4 py-2 rounded-2xl shadow text-sm">
                  <span className="animate-pulse">思考中...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 快捷问题 */}
          {messages.length === 0 && (
            <div className="px-4 py-2 border-t bg-white">
              <p className="text-xs text-gray-400 mb-2">快捷问题：</p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.slice(0, 4).map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleQuickQuestion(q.prompt)}
                    disabled={isLoading || !hasAI}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 输入区域 */}
          <div className="p-3 border-t bg-white">
            {!hasAI ? (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500 mb-2">解锁AI对话能力</p>
                <a
                  href="/member-center"
                  className="text-sm text-blue-600 hover:underline"
                >
                  升级到高级会员
                </a>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入您的问题..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    '➤'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}