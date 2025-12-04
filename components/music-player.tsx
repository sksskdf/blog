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

// 쿠키에서 값 읽기
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

// 쿠키에 값 저장
function setCookie(name: string, value: string, days: number = 365): void {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
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
  const youtubeContainerId = useRef<string>(
    `youtube-player-${Date.now()}-${Math.random()}`
  );
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
  const [trackDurations, setTrackDurations] = useState<
    Record<number | string, number>
  >({});

  // 쿠키에서 볼륨값 불러오기
  useEffect(() => {
    const savedVolume = getCookie("musicPlayerVolume");
    if (savedVolume) {
      const volumeValue = parseFloat(savedVolume);
      if (!isNaN(volumeValue) && volumeValue >= 0 && volumeValue <= 1) {
        setVolume(volumeValue);
      }
    }
  }, []);

  const currentTrack = playlist[currentTrackIndex] || null;

  const handleNext = useCallback(() => {
    if (playlist.length > 0) {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
      setIsPlaying(true);
    }
  }, [playlist.length]);

  // YouTube IFrame API 로드 및 초기화
  useEffect(() => {
    // YouTube 트랙일 때 초기화 (팝업이 닫혀도 재생 유지를 위해 isOpen 체크 제거)
    if (!isYouTube || !youtubeVideoId) return;

    let playerInitialized = false;
    let retryCount = 0;
    const maxRetries = 10;

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        // 약간의 지연을 두고 초기화 (컨테이너가 렌더링될 시간 확보)
        setTimeout(() => {
          initializeYouTubePlayer();
        }, 100);
      } else {
        // API가 아직 로드되지 않았으면 로드
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const tag = document.createElement("script");
          tag.src = "https://www.youtube.com/iframe_api";
          const firstScriptTag = document.getElementsByTagName("script")[0];
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
            // 조용히 실패 처리
            console.warn("YouTube container not found after retries");
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
          container.innerHTML = "";

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
                  // YouTube 플레이어 준비 후 볼륨 적용
                  event.target.setVolume(volume * 100);
                  playerInitialized = true;
                } catch (e) {
                  console.error("Error getting YouTube duration:", e);
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
                  console.error("Error handling YouTube state change:", e);
                }
              },
              onError: (event) => {
                console.error("YouTube player error:", event.data);
              },
            },
          });
        } catch (e) {
          console.error("Error initializing YouTube player:", e);
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
      // 팝업이 닫혀도 플레이어는 유지 (재생 중단 방지)
      // cleanup에서 destroy하지 않음
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

    const updateTime = () => {
      if (!audio.paused) {
        setCurrentTime(audio.currentTime);
      }
    };
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      handleNext();
    };
    const handleLoadedMetadata = () => {
      // 메타데이터 로드 후 볼륨 적용
      audio.volume = volume;
      updateDuration();
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    // timeupdate 이벤트는 재생 중에만 발생하므로 추가로 interval 사용
    const timeInterval = setInterval(() => {
      if (!audio.paused && audio.currentTime > 0) {
        setCurrentTime(audio.currentTime);
      }
    }, 100);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    // 볼륨 즉시 적용 (이미 로드된 경우)
    if (audio.readyState >= 1) {
      audio.volume = volume;
      updateDuration();
    }

    return () => {
      clearInterval(timeInterval);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrackIndex, handleNext, isYouTube, volume]);

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
          setTrackDurations((prev) => ({
            ...prev,
            [currentTrack.id || currentTrackIndex]: duration,
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
        setTrackDurations((prev) => ({
          ...prev,
          [currentTrack.id || currentTrackIndex]: audio.duration,
        }));
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [currentTrackIndex, isYouTube, currentTrack]);

  useEffect(() => {
    if (isYouTube) {
      if (youtubePlayerRef.current) {
        try {
          const playerState = youtubePlayerRef.current.getPlayerState();
          // 플레이어가 준비되었을 때만 볼륨 설정
          if (playerState !== undefined) {
            youtubePlayerRef.current.setVolume(volume * 100);
          }
        } catch (e) {
          // 플레이어가 아직 준비되지 않았을 수 있음
        }
      }
    } else {
      if (audioRef.current) {
        // 오디오가 로드되었을 때만 볼륨 설정
        if (audioRef.current.readyState >= 1) {
          audioRef.current.volume = volume;
        }
      }
    }
  }, [volume, isYouTube]);

  useEffect(() => {
    if (isYouTube) {
      if (youtubePlayerRef.current) {
        try {
          // 플레이어가 준비되었는지 확인
          const playerState = youtubePlayerRef.current.getPlayerState();
          if (
            playerState === window.YT.PlayerState.UNSTARTED ||
            playerState === window.YT.PlayerState.CUED
          ) {
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
          console.error("Error controlling YouTube player:", e);
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
      setCurrentTrackIndex(
        (prev) => (prev - 1 + playlist.length) % playlist.length
      );
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
          console.error("Error seeking YouTube video:", e);
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
    setCookie("musicPlayerVolume", newVolume.toString());
  };

  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTrackDuration = (track: Playlist): number | null => {
    const trackId = track.id || playlist.indexOf(track);
    return trackDurations[trackId] || track.duration || null;
  };

  // 플레이어 로직은 항상 실행되도록 하고, UI만 조건부로 렌더링
  if (!currentTrack) return null;

  return (
    <>
      {/* 오디오 요소는 항상 렌더링 (팝업이 닫혀도 재생 유지) */}
      {!isYouTube && (
        <audio ref={audioRef} src={currentTrack.url} preload="metadata" />
      )}

      {/* YouTube 컨테이너도 항상 렌더링 (팝업이 닫혀도 재생 유지) */}
      {isYouTube && (
        <div
          id={youtubeContainerId.current}
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            overflow: "hidden",
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      )}

      {/* UI는 팝업이 열려있을 때만 표시 */}
      {isOpen && (
        <div className={styles.playerContainer}>
          {currentTrack.cover && (
            <div className={styles.albumArt}>
              <img src={currentTrack.cover} alt={`${currentTrack.title} cover`} />
            </div>
          )}
          <div className={styles.trackInfo}>
            <div className={styles.trackTitle}>{currentTrack.title}</div>
            <div className={styles.trackArtist}>
              {currentTrack.artist || "Unknown Artist"}
            </div>
          </div>

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
            <button
              onClick={handlePrevious}
              className={styles.controlButton}
              disabled={playlist.length <= 1}
              aria-label="이전 트랙"
            >
              <span className="material-icons">skip_previous</span>
            </button>
            <button
              onClick={handlePlayPause}
              className={styles.playButton}
              aria-label={isPlaying ? "일시정지" : "재생"}
            >
              <span className="material-icons">
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>
            <button
              onClick={handleNext}
              className={styles.controlButton}
              disabled={playlist.length <= 1}
              aria-label="다음 트랙"
            >
              <span className="material-icons">skip_next</span>
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
              title={
                showPlaylist
                  ? "플레이리스트 숨기기"
                  : `플레이리스트 보기 (${currentTrackIndex + 1} / ${
                      playlist.length
                    })`
              }
              aria-label={
                showPlaylist ? "플레이리스트 숨기기" : "플레이리스트 보기"
              }
            >
              <span className="material-icons">queue_music</span>
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
                      className={`${styles.playlistItem} ${
                        isCurrentTrack ? styles.playlistItemActive : ""
                      }`}
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
                        <div className={styles.playlistItemTitle}>
                          {track.title}
                        </div>
                        <div className={styles.playlistItemArtist}>
                          {track.artist || "Unknown Artist"}
                        </div>
                      </div>
                      <div className={styles.playlistItemDuration}>
                        {trackDuration ? formatTime(trackDuration) : "--:--"}
                      </div>
                      {isCurrentTrack && (
                        <div className={styles.playlistItemPlaying}>
                          {isPlaying ? "▶" : "⏸"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

