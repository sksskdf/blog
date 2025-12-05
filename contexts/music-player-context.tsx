"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

import { Playlist } from "../types";

interface MusicPlayerContextType {
  isPlayerOpen: boolean;
  setIsPlayerOpen: (open: boolean) => void;
  playlist: Playlist[];
  currentTrack: Playlist | null;
  setCurrentTrack: (track: Playlist | null) => void;
  shouldAutoplay: boolean;
  setShouldAutoplay: (autoplay: boolean) => void;
  showToast: boolean;
  setShowToast: (show: boolean) => void;
  isLoading: boolean;
  togglePlayer: () => void;
  handleTrackChange: (track: Playlist) => void;
  handleAutoplayAccept: () => void;
  handleAutoplayDecline: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
  undefined
);

interface MusicPlayerProviderProps {
  children: ReactNode;
}

export function MusicPlayerProvider({ children }: MusicPlayerProviderProps) {
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const [playlist, setPlaylist] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTrack, setCurrentTrack] = useState<Playlist | null>(null);
  const [shouldAutoplay, setShouldAutoplay] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  useEffect(() => {
    if (playlist.length > 0) return;

    const loadPlaylist = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/playlists");
        if (response.ok) {
          const data = (await response.json()) as Playlist[];
          if (Array.isArray(data) && data.length > 0) {
            setPlaylist(data);
            if (!currentTrack) {
              setCurrentTrack(data[0]);
            }
          }
        }
      } catch (error) {
        // Failed to load playlist
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylist();
  }, [currentTrack, playlist.length]);

  const togglePlayer = useCallback(() => {
    setIsPlayerOpen((prev) => !prev);
  }, []);

  const handleTrackChange = useCallback((track: Playlist) => {
    setCurrentTrack(track);
  }, []);

  const handleAutoplayAccept = useCallback(() => {
    setShouldAutoplay(true);
    setShowToast(false);
  }, []);

  const handleAutoplayDecline = useCallback(() => {
    setShouldAutoplay(false);
    setShowToast(false);
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        isPlayerOpen,
        setIsPlayerOpen,
        playlist,
        currentTrack,
        setCurrentTrack,
        shouldAutoplay,
        setShouldAutoplay,
        showToast,
        setShowToast,
        isLoading,
        togglePlayer,
        handleTrackChange,
        handleAutoplayAccept,
        handleAutoplayDecline,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer(): MusicPlayerContextType {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return context;
}
