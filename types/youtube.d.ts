declare global {
  interface Window {
    YT: {
      Player: new (elementId: string | HTMLElement, config: {
        videoId: string;
        playerVars?: {
          autoplay?: number;
          controls?: number;
          disablekb?: number;
          enablejsapi?: number;
          fs?: number;
          iv_load_policy?: number;
          modestbranding?: number;
          playsinline?: number;
          rel?: number;
          origin?: string;
        };
        events?: {
          onReady?: (event: { target: YT.Player }) => void;
          onStateChange?: (event: { data: number; target: YT.Player }) => void;
          onError?: (event: { data: number }) => void;
        };
      }) => YT.Player;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }

  namespace YT {
    interface Player {
      playVideo(): void;
      pauseVideo(): void;
      stopVideo(): void;
      seekTo(seconds: number, allowSeekAhead: boolean): void;
      getCurrentTime(): number;
      getDuration(): number;
      getVolume(): number;
      setVolume(volume: number): void;
      getPlayerState(): number;
      destroy(): void;
    }
  }
}

export {};

