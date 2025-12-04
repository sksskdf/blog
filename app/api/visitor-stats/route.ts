import { getTodayVisitorCount, incrementVisitorCount } from '@/lib/visitor-stats';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '../../../types';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest): Promise<NextResponse<{ count: number } | ApiResponse>> {
  try {
    const cookieStore = await cookies();
    const today = new Date().toISOString().split('T')[0];
    const visitorCookie = cookieStore.get('visitor_counted');
    
    // 쿠키가 없거나 오늘 날짜가 아니면 카운팅
    if (!visitorCookie || visitorCookie.value !== today) {
      await incrementVisitorCount();
      
      // 자정까지의 시간 계산
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const msUntilMidnight = midnight.getTime() - now.getTime();
      const secondsUntilMidnight = Math.floor(msUntilMidnight / 1000);
      
      // 쿠키 설정 (자정에 만료)
      const response = NextResponse.json({ count: await getTodayVisitorCount() });
      response.cookies.set('visitor_counted', today, {
        expires: midnight,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });
      
      return response;
    }
    
    // 이미 오늘 카운팅된 경우
    const count = await getTodayVisitorCount();
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    return NextResponse.json({ error: 'Failed to get visitor stats' }, { status: 500 });
  }
}

