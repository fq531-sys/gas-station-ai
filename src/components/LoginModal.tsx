'use client';

import { useState, useEffect } from 'react';
import { api, User } from '@/lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState(''); // 开发环境下显示的验证码

  useEffect(() => {
    if (isOpen) {
      setPhone('');
      setCode('');
      setError('');
      setDevCode('');
    }
  }, [isOpen]);

  const handleSendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    setLoading(true);
    setError('');

    const result = await api.sendCode(phone);

    if (result.success) {
      // 开发环境下，API会返回验证码方便测试
      if ((result as any).devCode) {
        setDevCode((result as any).devCode);
      }
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setError(result.error || '发送失败');
    }

    setLoading(false);
  };

  const handleLogin = async () => {
    if (!phone || !code) {
      setError('请输入手机号和验证码');
      return;
    }

    setLoading(true);
    setError('');

    const result = await api.login(phone, code);

    if (result.success && result.data) {
      onLoginSuccess(result.data.user);
      onClose();
    } else {
      setError(result.error || '登录失败');
    }

    setLoading(false);
  };

  const handleLogout = () => {
    api.clearToken();
    onLoginSuccess(null as any);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800">登录/注册</h2>
          <p className="text-gray-500 text-sm mt-2">输入手机号验证即可完成注册，数据云端保存</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {devCode && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm text-center">
            开发环境验证码：{devCode}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="请输入手机号"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={11}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="请输入验证码"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={6}
              />
              <button
                onClick={handleSendCode}
                disabled={countdown > 0 || loading}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium whitespace-nowrap"
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-300 font-medium shadow-lg"
          >
            {loading ? '登录中...' : '登录 / 注册'}
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>登录即表示同意《用户协议》和《隐私政策》</p>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
        >
          稍后再说
        </button>
      </div>
    </div>
  );
}