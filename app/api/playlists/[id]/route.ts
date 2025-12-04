import { getPlaylistById, updatePlaylist, deletePlaylist } from '../../../../lib/playlists';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Playlist } from '../../../types';
import { isYouTubeUrl } from '../../../../lib/utils/youtube';
import { checkYouTubeEmbeddable } from '../../../../lib/utils/youtube-embed-check';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<Playlist | ApiResponse>> {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    const playlist = await getPlaylistById(parseInt(id, 10));
    
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }
    
    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error getting playlist:', error);
    return NextResponse.json({ error: 'Failed to get playlist' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

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

    const success = await updatePlaylist(parseInt(id, 10), title, artist, url, cover, duration, displayOrder);

    if (success) {
      return NextResponse.json({ success: true, message: 'Playlist updated successfully' });
    } else {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    const success = await deletePlaylist(parseInt(id, 10));

    if (success) {
      return NextResponse.json({ success: true, message: 'Playlist deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}

