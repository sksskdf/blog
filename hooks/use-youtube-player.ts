import { useEffect, useRef, RefObject, MutableRefObject } from "react";

interface UseYouTubePlayerOptions {
  isYouTube: boolean;
  youtubeVideoId: string | null;
  isPlaying: boolean;
  volume: number;
  volumeRef: MutableRefObject<number>;
  currentTrack: { id?: number; url: string } | null;
  currentTrackIndex: number;
  onDurationChange: (duration: number) => void;
  onTimeUpdate: (time: number) => void;
  onDurationSave: (trackId: number | string, duration: number) => void;
  onStateChange: (isPlaying: boolean) => void;
  onEnded: () => void;
}

interface UseYouTubePlayerReturn {
  youtubePlayerRef: RefObject<YT.Player | null>;
  youtubeContainerId: RefObject<string>;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
}

const INIT_DELAY = 100;
const RETRY_DELAY = 200;
const MAX_RETRIES = 10;
const TIME_UPDATE_INTERVAL = 1000;

export function useYouTubePlayer({
  isYouTube,
  youtubeVideoId,
  isPlaying,
  volume,
  volumeRef,
  currentTrack,
  currentTrackIndex,
  onDurationChange,
  onTimeUpdate,
  onDurationSave,
  onStateChange,
  onEnded,
}: UseYouTubePlayerOptions): UseYouTubePlayerReturn {
  const youtubePlayerRef = useRef<YT.Player | null>(null);
  const youtubeContainerId = useRef<string>(
    `youtube-player-${Date.now()}-${Math.random()}`
  );
  const handleNextRef = useRef<() => void>(() => {});
  useEffect(() => {
    handleNextRef.current = onEnded;
  }, [onEnded]);
  useEffect(() => {
    if (!isYouTube || !youtubeVideoId) return;
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

    const loadYouTubeAPI = () => {

      if (!document.getElementById(youtubeContainerId.current)) {
        return;
      }

      if (window.YT && window.YT.Player) {

        setTimeout(() => {

          if (document.getElementById(youtubeContainerId.current)) {
            initializeYouTubePlayer();
          }
        }, INIT_DELAY);
      } else {

        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const tag = document.createElement("script");
          tag.src = "https://www.youtube.com/iframe_api";
          const firstScriptTag = document.getElementsByTagName("script")[0];
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }
        const originalCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (originalCallback) originalCallback();
          setTimeout(() => {

            if (
              !playerInitialized &&
              document.getElementById(youtubeContainerId.current)
            ) {
              initializeYouTubePlayer();
            }
          }, INIT_DELAY);
        };
      }
    };

    const initializeYouTubePlayer = () => {
      if (playerInitialized) return;
      const checkContainer = () => {
        const container = document.getElementById(youtubeContainerId.current);
        if (!container || !document.contains(container)) {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(checkContainer, RETRY_DELAY);
            return;
          } else {

            console.warn("YouTube container not found after retries");
            return;
          }
        }

        try {

          if (!document.contains(container)) {
            console.warn("YouTube container no longer in DOM");
            return;
          }
          if (youtubePlayerRef.current) {
            try {
              youtubePlayerRef.current.destroy();
              youtubePlayerRef.current = null;
            } catch (e) {

              youtubePlayerRef.current = null;
            }
          }
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
                  onDurationChange(duration);

                  event.target.setVolume(volumeRef.current * 100);
                  playerInitialized = true;
                } catch (e) {
                  console.error("Error getting YouTube duration:", e);
                }
              },
              onStateChange: (event) => {
                try {
                  if (event.data === window.YT.PlayerState.ENDED) {

                    handleNextRef.current();
                  } else if (event.data === window.YT.PlayerState.PLAYING) {
                    onStateChange(true);
                  } else if (event.data === window.YT.PlayerState.PAUSED) {
                    onStateChange(false);
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
    const timer = setTimeout(() => {
      loadYouTubeAPI();
    }, INIT_DELAY);

    return () => {
      clearTimeout(timer);
      playerInitialized = false;
      retryCount = 0;
    };
  }, [isYouTube, youtubeVideoId, isPlaying, volumeRef]);
  useEffect(() => {
    if (typeof document === "undefined" || !isYouTube) return;
    const existingContainer = document.getElementById(
      youtubeContainerId.current
    );
    if (existingContainer) {
      return; // cleanup 함수 없이 반환 (기존 요소 유지)
    }
    const container = document.createElement("div");
    container.id = youtubeContainerId.current;
    container.className =
      "absolute w-px h-px overflow-hidden opacity-0 pointer-events-none";
    container.setAttribute("data-music-player-youtube", "true");
    document.body.appendChild(container);

    return () => {

      const containerToRemove = document.getElementById(
        youtubeContainerId.current
      );
      if (containerToRemove && containerToRemove.parentNode) {
        try {

          if (youtubePlayerRef.current) {
            try {
              youtubePlayerRef.current.destroy();
            } catch (e) {

            }
            youtubePlayerRef.current = null;
          }
          containerToRemove.parentNode.removeChild(containerToRemove);
        } catch (e) {

        }
      }
    };
  }, [isYouTube]);
  useEffect(() => {
    return () => {

      if (youtubePlayerRef.current) {
        try {
          const container = document.getElementById(youtubeContainerId.current);

          if (container && document.contains(container)) {
            youtubePlayerRef.current.destroy();
          }
        } catch (e) {

        }
        youtubePlayerRef.current = null;
      }
    };
  }, []);
  useEffect(() => {
    if (!isYouTube || !youtubePlayerRef.current) return;

    let animationFrameId: number | null = null;
    let lastUpdateTime = 0;
    const minUpdateInterval = TIME_UPDATE_INTERVAL; // 최소 업데이트 간격 (ms)

    const updateTime = (timestamp: number) => {
      if (timestamp - lastUpdateTime >= minUpdateInterval) {
        try {
          if (
            typeof youtubePlayerRef.current?.getCurrentTime === "function" &&
            typeof youtubePlayerRef.current?.getDuration === "function"
          ) {
            const currentTimeValue = youtubePlayerRef.current.getCurrentTime();
            const duration = youtubePlayerRef.current.getDuration();
            onTimeUpdate(currentTimeValue || 0);
            onDurationChange(duration || 0);
            if (duration && currentTrack) {
              onDurationSave(
                currentTrack.id || currentTrackIndex,
                duration
              );
            }
          }
        } catch (e) {

        }
        lastUpdateTime = timestamp;
      }
      animationFrameId = requestAnimationFrame(updateTime);
    };
    animationFrameId = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    isYouTube,
    currentTrack,
    currentTrackIndex,
    onTimeUpdate,
    onDurationChange,
    onDurationSave,
  ]);
  useEffect(() => {
    if (!isYouTube || !youtubePlayerRef.current) return;

    try {

      if (
        typeof youtubePlayerRef.current.getPlayerState === "function" &&
        typeof youtubePlayerRef.current.setVolume === "function"
      ) {
        const playerState = youtubePlayerRef.current.getPlayerState();

        if (playerState !== undefined) {
          youtubePlayerRef.current.setVolume(volumeRef.current * 100);
        }
      }
    } catch (e) {

    }
  }, [isYouTube, volumeRef]);
  useEffect(() => {
    if (!isYouTube || !youtubePlayerRef.current) return;

    try {

      if (
        typeof youtubePlayerRef.current.getPlayerState !== "function" ||
        !window.YT ||
        !window.YT.PlayerState
      ) {

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
        }, INIT_DELAY);
        return;
      }
      const playerState = youtubePlayerRef.current.getPlayerState();
      if (
        playerState === window.YT.PlayerState.UNSTARTED ||
        playerState === window.YT.PlayerState.CUED
      ) {

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
        }, INIT_DELAY);
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
  }, [isPlaying, isYouTube]);

  const seekTo = (time: number) => {
    if (!youtubePlayerRef.current) return;
    try {
      if (typeof youtubePlayerRef.current.seekTo === "function") {
        youtubePlayerRef.current.seekTo(time, true);
        onTimeUpdate(time);
      }
    } catch (e) {
      console.error("Error seeking YouTube video:", e);
    }
  };

  const setVolume = (newVolume: number) => {
    if (!youtubePlayerRef.current) return;
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

    }
  };

  const playVideo = () => {
    if (!youtubePlayerRef.current) return;
    try {
      if (typeof youtubePlayerRef.current.playVideo === "function") {
        youtubePlayerRef.current.playVideo();
      }
    } catch (e) {
      console.error("Error playing YouTube video:", e);
    }
  };

  const pauseVideo = () => {
    if (!youtubePlayerRef.current) return;
    try {
      if (typeof youtubePlayerRef.current.pauseVideo === "function") {
        youtubePlayerRef.current.pauseVideo();
      }
    } catch (e) {
      console.error("Error pausing YouTube video:", e);
    }
  };

  return {
    youtubePlayerRef,
    youtubeContainerId,
    seekTo,
    setVolume,
    playVideo,
    pauseVideo,
  };
}

