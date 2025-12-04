import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { ApiResponse } from '../../../types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const { password } = body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ error: 'Admin password not configured' }, { status: 500 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // 타이밍 공격 방지를 위해 constant-time 비교 사용
    const passwordBuffer = Buffer.from(password, 'utf8');
    const adminPasswordBuffer = Buffer.from(adminPassword, 'utf8');
    
    // 길이가 다르면 타이밍 공격에 취약할 수 있으므로, 같은 길이로 맞춰서 비교
    if (passwordBuffer.length !== adminPasswordBuffer.length) {
      // 길이가 다르면 더미 비교를 수행하여 타이밍 공격 방지
      timingSafeEqual(
        Buffer.alloc(adminPasswordBuffer.length),
        adminPasswordBuffer
      );
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    if (timingSafeEqual(passwordBuffer, adminPasswordBuffer)) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    console.error('Error in admin auth:', error);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
}

