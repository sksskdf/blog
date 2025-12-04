import { getPlaylistById, updatePlaylist, deletePlaylist } from '../../../../lib/playlists';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Playlist } from '../../../types';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<Playlist | ApiResponse>> {
  try {
    const { id } = params;
    
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
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, artist, url, cover, duration, displayOrder } = body;

    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
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
    const { id } = params;
    
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

