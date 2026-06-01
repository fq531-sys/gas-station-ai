import { NextRequest, NextResponse } from 'next/server';
import { userStore, hashPassword, generateToken } from '@/lib/userStore';

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ success: false, error: '手机号和密码不能为空' }, { status: 400 });
    }

    // 检查用户是否存在
    const user = userStore.get(phone);
    if (!user) {
      return NextResponse.json({ success: false, error: '该手机号未注册，请先注册' }, { status: 400 });
    }

    // 验证密码
    if (user.password !== hashPassword(password)) {
      return NextResponse.json({ success: false, error: '密码错误' }, { status: 400 });
    }

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
    console.error('登录错误:', error);
    return NextResponse.json({ success: false, error: '登录失败' }, { status: 500 });
  }
}