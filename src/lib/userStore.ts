import crypto from 'crypto';

// 共享用户存储
export interface UserRecord {
  id: string;
  phone: string;
  password: string;
  memberLevel: string;
  createdAt: Date;
}

// 使用内存存储（生产环境应使用数据库）
export const userStore = new Map<string, UserRecord>();

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateToken(): string {
  return crypto.randomUUID();
}