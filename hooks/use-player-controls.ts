import { useEffect, useRef, RefObject, MutableRefObject, ChangeEvent } from "react";
import { setCookie } from "../lib/utils/cookies";

interface UsePlayerControlsOptions {
  isYouTube: boolean;
  isPlaying: boolean;
  duration: number;
  volume: number;
  volumeRef: MutableRefObject<number>;
  shouldPlayAfterTrackChange: MutableRefObject<boolean>;
  youtubePlayer: {
    seekTo: (time: number) => void;
    setVolume: (volume: number) => void;
    playVideo: () => void;
    pauseVideo: () => void;
  } | null;
  audioPlayer: {
    seekTo: (time: number) => void;
    setVolume: (volume: number) => void;
    play: () => Promise<void>;
    pause: () => void;
  } | null;
  onTimeUpdate: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
}

interface UsePlayerControlsReturn {
  handlePlayPause: () => void;
  handleSeek: (e: ChangeEvent<HTMLInputElement>) => void;
  handleVolumeChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function usePlayerControls({
  isYouTube,
  isPlaying,
  duration,
  volume,
  volumeRef,
  shouldPlayAfterTrackChange,
  youtubePlayer,
  audioPlayer,
  onTimeUpdate,
  onVolumeChange,
  onPlayingChange,
}: UsePlayerControlsOptions): UsePlayerControlsReturn {
  useEffect(() => {
    if (shouldPlayAfterTrackChange.current) return;

    if (isYouTube) {
      if (youtubePlayer) {
        if (isPlaying) {
          youtubePlayer.playVideo();
        } else {
          youtubePlayer.pauseVideo();
        }
      }
    } else {
      if (audioPlayer) {
        if (isPlaying) {
          audioPlayer.play().catch(console.error);
        } else {
          audioPlayer.pause();
        }
      }
    }
  }, [isPlaying, isYouTube, youtubePlayer, audioPlayer, shouldPlayAfterTrackChange]);

  const handlePlayPause = () => {
    const newPlayingState = !isPlaying;
    onPlayingChange(newPlayingState);
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;

    if (isYouTube) {
      if (youtubePlayer) {
        youtubePlayer.seekTo(newTime);
      }
    } else {
      if (audioPlayer) {
        audioPlayer.seekTo(newTime);
      }
    }
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);

    volumeRef.current = newVolume;

    if (isYouTube) {
      if (youtubePlayer) {
        youtubePlayer.setVolume(newVolume);
      }
    } else {
      if (audioPlayer) {
        audioPlayer.setVolume(newVolume);
      }
    }

    onVolumeChange(newVolume);
    setCookie("musicPlayerVolume", newVolume.toString());
  };

  return {
    handlePlayPause,
    handleSeek,
    handleVolumeChange,
  };
}

