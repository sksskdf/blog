import { query, queryOne } from './db';
import { Playlist, PlaylistRow } from '../types';

export async function getAllPlaylists(): Promise<Playlist[]> {
  try {
    const result = await query(
      'SELECT id, title, artist, url, cover, duration, display_order FROM playlists ORDER BY display_order ASC, id ASC'
    );
    return result.map((row) => {
      const playlistRow = row as PlaylistRow;
      return {
        id: playlistRow.id,
        title: playlistRow.title,
        artist: playlistRow.artist || null,
        url: playlistRow.url,
        cover: playlistRow.cover || null,
        duration: playlistRow.duration || null,
      };
    });
  } catch (error) {
    console.error('Error getting playlists:', error);
    return [];
  }
}

export async function getPlaylistById(id: number): Promise<Playlist | null> {
  try {
    const playlist = await queryOne(
      'SELECT id, title, artist, url, cover, duration, display_order FROM playlists WHERE id = $1',
      [id]
    ) as PlaylistRow | null;
    
    if (!playlist) {
      return null;
    }

    return {
      id: playlist.id,
      title: playlist.title,
      artist: playlist.artist || null,
      url: playlist.url,
      cover: playlist.cover || null,
      duration: playlist.duration || null,
    };
  } catch (error) {
    console.error('Error getting playlist:', error);
    return null;
  }
}

export async function createPlaylist(
  title: string,
  artist: string | null,
  url: string,
  cover: string | null,
  duration: number | null,
  displayOrder: number
): Promise<number> {
  try {
    const result = await query(
      'INSERT INTO playlists (title, artist, url, cover, duration, display_order, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id',
      [title, artist || null, url, cover || null, duration || null, displayOrder || 0]
    );
    return (result[0] as { id: number }).id;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
}

export async function updatePlaylist(
  id: number,
  title: string,
  artist: string | null,
  url: string,
  cover: string | null,
  duration: number | null,
  displayOrder: number
): Promise<boolean> {
  try {
    const result = await query(
      'UPDATE playlists SET title = $1, artist = $2, url = $3, cover = $4, duration = $5, display_order = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
      [title, artist || null, url, cover || null, duration || null, displayOrder || 0, id]
    );
    return (result as { rowCount: number }).rowCount > 0;
  } catch (error) {
    console.error('Error updating playlist:', error);
    throw error;
  }
}

export async function deletePlaylist(id: number): Promise<boolean> {
  try {
    const result = await query('DELETE FROM playlists WHERE id = $1', [id]);
    return (result as { rowCount: number }).rowCount > 0;
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
}

