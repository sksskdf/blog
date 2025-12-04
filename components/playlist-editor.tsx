'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import styles from './playlist-editor.module.css';
import { Playlist } from '../types';

export default function PlaylistEditor() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    url: '',
    cover: '',
    duration: '',
    displayOrder: 0,
  });
  const [isAdding, setIsAdding] = useState<boolean>(false);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const response = await fetch('/api/playlists');
      if (response.ok) {
        const data = await response.json() as Playlist[];
        setPlaylists(data);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      title: '',
      artist: '',
      url: '',
      cover: '',
      duration: '',
      displayOrder: playlists.length,
    });
  };

  const handleEdit = (playlist: Playlist) => {
    setEditingId(playlist.id);
    setIsAdding(false);
    setFormData({
      title: playlist.title || '',
      artist: playlist.artist || '',
      url: playlist.url || '',
      cover: playlist.cover || '',
      duration: playlist.duration?.toString() || '',
      displayOrder: 0,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 곡을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/playlists/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('플레이리스트가 삭제되었습니다.');
        loadPlaylists();
      } else {
        alert('플레이리스트 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('플레이리스트 삭제에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const url = editingId ? `/api/playlists/${editingId}` : '/api/playlists';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          duration: formData.duration ? parseInt(formData.duration, 10) : null,
          displayOrder: parseInt(formData.displayOrder.toString(), 10) || 0,
        }),
      });

      if (response.ok) {
        alert(editingId ? '플레이리스트가 수정되었습니다.' : '플레이리스트가 추가되었습니다.');
        setIsAdding(false);
        setEditingId(null);
        setFormData({
          title: '',
          artist: '',
          url: '',
          cover: '',
          duration: '',
          displayOrder: 0,
        });
        loadPlaylists();
      } else {
        const error = await response.json() as { error?: string };
        alert(`오류: ${error.error || '플레이리스트 저장에 실패했습니다.'}`);
      }
    } catch (error) {
      console.error('Error saving playlist:', error);
      alert('플레이리스트 저장에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      title: '',
      artist: '',
      url: '',
      cover: '',
      duration: '',
      displayOrder: 0,
    });
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorHeader}>
        <button onClick={handleAdd} className={styles.addButton}>
          + 곡 추가
        </button>
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className={styles.editorForm}>
          <div className={styles.formRow}>
            <label>
              제목 *
              <input
                type="text"
                value={formData.title}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </label>
            <label>
              아티스트
              <input
                type="text"
                value={formData.artist}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, artist: e.target.value })}
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label>
              URL *
              <input
                type="text"
                value={formData.url}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, url: e.target.value })}
                required
                placeholder="https://..."
              />
            </label>
            <label>
              앨범 커버 URL
              <input
                type="text"
                value={formData.cover}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, cover: e.target.value })}
                placeholder="https://..."
              />
            </label>
          </div>
          <div className={styles.formRow}>
            <label>
              재생 길이 (초)
              <input
                type="number"
                value={formData.duration}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="자동 감지"
              />
            </label>
            <label>
              표시 순서
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={handleCancel} className={styles.cancelButton}>
              취소
            </button>
            <button type="submit" className={styles.saveButton}>
              저장
            </button>
          </div>
        </form>
      )}

      <div className={styles.playlistList}>
        {playlists.map((playlist) => (
          <div key={playlist.id} className={styles.playlistItem}>
            <div className={styles.playlistItemCover}>
              {playlist.cover ? (
                <img src={playlist.cover} alt={playlist.title} />
              ) : (
                <div className={styles.coverPlaceholder}>🎵</div>
              )}
            </div>
            <div className={styles.playlistItemInfo}>
              <div className={styles.playlistItemTitle}>{playlist.title}</div>
              <div className={styles.playlistItemArtist}>{playlist.artist || 'Unknown Artist'}</div>
              <div className={styles.playlistItemUrl}>{playlist.url}</div>
            </div>
            <div className={styles.playlistItemActions}>
              <button
                onClick={() => handleEdit(playlist)}
                className={styles.editButton}
              >
                수정
              </button>
              <button
                onClick={() => handleDelete(playlist.id)}
                className={styles.deleteButton}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

