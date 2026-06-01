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
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhone('');
      setPassword('');
      setError('');
      setIsRegister(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    console.log('1. handleSubmit called');
    if (!phone || !password) {
      setError('请输入手机号和密码');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }

    console.log('2. Calling API...');
    setLoading(true);
    setError('');

    try {
      const result = isRegister
        ? await api.register(phone, password)
        : await api.loginWithPassword(phone, password);

      console.log('3. API result:', result);

      if (result.success && result.data) {
        console.log('4. Login success');
        onLoginSuccess(result.data.user);
        onClose();
      } else {
        console.log('5. Login failed:', result.error);
        setError(result.error || (isRegister ? '注册失败' : '登录失败'));
      }
    } catch (err) {
      console.error('6. Login error:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Phone changing to:', e.target.value);
    setPhone(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Password changing to:', e.target.value);
    setPassword(e.target.value);
  };

  const onButtonClick = () => {
    console.log('Button onclick fired, phone:', phone, 'password length:', password.length);
    console.log('Loading state:', loading);
    handleSubmit();
  };

  useEffect(() => {
    console.log('LoginModal isOpen:', isOpen);
    console.log('Current state - phone:', phone, 'password:', password ? '****' : 'empty', 'isRegister:', isRegister);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800">{isRegister ? '注册' : '登录'}</h2>
          <p className="text-gray-500 text-sm mt-2">手机号 + 密码 {isRegister ? '即可完成注册' : '即可登录'}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="请输入手机号"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={11}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="请输入密码"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="button"
            onClick={onButtonClick}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg"
          >
            {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {isRegister ? '已有账号？立即登录' : '没有账号？立即注册'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>登录即表示同意《用户协议》和《隐私政策》</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
        >
          稍后再说
        </button>
      </div>
    </div>
  );
}