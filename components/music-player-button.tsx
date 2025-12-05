"use client";

import { useMusicPlayer } from "../contexts/music-player-context";
import MusicPlayer from "./music-player";

export default function MusicPlayerButton() {
  const {
    isPlayerOpen,
    setIsPlayerOpen,
    playlist,
    currentTrack,
    shouldAutoplay,
    isLoading,
    togglePlayer,
    handleTrackChange,
  } = useMusicPlayer();

  if (isLoading) {
    return null;
  }

  if (!playlist || playlist.length === 0) {
    return null;
  }

  const displayCover = currentTrack?.cover || null;
  const defaultIcon = "🎵";

  return (
    <>
      <button
        className="fixed bottom-5 right-5 w-16 h-16 rounded-full bg-brand-green text-dark-card border-2 border-brand-green text-3xl cursor-pointer shadow-lg z-[999] flex items-center justify-center transition-all duration-300 hover:bg-brand-accent hover:border-brand-accent hover:scale-110 hover:shadow-xl active:scale-95"
        aria-label="뮤직 플레이어 열기"
        onClick={togglePlayer}
        style={{
          backgroundImage: displayCover ? `url(${displayCover})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {!displayCover && (
          <span className="flex items-center justify-center w-full h-full bg-brand-green/90 rounded-full text-dark-card">
            {defaultIcon}
          </span>
        )}
      </button>
      <MusicPlayer
        playlist={playlist}
        currentTrack={currentTrack}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        onTrackChange={handleTrackChange}
        autoPlay={shouldAutoplay}
      />
    </>
  );
}
