import { getTodayVisitorCount, incrementVisitorCount } from '@/lib/visitor-stats';
import { NextResponse } from 'next/server';
import { ApiResponse } from '../../../types';

export async function GET(): Promise<NextResponse<{ count: number } | ApiResponse>> {
  try {
    // 방문자수 자동 증가
    await incrementVisitorCount();
    const count = await getTodayVisitorCount();
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    return NextResponse.json({ error: 'Failed to get visitor stats' }, { status: 500 });
  }
}

