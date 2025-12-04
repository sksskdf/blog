import { updatePost, deletePost, getPostRawData } from '../../../../lib/posts';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Post } from '@/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<Post | ApiResponse>> {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const postData = await getPostRawData(id);
    
    if (!postData) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    return NextResponse.json(postData);
  } catch (error) {
    console.error('Error getting post:', error);
    return NextResponse.json({ error: 'Failed to get post' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, date, content, category } = body;

    if (!title || !date || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const success = await updatePost(id, title, date, content, category || null);

    if (success) {
      return NextResponse.json({ success: true, message: 'Post updated successfully' });
    } else {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const success = await deletePost(id);

    if (success) {
      return NextResponse.json({ success: true, message: 'Post deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

