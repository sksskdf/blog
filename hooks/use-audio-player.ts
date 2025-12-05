import { useEffect, useRef, RefObject, MutableRefObject } from "react";
import { compareUrls } from "../lib/utils/url";

interface UseAudioPlayerOptions {
  isYouTube: boolean;
  currentTrack: { id?: number; url: string } | null;
  currentTrackIndex: number;
  volume: number;
  volumeRef: MutableRefObject<number>;
  shouldPlayAfterTrackChange: MutableRefObject<boolean>;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onDurationSave: (trackId: number | string, duration: number) => void;
  onEnded: () => void;
  onPlayingChange: (isPlaying: boolean) => void;
}

interface UseAudioPlayerReturn {
  audioRef: RefObject<HTMLAudioElement | null>;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  play: () => Promise<void>;
  pause: () => void;
}

const TIME_UPDATE_INTERVAL = 100;
const CANPLAY_TIMEOUT = 3000;

export function useAudioPlayer({
  isYouTube,
  currentTrack,
  currentTrackIndex,
  volume,
  volumeRef,
  shouldPlayAfterTrackChange,
  onTimeUpdate,
  onDurationChange,
  onDurationSave,
  onEnded,
  onPlayingChange,
}: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handleNextRef = useRef<() => void>(() => {});
  useEffect(() => {
    handleNextRef.current = onEnded;
  }, [onEnded]);
  useEffect(() => {
    if (typeof document === "undefined" || !currentTrack || isYouTube) return;
    const existingAudio = document.querySelector(
      '[data-music-player-audio="true"]'
    ) as HTMLAudioElement | null;

    if (existingAudio && compareUrls(existingAudio.src, currentTrack.url)) {

      audioRef.current = existingAudio;
      return; // cleanup 함수 없이 반환 (기존 요소 유지)
    }
    if (existingAudio && existingAudio.parentNode) {
      try {
        existingAudio.pause();
        existingAudio.src = "";
        existingAudio.load();
        existingAudio.parentNode.removeChild(existingAudio);
      } catch (e) {

      }
    }
    const audioElement = document.createElement("audio");
    audioElement.src = currentTrack.url;
    audioElement.preload = "metadata";
    audioElement.setAttribute("data-music-player-audio", "true");
    document.body.appendChild(audioElement);
    audioRef.current = audioElement;
    if (shouldPlayAfterTrackChange.current) {
      const onCanPlay = () => {
        if (audioRef.current && compareUrls(audioRef.current.src, currentTrack.url)) {
          audioRef.current.play().catch(() => {});
          onPlayingChange(true);
          shouldPlayAfterTrackChange.current = false;
          audioElement.removeEventListener("canplay", onCanPlay);
        }
      };
      audioElement.addEventListener("canplay", onCanPlay);

      setTimeout(() => {
        audioElement.removeEventListener("canplay", onCanPlay);
      }, CANPLAY_TIMEOUT);
    }

    return () => {

      if (audioRef.current && audioRef.current.parentNode) {
        try {

          if (!compareUrls(audioRef.current.src, currentTrack.url)) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current.load();
            if (audioRef.current.parentNode) {
              audioRef.current.parentNode.removeChild(audioRef.current);
            }
            audioRef.current = null;
          }
        } catch (e) {

        }
      }
    };
  }, [isYouTube, currentTrack, shouldPlayAfterTrackChange, onPlayingChange]);
  useEffect(() => {
    if (isYouTube) return; // YouTube는 별도 처리

    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!audio.paused) {
        onTimeUpdate(audio.currentTime);
      }
    };
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        onDurationChange(audio.duration);
      }
    };
    const handleEnded = () => {

      handleNextRef.current();
    };
    const handleLoadedMetadata = () => {
      if (volumeRef.current !== null && volumeRef.current !== undefined) {
        audio.volume = volumeRef.current;
      }
      updateDuration();
    };
    const handleTimeUpdate = () => {
      onTimeUpdate(audio.currentTime);
    };

    let animationFrameId: number | null = null;
    let lastUpdateTime = 0;
    const minUpdateInterval = TIME_UPDATE_INTERVAL; // 최소 업데이트 간격 (ms)

    const updateTimeWithRAF = (timestamp: number) => {
      if (timestamp - lastUpdateTime >= minUpdateInterval) {
        if (!audio.paused && audio.currentTime > 0) {
          onTimeUpdate(audio.currentTime);
        }
        lastUpdateTime = timestamp;
      }
      if (audio && audioRef.current === audio) {
        animationFrameId = requestAnimationFrame(updateTimeWithRAF);
      }
    };
    animationFrameId = requestAnimationFrame(updateTimeWithRAF);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    if (audio.readyState >= 1) {
      if (volumeRef.current !== null && volumeRef.current !== undefined) {
        audio.volume = volumeRef.current;
      }
      updateDuration();
    }

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      if (audio && audioRef.current === audio) {
        try {
          audio.removeEventListener("timeupdate", handleTimeUpdate);
          audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
          audio.removeEventListener("ended", handleEnded);
        } catch (error) {

          // Error removing audio event listeners
        }
      }
    };
  }, [
    currentTrackIndex,
    isYouTube,
    volumeRef,
    onTimeUpdate,
    onDurationChange,
  ]);
  useEffect(() => {
    if (isYouTube || !audioRef.current || !currentTrack) return;

    const audio = audioRef.current;
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        onDurationSave(
          currentTrack.id || currentTrackIndex,
          audio.duration
        );
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {

      if (audio && audioRef.current === audio) {
        try {
          audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        } catch (error) {

          // Error removing audio event listener
        }
      }
    };
  }, [currentTrackIndex, isYouTube, currentTrack, onDurationSave]);
  useEffect(() => {
    if (isYouTube || !audioRef.current) return;
    if (audioRef.current.readyState >= 1 && volumeRef.current !== null && volumeRef.current !== undefined) {
      audioRef.current.volume = volumeRef.current;
    }
  }, [isYouTube, volumeRef]);
  useEffect(() => {
    if (isYouTube || !audioRef.current) return;

    const audio = audioRef.current;
  }, [isYouTube]);

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      onTimeUpdate(time);
    }
  };

  const setVolume = (newVolume: number) => {
    if (audioRef.current) {

      if (audioRef.current.readyState >= 1) {
        audioRef.current.volume = newVolume;
      }
    }
  };

  const play = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        onPlayingChange(true);
      } catch (error) {
        // Error playing audio
      }
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      onPlayingChange(false);
    }
  };

  return {
    audioRef,
    seekTo,
    setVolume,
    play,
    pause,
  };
}

