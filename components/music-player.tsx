import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Playlist } from "../types";
import { getYouTubeVideoId, isYouTubeUrl } from "../lib/utils/youtube";
import { getCookie } from "../lib/utils/cookies";
import { formatTime } from "../lib/utils/time";
import { useSwipeGesture } from "../hooks/use-swipe-gesture";
import { useYouTubePlayer } from "../hooks/use-youtube-player";
import { useAudioPlayer } from "../hooks/use-audio-player";
import { usePlayerControls } from "../hooks/use-player-controls";
import { useTrackNavigation } from "../hooks/use-track-navigation";
import styles from "./music-player.module.css";

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
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isYouTube, setIsYouTube] = useState<boolean>(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
  const [trackDurations, setTrackDurations] = useState<
    Record<number | string, number>
  >({});
  const [autoPlayTriggered, setAutoPlayTriggered] = useState<boolean>(false);
  const [userPaused, setUserPaused] = useState<boolean>(false);
  const playlistContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const shouldPlayAfterTrackChange = useRef<boolean>(false);

  const volumeRef = useRef<number>(volume);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    const savedVolume = getCookie("musicPlayerVolume");
    if (savedVolume) {
      const volumeValue = parseFloat(savedVolume);
      if (!isNaN(volumeValue) && volumeValue >= 0 && volumeValue <= 1) {
        setVolume(volumeValue);
      }
    }
  }, []);

  useEffect(() => {
    const currentTrack =
      externalCurrentTrack || playlist[0] || null;
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
  }, [externalCurrentTrack, playlist]);

  const handleNextRef = useRef<() => void>(() => {});
  const youtubePlayerRef = useRef<{
    playVideo: () => void;
  } | null>(null);
  const audioPlayerRef = useRef<{
    play: () => Promise<void>;
  } | null>(null);

  const onPlayingChangeCallback = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const onTimeResetCallback = useCallback(() => {
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const navigation = useTrackNavigation({
    playlist,
    externalCurrentTrack,
    isPlaying,
    isYouTube,
    shouldPlayAfterTrackChange,
    youtubePlayerRef,
    audioPlayerRef,
    onTrackChange,
    onPlayingChange: onPlayingChangeCallback,
    onTimeReset: onTimeResetCallback,
  });

  useEffect(() => {
    handleNextRef.current = navigation.handleNext;
  }, [navigation.handleNext]);

  const youtubePlayer = useYouTubePlayer({
    isYouTube,
    youtubeVideoId,
    isPlaying,
    volume,
    volumeRef,
    currentTrack: navigation.currentTrack,
    currentTrackIndex: navigation.currentTrackIndex,
    onDurationChange: (dur) => setDuration(dur),
    onTimeUpdate: (time) => setCurrentTime(time),
    onDurationSave: (trackId, dur) => {
      setTrackDurations((prev) => ({ ...prev, [trackId]: dur }));
    },
    onStateChange: (playing) => setIsPlaying(playing),
    onEnded: () => {
      handleNextRef.current();
    },
  });

  const audioPlayer = useAudioPlayer({
    isYouTube,
    currentTrack: navigation.currentTrack,
    currentTrackIndex: navigation.currentTrackIndex,
    volume,
    volumeRef,
    shouldPlayAfterTrackChange,
    onTimeUpdate: (time) => setCurrentTime(time),
    onDurationChange: (dur) => setDuration(dur),
    onDurationSave: (trackId, dur) => {
      setTrackDurations((prev) => ({ ...prev, [trackId]: dur }));
    },
    onEnded: () => {
      handleNextRef.current();
    },
    onPlayingChange: (playing) => setIsPlaying(playing),
  });

  // player ref 업데이트
  useEffect(() => {
    youtubePlayerRef.current = isYouTube && youtubePlayer ? {
      playVideo: youtubePlayer.playVideo,
    } : null;
  }, [isYouTube, youtubePlayer?.playVideo]);

  useEffect(() => {
    audioPlayerRef.current = !isYouTube && audioPlayer ? {
      play: audioPlayer.play,
    } : null;
  }, [isYouTube, audioPlayer?.play]);

  const controls = usePlayerControls({
    isYouTube,
    isPlaying,
    duration,
    volume,
    volumeRef,
    shouldPlayAfterTrackChange,
    youtubePlayer: isYouTube && youtubePlayer ? {
      seekTo: youtubePlayer.seekTo,
      setVolume: youtubePlayer.setVolume,
      playVideo: youtubePlayer.playVideo,
      pauseVideo: youtubePlayer.pauseVideo,
    } : null,
    audioPlayer: !isYouTube && audioPlayer ? {
      seekTo: audioPlayer.seekTo,
      setVolume: audioPlayer.setVolume,
      play: audioPlayer.play,
      pause: audioPlayer.pause,
    } : null,
    onTimeUpdate: (time) => setCurrentTime(time),
    onVolumeChange: (vol) => setVolume(vol),
    onPlayingChange: (playing) => {
      setIsPlaying(playing);
      if (!playing) {
        setUserPaused(true);
      } else {
        setUserPaused(false);
      }
    },
  });

  const swipe = useSwipeGesture({
    isOpen,
    onClose,
    playerRef,
  });

  useEffect(() => {
    if (
      autoPlay &&
      navigation.currentTrack &&
      !isPlaying &&
      !autoPlayTriggered &&
      !userPaused
    ) {
      const timer = setTimeout(() => {
        setIsPlaying(true);
        setAutoPlayTriggered(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, navigation.currentTrack, isPlaying, autoPlayTriggered, userPaused]);

  useEffect(() => {
    setAutoPlayTriggered(false);
    setUserPaused(false);
  }, [navigation.currentTrackIndex]);

  useEffect(() => {
    if (showPlaylist && playlistContainerRef.current) {
      try {
        playlistContainerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      } catch {
      }
    }
  }, [showPlaylist]);

  useEffect(() => {
    if (onTrackChange && navigation.currentTrack) {
      onTrackChange(navigation.currentTrack);
    }
  }, [navigation.currentTrackIndex, navigation.currentTrack, onTrackChange]);

  const getTrackDuration = (track: Playlist): number | null => {
    const trackId = track.id || playlist.indexOf(track);
    return trackDurations[trackId] || track.duration || null;
  };

  if (!navigation.currentTrack) return null;

  return (
    <>
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
              transform: swipe.swipeTransform,
              transition: swipe.swipeTransition,
              opacity: swipe.swipeOpacity,
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div
              data-swipe-indicator
              className="md:hidden flex justify-center items-center py-4 -mx-3 -mt-3 mb-1 cursor-grab active:cursor-grabbing min-h-[48px]"
              style={{ touchAction: "none" }}
            >
              <div className="w-10 h-1 bg-dark-border-subtle rounded-full"></div>
            </div>
            {navigation.currentTrack.cover && (
              <div className="w-full flex justify-center mb-4 relative">
                <img
                  src={navigation.currentTrack.cover}
                  alt={`${navigation.currentTrack.title} cover`}
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
            {!navigation.currentTrack.cover && (
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
                {navigation.currentTrack.title}
              </div>
              <div className="text-sm text-dark-muted">
                {navigation.currentTrack.artist || "Unknown Artist"}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={controls.handleSeek}
                className={styles.progressBar}
              />
              <div className="flex justify-between text-xs text-dark-muted font-mono">
                <span>{duration > 0 ? formatTime(currentTime) : "--:--"}</span>
                <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
              </div>
            </div>

            <div className="flex justify-center items-center gap-4">
              <button
                onClick={navigation.handlePrevious}
                className="bg-transparent border border-dark-border-subtle rounded-full w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-dark-gray hover:border-brand-green hover:text-brand-green text-dark-text disabled:opacity-50 disabled:cursor-not-allowed p-0"
                disabled={playlist.length <= 1}
                aria-label="이전 트랙"
              >
                <span className="material-icons text-2xl flex items-center justify-center leading-none">
                  skip_previous
                </span>
              </button>
              <button
                onClick={controls.handlePlayPause}
                className="w-14 h-14 bg-brand-green text-dark-card border-none rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-brand-accent p-0"
                aria-label={isPlaying ? "일시정지" : "재생"}
              >
                <span className="material-icons text-3xl flex items-center justify-center leading-none">
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>
              <button
                onClick={navigation.handleNext}
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
                onChange={controls.handleVolumeChange}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                onTouchMove={(e) => {
                  e.stopPropagation();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                }}
                className={styles.volumeBar}
                style={{ touchAction: "pan-x" }}
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
                    : `플레이리스트 보기 (${navigation.currentTrackIndex + 1} / ${
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
                    const isCurrentTrack = index === navigation.currentTrackIndex;

                    return (
                      <div
                        key={track.id || index}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all duration-200 border border-transparent ${
                          isCurrentTrack
                            ? "bg-brand-green/10 border-brand-green"
                            : "hover:bg-dark-gray hover:border-dark-border"
                        }`}
                        onClick={() => navigation.handleTrackSelect(index)}
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
