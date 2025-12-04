"use client";

import { useMusicPlayer } from "../contexts/music-player-context";
import MusicPlayer from "./music-player";
// import AutoplayToast from "./autoplay-toast"; // 임시 제거

export default function MusicPlayerButton() {
  const {
    isPlayerOpen,
    setIsPlayerOpen,
    playlist,
    currentTrack,
    shouldAutoplay,
    showToast,
    isLoading,
    togglePlayer,
    handleTrackChange,
    handleAutoplayAccept,
    handleAutoplayDecline,
  } = useMusicPlayer();

  // 로딩 중이거나 플레이리스트가 없으면 버튼을 표시하지 않음
  if (isLoading) {
    return null;
  }

  // 플레이리스트가 없으면 버튼을 표시하지 않음
  if (!playlist || playlist.length === 0) {
    return null;
  }

  // 현재 트랙의 커버 이미지 또는 기본 아이콘
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
      {/* 임시 제거: 음악 자동 재생 팝업
      {showToast && (
        <AutoplayToast
          onAccept={handleAutoplayAccept}
          onDecline={handleAutoplayDecline}
        />
      )}
      */}
    </>
  );
}
