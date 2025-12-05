"use client";

import { useState, useEffect, useRef } from "react";
import { useMusicPlayer } from "../contexts/music-player-context";
import MusicPlayer from "./music-player";
import { useIsMobile } from "../lib/utils/device";

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

  const isMobile = useIsMobile(768); // Tailwind md 브레이크포인트
  const [position, setPosition] = useState({ bottom: 20, right: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 저장된 위치 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPosition = localStorage.getItem('musicPlayerButtonPosition');
      if (savedPosition) {
        try {
          const pos = JSON.parse(savedPosition);
          setPosition(pos);
        } catch (e) {
          console.error('Failed to parse saved position:', e);
        }
      }
    }
  }, []);

  // 위치 저장
  useEffect(() => {
    if (isMobile && typeof window !== 'undefined') {
      localStorage.setItem('musicPlayerButtonPosition', JSON.stringify(position));
    }
  }, [position, isMobile]);

  // 터치 이벤트 핸들러 (직접 DOM 이벤트 리스너 사용)
  useEffect(() => {
    if (!isMobile || !buttonRef.current) return;

    const button = buttonRef.current;
    let startX = 0;
    let startY = 0;
    let startRight = 0;
    let startBottom = 0;
    let dragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      
      const rect = button.getBoundingClientRect();
      startX = touch.clientX;
      startY = touch.clientY;
      startRight = window.innerWidth - rect.right;
      startBottom = window.innerHeight - rect.bottom;
      dragging = true;
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      const rect = button.getBoundingClientRect();
      const newRight = startRight - deltaX;
      const newBottom = startBottom - deltaY;

      // 화면 경계 내에서만 이동 가능
      const maxRight = window.innerWidth - rect.width;
      const maxBottom = window.innerHeight - rect.height;

      setPosition({
        right: Math.max(0, Math.min(maxRight, newRight)),
        bottom: Math.max(0, Math.min(maxBottom, newBottom)),
      });
    };

    const handleTouchEnd = () => {
      dragging = false;
      setIsDragging(false);
    };

    // passive: false 옵션으로 이벤트 리스너 추가
    button.addEventListener('touchstart', handleTouchStart, { passive: false });
    button.addEventListener('touchmove', handleTouchMove, { passive: false });
    button.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      button.removeEventListener('touchstart', handleTouchStart);
      button.removeEventListener('touchmove', handleTouchMove);
      button.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

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
        ref={buttonRef}
        className={`fixed w-16 h-16 rounded-full bg-brand-green text-dark-card border-2 border-brand-green text-3xl shadow-lg z-[999] flex items-center justify-center transition-all duration-300 ${
          isMobile
            ? isDragging
              ? "cursor-grabbing active:scale-95"
              : "cursor-grab active:scale-95"
            : "cursor-pointer hover:bg-brand-accent hover:border-brand-accent hover:scale-110 hover:shadow-xl active:scale-95"
        }`}
        aria-label="뮤직 플레이어 열기"
        onClick={(e) => {
          // 드래그 중이면 클릭 이벤트 방지
          if (!isDragging) {
            togglePlayer();
          }
        }}
        style={{
          bottom: `${position.bottom}px`,
          right: `${position.right}px`,
          backgroundImage: displayCover ? `url(${displayCover})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          touchAction: isMobile ? "none" : "auto",
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
