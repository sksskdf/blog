import { getAllPlaylists, createPlaylist } from '../../../lib/playlists';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Playlist } from '@/types';
import { isYouTubeUrl } from '../../../lib/utils/youtube';
import { checkYouTubeEmbeddable } from '../../../lib/utils/youtube-embed-check';

export async function GET(): Promise<NextResponse<Playlist[] | ApiResponse>> {
  try {
    const playlists = await getAllPlaylists();
    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error getting playlists:', error);
    return NextResponse.json({ error: 'Failed to get playlists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse & { id?: number }>> {
  try {
    const body = await request.json();
    const { title, artist, url, cover, duration, displayOrder } = body;

    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
    }

    // YouTube URL인 경우 외부 재생 가능 여부 확인
    if (isYouTubeUrl(url)) {
      const embedCheck = await checkYouTubeEmbeddable(url);
      if (!embedCheck.embeddable) {
        return NextResponse.json(
          { 
            error: embedCheck.error || '이 동영상은 외부 재생이 허용되지 않습니다. 다른 동영상을 선택해주세요.' 
          },
          { status: 400 }
        );
      }
    }

    const id = await createPlaylist(title, artist, url, cover, duration, displayOrder);

    return NextResponse.json({ success: true, id, message: 'Playlist created successfully' });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}

