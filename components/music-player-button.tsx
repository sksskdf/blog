import { useState, useEffect } from 'react';
import MusicPlayer from './music-player';
import styles from './music-player-button.module.css';
import { Playlist } from '../types';

export default function MusicPlayerButton() {
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const [playlist, setPlaylist] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTrack, setCurrentTrack] = useState<Playlist | null>(null);

  useEffect(() => {
    // 플레이리스트 로드 (DB에서)
    const loadPlaylist = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/playlists');
        if (response.ok) {
          const data = await response.json() as Playlist[];
          // 배열이고 길이가 0보다 큰 경우에만 설정
          if (Array.isArray(data) && data.length > 0) {
            setPlaylist(data);
            // 첫 번째 트랙을 기본값으로 설정
            setCurrentTrack(data[0]);
          }
        }
      } catch (error) {
        console.error('Error loading playlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylist();
  }, []);

  const togglePlayer = () => {
    setIsPlayerOpen(!isPlayerOpen);
  };

  const handleTrackChange = (track: Playlist) => {
    setCurrentTrack(track);
  };

  // 로딩 중이거나 플레이리스트가 없으면 버튼을 표시하지 않음
  if (isLoading) {
    return null;
  }

  // 플레이리스트가 없으면 버튼을 표시하지 않음
  if (!playlist || playlist.length === 0) {
    return null;
  }

  // 현재 트랙의 커버 이미지 또는 기본 아이콘
  const displayCover = currentTrack?.cover || null;
  const defaultIcon = '🎵';

  return (
    <>
      <button
        className={styles.floatingButton}
        onClick={togglePlayer}
        aria-label="뮤직 플레이어 열기"
        style={{
          backgroundImage: displayCover ? `url(${displayCover})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {!displayCover && (
          <span className={styles.iconFallback}>{defaultIcon}</span>
        )}
      </button>
      <MusicPlayer
        playlist={playlist}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        onTrackChange={handleTrackChange}
      />
    </>
  );
}

