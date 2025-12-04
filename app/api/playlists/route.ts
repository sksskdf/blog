import { getAllPlaylists, createPlaylist } from '../../../lib/playlists';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Playlist } from '../../../types';

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

    const id = await createPlaylist(title, artist, url, cover, duration, displayOrder);

    return NextResponse.json({ success: true, id, message: 'Playlist created successfully' });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}

