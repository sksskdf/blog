import { useState, useEffect, useRef, useCallback, MutableRefObject } from "react";
import { Playlist } from "../types";
import { compareUrls } from "../lib/utils/url";

interface UseTrackNavigationOptions {
  playlist: Playlist[];
  externalCurrentTrack: Playlist | null;
  isPlaying: boolean;
  isYouTube: boolean;
  shouldPlayAfterTrackChange: MutableRefObject<boolean>;
  youtubePlayerRef: MutableRefObject<{
    playVideo: () => void;
  } | null>;
  audioPlayerRef: MutableRefObject<{
    play: () => Promise<void>;
  } | null>;
  onTrackChange?: (track: Playlist) => void;
  onPlayingChange: (isPlaying: boolean) => void;
  onTimeReset: () => void;
}

interface UseTrackNavigationReturn {
  currentTrackIndex: number;
  currentTrack: Playlist | null;
  changeTrack: (newIndex: number) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleTrackSelect: (index: number) => void;
}

const RETRY_DELAY = 200;
const MAX_RETRIES = 5;
const CANPLAY_TIMEOUT = 3000;

export function useTrackNavigation({
  playlist,
  externalCurrentTrack,
  isPlaying,
  isYouTube,
  shouldPlayAfterTrackChange,
  youtubePlayerRef,
  audioPlayerRef,
  onTrackChange,
  onPlayingChange,
  onTimeReset,
}: UseTrackNavigationOptions): UseTrackNavigationReturn {
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);

  useEffect(() => {
    if (externalCurrentTrack) {
      const index = playlist.findIndex(
        (track) =>
          track.id === externalCurrentTrack.id ||
          compareUrls(track.url, externalCurrentTrack.url)
      );
      if (index !== -1) {
        setCurrentTrackIndex(index);
      }
    }
  }, [externalCurrentTrack, playlist]);

  const currentTrack =
    externalCurrentTrack || playlist[currentTrackIndex] || null;

  const changeTrack = useCallback(
    (newIndex: number) => {
      setCurrentTrackIndex(newIndex);
      onTimeReset();
      const newTrack = playlist[newIndex];
      if (newTrack && onTrackChange) {
        onTrackChange(newTrack);
      }
    },
    [playlist, onTrackChange, onTimeReset]
  );

  const handleNext = useCallback(() => {
    if (playlist.length > 0) {
      const wasPlaying = isPlaying;
      const nextIndex = (currentTrackIndex + 1) % playlist.length;
      shouldPlayAfterTrackChange.current = wasPlaying;
      changeTrack(nextIndex);
    }
  }, [
    playlist.length,
    currentTrackIndex,
    isPlaying,
    changeTrack,
    shouldPlayAfterTrackChange,
  ]);

  const handlePrevious = useCallback(() => {
    if (playlist.length > 0) {
      const wasPlaying = isPlaying;
      const prevIndex =
        (currentTrackIndex - 1 + playlist.length) % playlist.length;
      shouldPlayAfterTrackChange.current = wasPlaying;
      changeTrack(prevIndex);
    }
  }, [
    playlist.length,
    currentTrackIndex,
    isPlaying,
    changeTrack,
    shouldPlayAfterTrackChange,
  ]);

  const handleTrackSelect = useCallback(
    (index: number) => {
      if (index < 0 || index >= playlist.length) return;
      const wasPlaying = isPlaying;
      shouldPlayAfterTrackChange.current = wasPlaying;
      changeTrack(index);
    },
    [playlist.length, isPlaying, changeTrack, shouldPlayAfterTrackChange]
  );

  // 트랙 변경 후 재생 처리 (shouldPlayAfterTrackChange가 true일 때)
  useEffect(() => {
    if (!shouldPlayAfterTrackChange.current || !currentTrack) return;

    if (isYouTube) {
      const youtubePlayer = youtubePlayerRef.current;
      if (youtubePlayer) {
        const tryPlay = () => {
          try {
            youtubePlayer.playVideo();
            onPlayingChange(true);
            shouldPlayAfterTrackChange.current = false;
          } catch (e) {
            setTimeout(tryPlay, RETRY_DELAY);
          }
        };
        const timer = setTimeout(tryPlay, RETRY_DELAY);
        return () => clearTimeout(timer);
      }
    } else {
      const audioPlayer = audioPlayerRef.current;
      if (audioPlayer) {
        const tryPlay = async () => {
          try {
            await audioPlayer.play();
            onPlayingChange(true);
            shouldPlayAfterTrackChange.current = false;
          } catch (e) {
            setTimeout(tryPlay, RETRY_DELAY);
          }
        };
        const timer = setTimeout(tryPlay, RETRY_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [
    currentTrackIndex,
    currentTrack,
    isYouTube,
    shouldPlayAfterTrackChange,
    onPlayingChange,
  ]);

  return {
    currentTrackIndex,
    currentTrack,
    changeTrack,
    handleNext,
    handlePrevious,
    handleTrackSelect,
  };
}

