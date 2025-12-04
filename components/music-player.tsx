import { useState, useEffect, useRef, useCallback, ChangeEvent, TouchEvent } from 'react';

import { Playlist } from '../types';
import { getYouTubeVideoId, isYouTubeUrl } from '../lib/utils/youtube';
import { getCookie, setCookie } from '../lib/utils/cookies';
import styles from './music-player.module.css';

interface MusicPlayerProps {
  playlist: Playlist[];
  isOpen: boolean;
  onClose: () => void;
  onTrackChange?: (track: Playlist) => void;
  autoPlay?: boolean;
}

export default function MusicPlayer({
  playlist,
  isOpen,
  onClose,
  onTrackChange,
  autoPlay = false,
}: MusicPlayerProps) {
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
  const [autoPlayTriggered, setAutoPlayTriggered] = useState<boolean>(false);
  const [userPaused, setUserPaused] = useState<boolean>(false);
  const playlistContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Touch gesture state for swipe-down to close
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const playerRef = useRef<HTMLDivElement | null>(null);

  // Touch handlers for swipe-down to close (mobile only)
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchStartX.current = touch.clientX;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartY.current;
    const deltaX = Math.abs(touch.clientX - touchStartX.current);
    
    // Only trigger swipe if vertical movement is greater than horizontal
    // and the swipe is downward
    if (deltaY > 0 && deltaY > deltaX) {
      setSwipeOffset(deltaY);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    // If swiped down more than 100px, close the player
    if (swipeOffset > 100) {
      onClose();
    }
    // Reset state
    touchStartY.current = null;
    touchStartX.current = null;
    setSwipeOffset(0);
  }, [swipeOffset, onClose]);

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

  const changeTrack = (newIndex: number) => {
    setCurrentTrackIndex(newIndex);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleNext = useCallback(() => {
    if (playlist.length > 0) {
      const wasPlaying = isPlaying;
      const nextIndex = (currentTrackIndex + 1) % playlist.length;
      changeTrack(nextIndex);
      setIsPlaying(wasPlaying);
    }
  }, [playlist.length, currentTrackIndex, isPlaying]);

  // handleNext를 ref로 저장하여 최신 버전 유지
  const handleNextRef = useRef(handleNext);
  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  const handlePrevious = () => {
    if (playlist.length > 0) {
      const wasPlaying = isPlaying;
      const prevIndex =
        (currentTrackIndex - 1 + playlist.length) % playlist.length;
      changeTrack(prevIndex);
      setIsPlaying(wasPlaying);
    }
  };

  // YouTube IFrame API 로드 및 초기화
  useEffect(() => {
    if (!isYouTube || !youtubeVideoId) return;

    // 기존 플레이어가 이미 존재하면 새 비디오만 로드
    if (youtubePlayerRef.current) {
      try {
        const anyPlayer = youtubePlayerRef.current as unknown as {
          loadVideoById?: (id: string) => void;
          cueVideoById?: (id: string) => void;
        };

        if (isPlaying && typeof anyPlayer.loadVideoById === "function") {
          anyPlayer.loadVideoById(youtubeVideoId);
        } else if (!isPlaying && typeof anyPlayer.cueVideoById === "function") {
          anyPlayer.cueVideoById(youtubeVideoId);
        } else if (typeof anyPlayer.loadVideoById === "function") {
          anyPlayer.loadVideoById(youtubeVideoId);
        }
      } catch (e) {
        console.error("Error loading YouTube video by id:", e);
      }
      return;
    }

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
                    // ref를 통해 최신 handleNext 함수 호출
                    handleNextRef.current();
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
  }, [isYouTube, youtubeVideoId, volume, isPlaying]); // handleNext는 ref로 처리하므로 의존성에서 제거

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
      // ref를 통해 최신 handleNext 함수 호출
      handleNextRef.current();
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
  }, [currentTrackIndex, isYouTube, volume]); // handleNext는 ref로 처리하므로 의존성에서 제거

  // YouTube 시간 업데이트
  useEffect(() => {
    if (!isYouTube || !youtubePlayerRef.current) return;

    const interval = setInterval(() => {
      try {
        if (
          typeof youtubePlayerRef.current?.getCurrentTime === "function" &&
          typeof youtubePlayerRef.current?.getDuration === "function"
        ) {
          const currentTime = youtubePlayerRef.current.getCurrentTime();
          const duration = youtubePlayerRef.current.getDuration();
          setCurrentTime(currentTime || 0);
          setDuration(duration || 0);

          // 현재 트랙의 duration 저장
          if (duration && currentTrack) {
            setTrackDurations((prev) => ({
              ...prev,
              [currentTrack.id || currentTrackIndex]: duration,
            }));
          }
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
          // 플레이어가 실제로 초기화되었는지 확인
          if (
            typeof youtubePlayerRef.current.getPlayerState === "function" &&
            typeof youtubePlayerRef.current.setVolume === "function"
          ) {
            const playerState = youtubePlayerRef.current.getPlayerState();
            // 플레이어가 준비되었을 때만 볼륨 설정
            if (playerState !== undefined) {
              youtubePlayerRef.current.setVolume(volume * 100);
            }
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
          // 플레이어가 실제로 초기화되었는지 확인
          if (
            typeof youtubePlayerRef.current.getPlayerState !== "function" ||
            !window.YT ||
            !window.YT.PlayerState
          ) {
            // 플레이어가 아직 준비되지 않았으면 준비될 때까지 대기
            setTimeout(() => {
              if (youtubePlayerRef.current && isPlaying) {
                try {
                  if (
                    typeof youtubePlayerRef.current.playVideo === "function"
                  ) {
                    youtubePlayerRef.current.playVideo();
                  }
                } catch (e) {
                  console.error("Error playing YouTube video:", e);
                }
              }
            }, 100);
            return;
          }

          // 플레이어가 준비되었는지 확인
          const playerState = youtubePlayerRef.current.getPlayerState();
          if (
            playerState === window.YT.PlayerState.UNSTARTED ||
            playerState === window.YT.PlayerState.CUED
          ) {
            // 플레이어가 준비되지 않았으면 준비될 때까지 대기
            setTimeout(() => {
              if (youtubePlayerRef.current && isPlaying) {
                try {
                  if (
                    typeof youtubePlayerRef.current.playVideo === "function"
                  ) {
                    youtubePlayerRef.current.playVideo();
                  }
                } catch (e) {
                  console.error("Error playing YouTube video:", e);
                }
              }
            }, 100);
            return;
          }

          if (isPlaying) {
            if (typeof youtubePlayerRef.current.playVideo === "function") {
              youtubePlayerRef.current.playVideo();
            }
          } else {
            if (typeof youtubePlayerRef.current.pauseVideo === "function") {
              youtubePlayerRef.current.pauseVideo();
            }
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

  // 자동 재생 처리 (한 번만 실행, 사용자가 일시중지한 경우 무시)
  useEffect(() => {
    if (
      autoPlay &&
      currentTrack &&
      !isPlaying &&
      !autoPlayTriggered &&
      !userPaused
    ) {
      // 약간의 지연 후 재생 (플레이어가 준비될 시간 확보)
      const timer = setTimeout(() => {
        setIsPlaying(true);
        setAutoPlayTriggered(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, currentTrack, isPlaying, autoPlayTriggered, userPaused]);

  // 트랙이 변경되면 자동 재생 플래그 리셋
  useEffect(() => {
    setAutoPlayTriggered(false);
    setUserPaused(false);
  }, [currentTrackIndex]);

  // 플레이리스트 버튼을 눌러 펼쳤을 때, 리스트 영역이 바로 보이도록 스크롤
  useEffect(() => {
    if (showPlaylist && playlistContainerRef.current) {
      try {
        playlistContainerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      } catch {
        // scrollIntoView 지원하지 않는 환경은 무시
      }
    }
  }, [showPlaylist]);

  // 현재 트랙이 변경될 때 부모 컴포넌트에 알림
  useEffect(() => {
    if (onTrackChange && currentTrack) {
      onTrackChange(currentTrack);
    }
  }, [currentTrackIndex, currentTrack, onTrackChange]);

  const handlePlayPause = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    // 사용자가 수동으로 일시중지한 경우 플래그 설정
    if (!newPlayingState) {
      setUserPaused(true);
    } else {
      setUserPaused(false);
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;

    if (isYouTube) {
      if (youtubePlayerRef.current) {
        try {
          if (typeof youtubePlayerRef.current.seekTo === "function") {
            youtubePlayerRef.current.seekTo(newTime, true);
            setCurrentTime(newTime);
          }
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
    if (index < 0 || index >= playlist.length) return;
    const wasPlaying = isPlaying;
    changeTrack(index);
    setIsPlaying(wasPlaying);
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
          className="absolute w-px h-px overflow-hidden opacity-0 pointer-events-none"
        />
      )}

      {/* UI는 팝업이 열려있을 때만 표시 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center md:justify-end md:items-end bg-black/40"
          onClick={onClose}
        >
          <div
            ref={playerRef}
            className="relative w-full max-w-[480px] md:w-80 md:max-w-[calc(100vw-40px)] bg-dark-card border border-dark-border rounded-t-2xl md:rounded-xl shadow-lg p-3 md:p-6 mb-0 md:mb-20 md:mr-5 flex flex-col gap-3 md:gap-4 text-dark-text animate-slide-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: swipeOffset > 0 ? `translateY(${swipeOffset}px)` : undefined,
              transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
              opacity: swipeOffset > 0 ? Math.max(0.5, 1 - swipeOffset / 200) : 1,
              touchAction: 'pan-x',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Swipe down indicator for mobile */}
            <div className="md:hidden flex justify-center mb-2">
              <div className="w-10 h-1 bg-dark-border-subtle rounded-full"></div>
            </div>
            {currentTrack.cover && (
              <div className="w-full flex justify-center mb-4 relative">
                <img
                  src={currentTrack.cover}
                  alt={`${currentTrack.title} cover`}
                  className="w-30 h-30 rounded-lg object-cover shadow-md"
                />
                <button
                  onClick={onClose}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-dark-muted hover:text-dark-text transition-colors cursor-pointer p-1 rounded-full"
                  aria-label="플레이어 닫기"
                >
                  <span className="material-icons text-xl">close</span>
                </button>
              </div>
            )}
            {!currentTrack.cover && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-dark-muted hover:text-dark-text transition-colors cursor-pointer p-1"
                aria-label="플레이어 닫기"
              >
                <span className="material-icons text-xl">close</span>
              </button>
            )}
            <div className="text-center">
              <div className="text-base font-semibold mb-1 text-dark-text">
                {currentTrack.title}
              </div>
              <div className="text-sm text-dark-muted">
                {currentTrack.artist || "Unknown Artist"}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek}
                className={styles.progressBar}
              />
              <div className="flex justify-between text-xs text-dark-muted font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex justify-center items-center gap-4">
              <button
                onClick={handlePrevious}
                className="bg-transparent border border-dark-border-subtle rounded-full w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-dark-gray hover:border-brand-green hover:text-brand-green text-dark-text disabled:opacity-50 disabled:cursor-not-allowed p-0"
                disabled={playlist.length <= 1}
                aria-label="이전 트랙"
              >
                <span className="material-icons text-2xl flex items-center justify-center leading-none">
                  skip_previous
                </span>
              </button>
              <button
                onClick={handlePlayPause}
                className="w-14 h-14 bg-brand-green text-dark-card border-none rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-brand-accent p-0"
                aria-label={isPlaying ? "일시정지" : "재생"}
              >
                <span className="material-icons text-3xl flex items-center justify-center leading-none">
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>
              <button
                onClick={handleNext}
                className="bg-transparent border border-dark-border-subtle rounded-full w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-dark-gray hover:border-brand-green hover:text-brand-green text-dark-text disabled:opacity-50 disabled:cursor-not-allowed p-0"
                disabled={playlist.length <= 1}
                aria-label="다음 트랙"
              >
                <span className="material-icons text-2xl flex items-center justify-center leading-none">
                  skip_next
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 md:mt-0 mt-2">
              <span className="text-base w-6">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className={styles.volumeBar}
              />
              <span className="text-xs text-dark-muted w-10 text-right font-mono">
                {Math.round(volume * 100)}%
              </span>
            </div>

            <div className="text-center pt-2 border-t border-dark-border">
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="bg-transparent border border-dark-border-subtle rounded-full w-10 h-10 p-0 cursor-pointer text-dark-muted flex items-center justify-center mx-auto transition-all duration-200 hover:bg-dark-gray hover:border-brand-green hover:text-brand-green"
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
                <span className="material-icons text-2xl">queue_music</span>
              </button>
            </div>

            {showPlaylist && (
              <div
                ref={playlistContainerRef}
                className="mt-2 md:mt-3 border-t border-dark-border pt-2 md:pt-3 flex-1 min-h-[40vh] overflow-y-auto md:flex-none md:max-h-[300px]"
              >
                <div className="mb-2 md:mb-3">
                  <h4 className="text-sm font-semibold text-dark-text font-mono m-0">
                    플레이리스트
                  </h4>
                </div>
                <div className="flex flex-col gap-2">
                  {playlist.map((track, index) => {
                    const trackDuration = getTrackDuration(track);
                    const isCurrentTrack = index === currentTrackIndex;

                    return (
                      <div
                        key={track.id || index}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all duration-200 border border-transparent ${
                          isCurrentTrack
                            ? "bg-brand-green/10 border-brand-green"
                            : "hover:bg-dark-gray hover:border-dark-border"
                        }`}
                        onClick={() => handleTrackSelect(index)}
                      >
                        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-dark-gray flex items-center justify-center">
                          {track.cover ? (
                            <img
                              src={track.cover}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl bg-dark-border">
                              🎵
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-dark-text mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                            {track.title}
                          </div>
                          <div className="text-xs text-dark-muted overflow-hidden text-ellipsis whitespace-nowrap">
                            {track.artist || "Unknown Artist"}
                          </div>
                        </div>
                        <div className="text-xs text-dark-muted flex-shrink-0 min-w-[45px] text-right font-mono">
                          {trackDuration ? formatTime(trackDuration) : "--:--"}
                        </div>
                        {isCurrentTrack && (
                          <div className="text-sm text-brand-green flex-shrink-0 w-5 text-center">
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
        </div>
      )}
    </>
  );
}

