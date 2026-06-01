// 加油站AI智能营销官 - API客户端

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface User {
  id: string;
  phone: string;
  memberLevel: 'free' | 'primary' | 'advanced' | 'ultimate';
  expireAt: string | null;
  createdAt: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || '请求失败' };
      }

      return { success: true, ...data };
    } catch (error) {
      console.error('API请求失败:', error);
      return { success: false, error: '网络错误，请检查连接' };
    }
  }

  // 健康检查
  async healthCheck() {
    return this.request<{ status: string; time: string }>('/api/health');
  }

  // 发送验证码
  async sendCode(phone: string) {
    return this.request<{ devCode?: string }>('/api/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  // 注册（密码模式）
  async register(phone: string, password: string) {
    const result = await this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });

    if (result.success && result.data) {
      this.setToken(result.data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }
    }

    return result;
  }

  // 登录（密码模式）
  async loginWithPassword(phone: string, password: string) {
    const result = await this.request<{ token: string; user: User }>('/api/auth/login-password', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });

    if (result.success && result.data) {
      this.setToken(result.data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }
    }

    return result;
  }

  // 登录/注册（验证码模式，已废弃）
  async login(phone: string, code: string) {
    const result = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });

    if (result.success && result.data) {
      this.setToken(result.data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }
    }

    return result;
  }

  // 获取用户信息
  async getUserInfo() {
    return this.request<User>('/api/user/info');
  }

  // 获取当前用户（从本地存储）
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // 检查是否已登录
  isLoggedIn(): boolean {
    return !!this.token;
  }

  // 检查会员权限
  async checkPermission(feature: string) {
    return this.request<{ hasPermission: boolean; memberLevel: string }>('/api/user/check-permission', {
      method: 'POST',
      body: JSON.stringify({ feature }),
    });
  }

  // 升级会员
  async upgrade(level: string, months: number) {
    const result = await this.request<{ token: string; user: User }>('/api/user/upgrade', {
      method: 'POST',
      body: JSON.stringify({ level, months }),
    });

    if (result.success && result.data) {
      this.setToken(result.data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }
    }

    return result;
  }

  // 保存数据
  async saveData(dataType: string, data: any) {
    return this.request('/api/data/save', {
      method: 'POST',
      body: JSON.stringify({ dataType, data }),
    });
  }

  // 获取数据列表
  async getDataList(dataType?: string) {
    const url = dataType ? `/api/data/list?dataType=${dataType}` : '/api/data/list';
    return this.request<any[]>('/api/data/list');
  }

  // 获取指定数据
  async getData(id: string) {
    return this.request<any>(`/api/data/${id}`);
  }
}

export const api = new ApiClient();
export type { User };