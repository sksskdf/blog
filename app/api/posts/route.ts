import { createPost, getSortedPostsData } from '../../../lib/posts';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Post } from '@/types';

// 60초마다 재검증
export const revalidate = 60;

export async function GET(): Promise<NextResponse<Post[] | ApiResponse>> {
  try {
    const posts = await getSortedPostsData();
    const response = NextResponse.json(posts);
    // 브라우저 캐싱 헤더 추가
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error) {
    console.error('Error getting posts:', error);
    return NextResponse.json({ error: 'Failed to get posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const { id, title, date, content, category } = body;

    if (!id || !title || !date || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await createPost(id, title, date, content, category || null);

    return NextResponse.json({ success: true, message: 'Post created successfully' });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

