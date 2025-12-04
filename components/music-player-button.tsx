import { useState, useEffect } from 'react';

import { Playlist } from '../types';
import MusicPlayer from './music-player';
import AutoplayToast from './autoplay-toast';

export default function MusicPlayerButton() {
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const [playlist, setPlaylist] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTrack, setCurrentTrack] = useState<Playlist | null>(null);
  const [shouldAutoplay, setShouldAutoplay] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

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
            
            // 홈페이지에서만 자동 재생 토스트 표시 (매번 표시)
            const isHomePage = window.location.pathname === '/';
            if (isHomePage) {
              setShowToast(true);
            }
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

  const handleAutoplayAccept = () => {
    setShouldAutoplay(true);
    setShowToast(false);
  };

  const handleAutoplayDecline = () => {
    setShouldAutoplay(false);
    setShowToast(false);
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
        className="fixed bottom-5 right-5 w-16 h-16 rounded-full bg-brand-green text-dark-card border-2 border-brand-green text-3xl cursor-pointer shadow-lg z-[999] flex items-center justify-center transition-all duration-300 hover:bg-brand-accent hover:border-brand-accent hover:scale-110 hover:shadow-xl active:scale-95"
        aria-label="뮤직 플레이어 열기"
        onClick={togglePlayer}
        style={{
          backgroundImage: displayCover ? `url(${displayCover})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {!displayCover && (
          <span className="flex items-center justify-center w-full h-full bg-brand-green/90 rounded-full text-dark-card">
            {defaultIcon}
          </span>
        )}
      </button>
      <MusicPlayer
        playlist={playlist}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        onTrackChange={handleTrackChange}
        autoPlay={shouldAutoplay}
      />
      {showToast && (
        <AutoplayToast
          onAccept={handleAutoplayAccept}
          onDecline={handleAutoplayDecline}
        />
      )}
    </>
  );
}

