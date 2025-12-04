import { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import styles from './music-player.module.css';
import { Playlist } from '../types';

// YouTube URL에서 비디오 ID 추출
function getYouTubeVideoId(url: string | null): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// YouTube URL인지 확인
function isYouTubeUrl(url: string | null): boolean {
  return url ? (url.includes('youtube.com') || url.includes('youtu.be')) : false;
}

interface MusicPlayerProps {
  playlist: Playlist[];
  isOpen: boolean;
  onClose: () => void;
  onTrackChange?: (track: Playlist) => void;
}

export default function MusicPlayer({ playlist, isOpen, onClose, onTrackChange }: MusicPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubePlayerRef = useRef<YT.Player | null>(null);
  const [isYouTube, setIsYouTube] = useState<boolean>(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const youtubeContainerId = useRef<string>(`youtube-player-${Date.now()}-${Math.random()}`);
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
  const [trackDurations, setTrackDurations] = useState<Record<number | string, number>>({});

  const currentTrack = playlist[currentTrackIndex] || null;

  const handleNext = useCallback(() => {
    if (playlist.length > 0) {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
      setIsPlaying(true);
    }
  }, [playlist.length]);

  // YouTube IFrame API 로드 및 초기화
  useEffect(() => {
    if (!isYouTube || !youtubeVideoId) return;

    let playerInitialized = false;
    let retryCount = 0;
    const maxRetries = 5;

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        // 약간의 지연을 두고 초기화 (컨테이너가 렌더링될 시간 확보)
        setTimeout(() => {
          initializeYouTubePlayer();
        }, 100);
      } else {
        // API가 아직 로드되지 않았으면 로드
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }
        
        // API 로드 완료 대기
        const originalCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (originalCallback) originalCallback();
          setTimeout(() => {
            if (!playerInitialized) {
              initializeYouTubePlayer();
            }
          }, 100);
        };
      }
    };

    const initializeYouTubePlayer = () => {
      if (playerInitialized) return;
      
      // 컨테이너가 존재하는지 확인 (재시도 로직 포함)
      const checkContainer = () => {
        const container = document.getElementById(youtubeContainerId.current);
        if (!container) {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(checkContainer, 200);
            return;
          } else {
            console.error('YouTube container not found after retries');
            return;
          }
        }
        
        try {
          // 기존 플레이어가 있으면 제거
          if (youtubePlayerRef.current) {
            try {
              youtubePlayerRef.current.destroy();
            } catch (e) {
              // 무시
            }
          }

          // 컨테이너 비우기
          container.innerHTML = '';

          // 새로운 플레이어 생성
          youtubePlayerRef.current = new window.YT.Player(container, {
            videoId: youtubeVideoId,
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              enablejsapi: 1,
              fs: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
              origin: window.location.origin,
            },
            events: {
              onReady: (event) => {
                try {
                  const duration = event.target.getDuration();
                  setDuration(duration);
                  playerInitialized = true;
                } catch (e) {
                  console.error('Error getting YouTube duration:', e);
                }
              },
              onStateChange: (event) => {
                try {
                  if (event.data === window.YT.PlayerState.ENDED) {
                    handleNext();
                  } else if (event.data === window.YT.PlayerState.PLAYING) {
                    setIsPlaying(true);
                  } else if (event.data === window.YT.PlayerState.PAUSED) {
                    setIsPlaying(false);
                  }
                } catch (e) {
                  console.error('Error handling YouTube state change:', e);
                }
              },
              onError: (event) => {
                console.error('YouTube player error:', event.data);
              },
            },
          });
        } catch (e) {
          console.error('Error initializing YouTube player:', e);
        }
      };

      checkContainer();
    };

    // 약간의 지연을 두고 시작 (컨테이너가 DOM에 추가될 시간 확보)
    const timer = setTimeout(() => {
      loadYouTubeAPI();
    }, 100);

    return () => {
      clearTimeout(timer);
      playerInitialized = false;
      retryCount = 0;
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.destroy();
          youtubePlayerRef.current = null;
        } catch (e) {
          // 무시
        }
      }
    };
  }, [isYouTube, youtubeVideoId, handleNext]);

  // 트랙 변경 시 YouTube 여부 확인
  useEffect(() => {
    if (currentTrack && currentTrack.url) {
      const youtube = isYouTubeUrl(currentTrack.url);
      setIsYouTube(youtube);
      if (youtube) {
        const videoId = getYouTubeVideoId(currentTrack.url);
        setYoutubeVideoId(videoId);
      } else {
        setYoutubeVideoId(null);
      }
    }
  }, [currentTrack]);

  // 일반 오디오 파일 처리
  useEffect(() => {
    if (isYouTube) return; // YouTube는 별도 처리
    
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex, handleNext, isYouTube]);

  // YouTube 시간 업데이트
  useEffect(() => {
    if (!isYouTube || !youtubePlayerRef.current) return;

    const interval = setInterval(() => {
      try {
        const currentTime = youtubePlayerRef.current!.getCurrentTime();
        const duration = youtubePlayerRef.current!.getDuration();
        setCurrentTime(currentTime || 0);
        setDuration(duration || 0);
        
        // 현재 트랙의 duration 저장
        if (duration && currentTrack) {
          setTrackDurations(prev => ({
            ...prev,
            [currentTrack.id || currentTrackIndex]: duration
          }));
        }
      } catch (e) {
        // 플레이어가 준비되지 않았을 수 있음
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isYouTube, currentTrack, currentTrackIndex]);

  // 일반 오디오 파일 duration 저장
  useEffect(() => {
    if (isYouTube || !audioRef.current || !currentTrack) return;
    
    const audio = audioRef.current;
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setTrackDurations(prev => ({
          ...prev,
          [currentTrack.id || currentTrackIndex]: audio.duration
        }));
      }
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentTrackIndex, isYouTube, currentTrack]);

  useEffect(() => {
    if (isYouTube) {
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.setVolume(volume * 100);
        } catch (e) {
          console.error('Error setting YouTube volume:', e);
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
    }
  }, [volume, isYouTube]);

  useEffect(() => {
    if (isYouTube) {
      if (youtubePlayerRef.current) {
        try {
          // 플레이어가 준비되었는지 확인
          const playerState = youtubePlayerRef.current.getPlayerState();
          if (playerState === window.YT.PlayerState.UNSTARTED || 
              playerState === window.YT.PlayerState.CUED) {
            // 플레이어가 준비되지 않았으면 준비될 때까지 대기
            setTimeout(() => {
              if (youtubePlayerRef.current && isPlaying) {
                youtubePlayerRef.current.playVideo();
              }
            }, 100);
            return;
          }
          
          if (isPlaying) {
            youtubePlayerRef.current.playVideo();
          } else {
            youtubePlayerRef.current.pauseVideo();
          }
        } catch (e) {
          console.error('Error controlling YouTube player:', e);
        }
      }
    } else {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.play().catch(console.error);
        } else {
          audioRef.current.pause();
        }
      }
    }
  }, [isPlaying, currentTrackIndex, isYouTube]);

  // 현재 트랙이 변경될 때 부모 컴포넌트에 알림
  useEffect(() => {
    if (onTrackChange && currentTrack) {
      onTrackChange(currentTrack);
    }
  }, [currentTrackIndex, currentTrack, onTrackChange]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    if (playlist.length > 0) {
      setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    
    if (isYouTube) {
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.seekTo(newTime, true);
          setCurrentTime(newTime);
        } catch (e) {
          console.error('Error seeking YouTube video:', e);
        }
      }
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = newTime;
        setCurrentTime(newTime);
      }
    }
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTrackDuration = (track: Playlist): number | null => {
    const trackId = track.id || playlist.indexOf(track);
    return trackDurations[trackId] || track.duration || null;
  };

  if (!isOpen || !currentTrack) return null;

  return (
    <div className={styles.playerContainer}>
      <div className={styles.playerHeader}>
        <h3 className={styles.playerTitle}>뮤직 플레이어</h3>
        <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
          <span className="material-icons">close</span>
        </button>
      </div>
      <div className={styles.trackInfo}>
        <div className={styles.trackTitle}>{currentTrack.title}</div>
        <div className={styles.trackArtist}>{currentTrack.artist || 'Unknown Artist'}</div>
      </div>

      {!isYouTube && (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          preload="metadata"
        />
      )}
      
      {isYouTube && (
        <div 
          id={youtubeContainerId.current}
          style={{ 
            position: 'absolute',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            opacity: 0,
            pointerEvents: 'none'
          }}
        />
      )}

      <div className={styles.progressContainer}>
        <input
          type="range"
          min="0"
          max="100"
          value={duration ? (currentTime / duration) * 100 : 0}
          onChange={handleSeek}
          className={styles.progressBar}
        />
        <div className={styles.timeDisplay}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className={styles.controls}>
        <button onClick={handlePrevious} className={styles.controlButton} disabled={playlist.length <= 1}>
          ⏮
        </button>
        <button onClick={handlePlayPause} className={styles.playButton}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={handleNext} className={styles.controlButton} disabled={playlist.length <= 1}>
          ⏭
        </button>
      </div>

      <div className={styles.volumeContainer}>
        <span className={styles.volumeLabel}>🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className={styles.volumeBar}
        />
        <span className={styles.volumeValue}>{Math.round(volume * 100)}%</span>
      </div>

      <div className={styles.playlistInfo}>
        <button
          onClick={() => setShowPlaylist(!showPlaylist)}
          className={styles.playlistToggle}
        >
          {showPlaylist ? '플레이리스트 숨기기' : `플레이리스트 보기 (${currentTrackIndex + 1} / ${playlist.length})`}
        </button>
      </div>

      {showPlaylist && (
        <div className={styles.playlistContainer}>
          <div className={styles.playlistHeader}>
            <h4 className={styles.playlistTitle}>플레이리스트</h4>
          </div>
          <div className={styles.playlistList}>
            {playlist.map((track, index) => {
              const trackDuration = getTrackDuration(track);
              const isCurrentTrack = index === currentTrackIndex;
              
              return (
                <div
                  key={track.id || index}
                  className={`${styles.playlistItem} ${isCurrentTrack ? styles.playlistItemActive : ''}`}
                  onClick={() => handleTrackSelect(index)}
                >
                  <div className={styles.playlistItemCover}>
                    {track.cover ? (
                      <img src={track.cover} alt={track.title} />
                    ) : (
                      <div className={styles.playlistItemPlaceholder}>🎵</div>
                    )}
                  </div>
                  <div className={styles.playlistItemInfo}>
                    <div className={styles.playlistItemTitle}>{track.title}</div>
                    <div className={styles.playlistItemArtist}>{track.artist || 'Unknown Artist'}</div>
                  </div>
                  <div className={styles.playlistItemDuration}>
                    {trackDuration ? formatTime(trackDuration) : '--:--'}
                  </div>
                  {isCurrentTrack && (
                    <div className={styles.playlistItemPlaying}>
                      {isPlaying ? '▶' : '⏸'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

