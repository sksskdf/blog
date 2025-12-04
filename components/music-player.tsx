import {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
  TouchEvent,
} from "react";

import { Playlist } from "../types";
import { getYouTubeVideoId, isYouTubeUrl } from "../lib/utils/youtube";
import { getCookie, setCookie } from "../lib/utils/cookies";
import styles from "./music-player.module.css";

// Constants for swipe gesture
const SWIPE_CLOSE_THRESHOLD = 100; // pixels to swipe down before closing
const SWIPE_OPACITY_THRESHOLD = 200; // pixels for full opacity fade
const THROTTLE_MS = 16; // ~60fps throttle for touch move

interface MusicPlayerProps {
  playlist: Playlist[];
  currentTrack: Playlist | null;
  isOpen: boolean;
  onClose: () => void;
  onTrackChange?: (track: Playlist) => void;
  autoPlay?: boolean;
}

export default function MusicPlayer({
  playlist,
  currentTrack: externalCurrentTrack,
  isOpen,
  onClose,
  onTrackChange,
  autoPlay = false,
}: MusicPlayerProps) {
  // externalCurrentTrack이 변경되면 currentTrackIndex 동기화
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);

  useEffect(() => {
    if (externalCurrentTrack) {
      const index = playlist.findIndex(
        (track) =>
          track.id === externalCurrentTrack.id ||
          track.url === externalCurrentTrack.url
      );
      if (index !== -1) {
        setCurrentTrackIndex(index);
      }
    }
  }, [externalCurrentTrack, playlist]);
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

  // volume을 ref로 관리하여 useEffect 재실행 방지
  const volumeRef = useRef<number>(volume);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Touch gesture state for swipe-down to close
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const lastTouchMoveTime = useRef<number>(0);
  const swipeOffsetRef = useRef<number>(0);
  const shouldPlayAfterTrackChange = useRef<boolean>(false);

  useEffect(() => {
    swipeOffsetRef.current = swipeOffset;
  }, [swipeOffset]);

  // Touch handlers for swipe-down to close (mobile only)
  // Applied to the swipe indicator area at the top of the player
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchStartX.current = touch.clientX;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null || touchStartX.current === null) return;

    // 드래그 중 스크롤 방지
    e.preventDefault();
    e.stopPropagation();

    // Throttle updates to improve performance
    const now = Date.now();
    if (now - lastTouchMoveTime.current < THROTTLE_MS) return;
    lastTouchMoveTime.current = now;

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
    // If swiped down more than threshold, close the player
    if (swipeOffset > SWIPE_CLOSE_THRESHOLD) {
      onClose();
    }
    // Reset state
    touchStartY.current = null;
    touchStartX.current = null;
    setSwipeOffset(0);
  }, [swipeOffset, onClose]);

  // non-passive 이벤트 리스너 등록 (모바일 드래그를 위해)
  useEffect(() => {
    if (!isOpen || !playerRef.current) return;

    const element = playerRef.current;
    const swipeIndicator = element.querySelector(
      "[data-swipe-indicator]"
    ) as HTMLElement;
    if (!swipeIndicator) return;

    // 모바일에서만 non-passive 리스너 등록
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    // 이벤트 핸들러를 로컬 함수로 정의 (DOM TouchEvent 사용)
    const touchStartHandler = (e: globalThis.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      touchStartY.current = touch.clientY;
      touchStartX.current = touch.clientX;
    };

    const touchMoveHandler = (e: globalThis.TouchEvent) => {
      if (touchStartY.current === null || touchStartX.current === null) return;

      // 드래그 중 스크롤 방지
      e.preventDefault();
      e.stopPropagation();

      // Throttle updates to improve performance
      const now = Date.now();
      if (now - lastTouchMoveTime.current < THROTTLE_MS) return;
      lastTouchMoveTime.current = now;

      const touch = e.touches[0];
      if (!touch) return;

      const deltaY = touch.clientY - touchStartY.current;
      const deltaX = Math.abs(touch.clientX - touchStartX.current);

      // Only trigger swipe if vertical movement is greater than horizontal
      // and the swipe is downward
      if (deltaY > 0 && deltaY > deltaX) {
        setSwipeOffset(deltaY);
      }
    };

    const touchEndHandler = () => {
      // swipeOffset을 ref로 확인하여 최신 값 사용
      const currentOffset = swipeOffsetRef.current;
      if (currentOffset > SWIPE_CLOSE_THRESHOLD) {
        onClose();
      }
      // Reset state
      touchStartY.current = null;
      touchStartX.current = null;
      setSwipeOffset(0);
    };

    // non-passive 옵션으로 이벤트 리스너 등록
    swipeIndicator.addEventListener(
      "touchstart",
      touchStartHandler as EventListener,
      { passive: false }
    );
    swipeIndicator.addEventListener(
      "touchmove",
      touchMoveHandler as EventListener,
      { passive: false }
    );
    swipeIndicator.addEventListener("touchend", touchEndHandler, {
      passive: false,
    });

    return () => {
      // 노드가 여전히 DOM에 존재하는지 확인
      if (
        swipeIndicator &&
        swipeIndicator.parentNode &&
        document.contains(swipeIndicator)
      ) {
        try {
          swipeIndicator.removeEventListener(
            "touchstart",
            touchStartHandler as EventListener
          );
          swipeIndicator.removeEventListener(
            "touchmove",
            touchMoveHandler as EventListener
          );
          swipeIndicator.removeEventListener("touchend", touchEndHandler);
        } catch (error) {
          // 노드가 이미 제거된 경우 에러 무시
          console.warn("Error removing touch event listeners:", error);
        }
      }
    };
  }, [isOpen, onClose]);

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

  // context에서 전달받은 currentTrack 우선 사용, 없으면 playlist에서 가져옴
  const currentTrack =
    externalCurrentTrack || playlist[currentTrackIndex] || null;

  const changeTrack = (newIndex: number) => {
    setCurrentTrackIndex(newIndex);
    setCurrentTime(0);
    setDuration(0);
    // context의 currentTrack도 업데이트
    const newTrack = playlist[newIndex];
    if (newTrack && onTrackChange) {
      onTrackChange(newTrack);
    }
  };

  const handleNext = useCallback(() => {
    if (playlist.length > 0) {
      const wasPlaying = isPlaying;
      const nextIndex = (currentTrackIndex + 1) % playlist.length;
      // 재생 상태를 ref에 저장
      shouldPlayAfterTrackChange.current = wasPlaying;
      changeTrack(nextIndex);
      // setIsPlaying은 useEffect에서 처리
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
      // 재생 상태를 ref에 저장
      shouldPlayAfterTrackChange.current = wasPlaying;
      changeTrack(prevIndex);
      // setIsPlaying은 useEffect에서 처리
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
      // 컴포넌트가 언마운트되었는지 확인
      if (!document.getElementById(youtubeContainerId.current)) {
        return;
      }

      if (window.YT && window.YT.Player) {
        // 약간의 지연을 두고 초기화 (컨테이너가 렌더링될 시간 확보)
        setTimeout(() => {
          // 다시 한 번 확인
          if (document.getElementById(youtubeContainerId.current)) {
            initializeYouTubePlayer();
          }
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
            // 컴포넌트가 여전히 마운트되어 있는지 확인
            if (
              !playerInitialized &&
              document.getElementById(youtubeContainerId.current)
            ) {
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
        if (!container || !document.contains(container)) {
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
          // 컨테이너가 여전히 DOM에 존재하는지 확인
          if (!document.contains(container)) {
            console.warn("YouTube container no longer in DOM");
            return;
          }

          // 기존 플레이어가 있으면 제거
          if (youtubePlayerRef.current) {
            try {
              youtubePlayerRef.current.destroy();
              youtubePlayerRef.current = null;
            } catch (e) {
              // 무시
              youtubePlayerRef.current = null;
            }
          }

          // 새로운 플레이어 생성 (YouTube Player가 자동으로 컨테이너를 관리)
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
                  event.target.setVolume(volumeRef.current * 100);
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
      // 컴포넌트가 언마운트될 때만 플레이어 정리
      // (isYouTube가 false가 되거나 컴포넌트가 완전히 언마운트될 때)
      // 팝업이 닫혀도 플레이어는 유지 (재생 중단 방지)
      // cleanup에서 destroy하지 않음
    };
  }, [isYouTube, youtubeVideoId, isPlaying]); // volume은 의존성에서 제거 (volumeRef 사용)

  // audio element와 YouTube container를 직접 DOM에 추가/제거 (React 제어에서 완전히 분리)
  // 트랙이 실제로 변경될 때만 재생성하여 재생 상태 유지
  useEffect(() => {
    if (typeof document === "undefined" || !currentTrack) return;

    // audio element 관리
    if (!isYouTube) {
      // 기존 audio element가 있고 URL이 같으면 재생성하지 않음 (재생 상태 유지)
      const existingAudio = document.querySelector(
        '[data-music-player-audio="true"]'
      ) as HTMLAudioElement | null;

      if (existingAudio && existingAudio.src === currentTrack.url) {
        // 기존 audio element를 ref에 연결
        (audioRef as React.MutableRefObject<HTMLAudioElement | null>).current =
          existingAudio;
        return; // cleanup 함수 없이 반환 (기존 요소 유지)
      }

      // 기존 audio element가 있지만 URL이 다르면 제거
      if (existingAudio && existingAudio.parentNode) {
        try {
          existingAudio.pause();
          existingAudio.src = "";
          existingAudio.load();
          existingAudio.parentNode.removeChild(existingAudio);
        } catch (e) {
          // 이미 제거되었을 수 있음
        }
      }

      // 새로운 audio element 생성
      const audioElement = document.createElement("audio");
      audioElement.src = currentTrack.url;
      audioElement.preload = "metadata";
      audioElement.setAttribute("data-music-player-audio", "true");
      document.body.appendChild(audioElement);
      (audioRef as React.MutableRefObject<HTMLAudioElement | null>).current =
        audioElement;

      // 트랙 변경 후 재생해야 하면 canplay 이벤트 대기
      if (shouldPlayAfterTrackChange.current) {
        const onCanPlay = () => {
          if (audioRef.current && audioRef.current.src === currentTrack.url) {
            audioRef.current.play().catch(console.error);
            setIsPlaying(true);
            shouldPlayAfterTrackChange.current = false;
            audioElement.removeEventListener("canplay", onCanPlay);
          }
        };
        audioElement.addEventListener("canplay", onCanPlay);
        // 최대 3초 대기
        setTimeout(() => {
          audioElement.removeEventListener("canplay", onCanPlay);
        }, 3000);
      }

      return () => {
        // cleanup: audio element 제거 (트랙이 변경되거나 컴포넌트가 언마운트될 때만)
        if (audioRef.current && audioRef.current.parentNode) {
          try {
            // 현재 재생 중인 트랙이 아니면 제거
            if (audioRef.current.src !== currentTrack.url) {
              audioRef.current.pause();
              audioRef.current.src = "";
              audioRef.current.load();
              if (audioRef.current.parentNode) {
                audioRef.current.parentNode.removeChild(audioRef.current);
              }
              (
                audioRef as React.MutableRefObject<HTMLAudioElement | null>
              ).current = null;
            }
          } catch (e) {
            // 이미 제거되었을 수 있음
          }
        }
      };
    }

    // YouTube container 관리
    if (isYouTube) {
      // 기존 container가 있으면 재생성하지 않음
      const existingContainer = document.getElementById(
        youtubeContainerId.current
      );
      if (existingContainer) {
        return; // cleanup 함수 없이 반환 (기존 요소 유지)
      }

      // 새로운 container 생성
      const container = document.createElement("div");
      container.id = youtubeContainerId.current;
      container.className =
        "absolute w-px h-px overflow-hidden opacity-0 pointer-events-none";
      container.setAttribute("data-music-player-youtube", "true");
      document.body.appendChild(container);

      return () => {
        // cleanup: YouTube container 제거 (컴포넌트가 언마운트될 때만)
        const containerToRemove = document.getElementById(
          youtubeContainerId.current
        );
        if (containerToRemove && containerToRemove.parentNode) {
          try {
            // YouTube Player가 있으면 먼저 destroy
            if (youtubePlayerRef.current) {
              try {
                youtubePlayerRef.current.destroy();
              } catch (e) {
                // 무시
              }
              youtubePlayerRef.current = null;
            }
            containerToRemove.parentNode.removeChild(containerToRemove);
          } catch (e) {
            // 이미 제거되었을 수 있음
          }
        }
      };
    }
  }, [isYouTube, currentTrack?.url]); // currentTrack.url이 변경될 때만 재실행

  // 컴포넌트 언마운트 시 YouTube 플레이어 정리
  useEffect(() => {
    return () => {
      // 컴포넌트가 완전히 언마운트될 때만 플레이어 정리
      if (youtubePlayerRef.current) {
        try {
          const container = document.getElementById(youtubeContainerId.current);
          // 컨테이너가 여전히 존재하는 경우에만 destroy
          if (container && document.contains(container)) {
            youtubePlayerRef.current.destroy();
          }
        } catch (e) {
          // 에러 무시 (이미 제거되었을 수 있음)
        }
        youtubePlayerRef.current = null;
      }
    };
  }, []); // 마운트/언마운트 시에만 실행

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
      audio.volume = volumeRef.current;
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
      audio.volume = volumeRef.current;
      updateDuration();
    }

    return () => {
      clearInterval(timeInterval);
      // audio element가 여전히 존재하는지 확인
      if (audio && audioRef.current === audio) {
        try {
          audio.removeEventListener("timeupdate", handleTimeUpdate);
          audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
          audio.removeEventListener("ended", handleEnded);
        } catch (error) {
          // audio element가 이미 제거된 경우 에러 무시
          console.warn("Error removing audio event listeners:", error);
        }
      }
    };
  }, [currentTrackIndex, isYouTube]); // volume은 의존성에서 제거 (volumeRef 사용)

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
      // audio element가 여전히 존재하는지 확인
      if (audio && audioRef.current === audio) {
        try {
          audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        } catch (error) {
          // audio element가 이미 제거된 경우 에러 무시
          console.warn("Error removing audio event listener:", error);
        }
      }
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
              youtubePlayerRef.current.setVolume(volumeRef.current * 100);
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
          audioRef.current.volume = volumeRef.current;
        }
      }
    }
  }, [isYouTube]); // volume은 의존성에서 제거 (volumeRef 사용)

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

  // 트랙 변경 후 재생 처리 (shouldPlayAfterTrackChange가 true일 때)
  useEffect(() => {
    if (!shouldPlayAfterTrackChange.current || !currentTrack) return;

    if (isYouTube) {
      // YouTube 플레이어의 경우
      const tryPlay = () => {
        if (youtubePlayerRef.current) {
          try {
            if (
              typeof youtubePlayerRef.current.getPlayerState === "function" &&
              typeof youtubePlayerRef.current.playVideo === "function"
            ) {
              const playerState = youtubePlayerRef.current.getPlayerState();
              if (playerState !== undefined) {
                youtubePlayerRef.current.playVideo();
                setIsPlaying(true);
                shouldPlayAfterTrackChange.current = false;
              } else {
                setTimeout(tryPlay, 100);
              }
            }
          } catch (e) {
            setTimeout(tryPlay, 100);
          }
        } else {
          setTimeout(tryPlay, 100);
        }
      };
      const timer = setTimeout(tryPlay, 100);
      return () => clearTimeout(timer);
    } else {
      // Audio element의 경우
      if (audioRef.current) {
        const audio = audioRef.current;
        // URL이 일치하는지 확인
        const currentUrl = audio.src || audio.getAttribute("src") || "";
        if (
          currentUrl.includes(currentTrack.url) ||
          audio.src === currentTrack.url
        ) {
          if (audio.readyState >= 2) {
            // 이미 준비되어 있으면 즉시 재생
            audio.play().catch(console.error);
            setIsPlaying(true);
            shouldPlayAfterTrackChange.current = false;
          } else {
            // canplay 이벤트 대기
            const onCanPlay = () => {
              if (
                audioRef.current &&
                audioRef.current.src === currentTrack.url
              ) {
                audioRef.current.play().catch(console.error);
                setIsPlaying(true);
                shouldPlayAfterTrackChange.current = false;
                audio.removeEventListener("canplay", onCanPlay);
              }
            };
            audio.addEventListener("canplay", onCanPlay);
            // 최대 3초 대기
            const timeout = setTimeout(() => {
              audio.removeEventListener("canplay", onCanPlay);
            }, 3000);
            return () => {
              audio.removeEventListener("canplay", onCanPlay);
              clearTimeout(timeout);
            };
          }
        } else {
          // URL이 일치하지 않으면 잠시 후 재시도 (audio element가 아직 생성 중일 수 있음)
          const timer = setTimeout(() => {
            if (audioRef.current && audioRef.current.src === currentTrack.url) {
              if (audioRef.current.readyState >= 2) {
                audioRef.current.play().catch(console.error);
                setIsPlaying(true);
                shouldPlayAfterTrackChange.current = false;
              }
            }
          }, 200);
          return () => clearTimeout(timer);
        }
      } else {
        // audio element가 아직 없으면 잠시 후 재시도
        const timer = setTimeout(() => {
          if (audioRef.current && audioRef.current.src === currentTrack.url) {
            if (audioRef.current.readyState >= 2) {
              audioRef.current.play().catch(console.error);
              setIsPlaying(true);
              shouldPlayAfterTrackChange.current = false;
            }
          }
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentTrackIndex, currentTrack, isYouTube]);

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

    // volumeRef를 먼저 업데이트하여 다른 로직이 최신 값을 사용하도록 함
    volumeRef.current = newVolume;

    // 즉시 플레이어에 볼륨 적용 (리렌더링 전에)
    if (isYouTube) {
      if (youtubePlayerRef.current) {
        try {
          if (
            typeof youtubePlayerRef.current.getPlayerState === "function" &&
            typeof youtubePlayerRef.current.setVolume === "function"
          ) {
            const playerState = youtubePlayerRef.current.getPlayerState();
            if (playerState !== undefined) {
              youtubePlayerRef.current.setVolume(newVolume * 100);
            }
          }
        } catch (e) {
          // 플레이어가 아직 준비되지 않았을 수 있음
        }
      }
    } else {
      if (audioRef.current) {
        // 오디오가 로드되어 있으면 즉시 볼륨 적용
        if (audioRef.current.readyState >= 1) {
          audioRef.current.volume = newVolume;
        }
      }
    }

    // UI 업데이트를 위한 state 변경 (리렌더링 발생)
    setVolume(newVolume);
    setCookie("musicPlayerVolume", newVolume.toString());
  };

  const handleTrackSelect = (index: number) => {
    if (index < 0 || index >= playlist.length) return;
    const wasPlaying = isPlaying;
    // 재생 상태를 ref에 저장
    shouldPlayAfterTrackChange.current = wasPlaying;
    changeTrack(index);
    // setIsPlaying은 useEffect에서 처리
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
      {/* audio element와 YouTube container는 useEffect에서 직접 DOM에 추가/제거 */}
      {/* React의 제어를 완전히 벗어나도록 함으로써 removeChild 에러 방지 */}

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
            style={{
              transform:
                swipeOffset > 0 ? `translateY(${swipeOffset}px)` : undefined,
              transition:
                swipeOffset === 0 ? "transform 0.2s ease-out" : "none",
              opacity:
                swipeOffset > 0
                  ? Math.max(0.5, 1 - swipeOffset / SWIPE_OPACITY_THRESHOLD)
                  : 1,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* Swipe down indicator for mobile - touch handlers here */}
            <div
              data-swipe-indicator
              className="md:hidden flex justify-center items-center py-4 -mx-3 -mt-3 mb-1 cursor-grab active:cursor-grabbing min-h-[48px]"
              style={{ touchAction: "none" }}
            >
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
                className={`bg-transparent border rounded-full w-10 h-10 p-0 cursor-pointer flex items-center justify-center mx-auto transition-all duration-200 ${
                  showPlaylist
                    ? "border-brand-green text-brand-green bg-dark-gray"
                    : "border-dark-border-subtle text-dark-muted hover:bg-dark-gray hover:border-brand-green hover:text-brand-green"
                }`}
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
