import { NextRequest, NextResponse } from 'next/server';
import { userStore, hashPassword, generateToken } from '@/lib/userStore';

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ success: false, error: '手机号和密码不能为空' }, { status: 400 });
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ success: false, error: '手机号格式不正确' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: '密码至少6位' }, { status: 400 });
    }

    // 检查是否已存在
    if (userStore.has(phone)) {
      return NextResponse.json({ success: false, error: '该手机号已注册，请直接登录' }, { status: 400 });
    }

    // 创建用户
    const user = {
      id: crypto.randomUUID(),
      phone,
      password: hashPassword(password),
      memberLevel: 'free',
      createdAt: new Date(),
    };
    userStore.set(phone, user);

    // 生成token
    const token = generateToken();

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          memberLevel: user.memberLevel,
          createdAt: user.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json({ success: false, error: '注册失败' }, { status: 500 });
  }
}