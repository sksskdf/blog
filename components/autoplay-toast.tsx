'use client';

import { useState, useEffect } from 'react';

interface AutoplayToastProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function AutoplayToast({ onAccept, onDecline }: AutoplayToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    setIsVisible(false);
    onDecline();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[1000] animate-slide-up">
      <div className="bg-dark-card border border-brand-green rounded-lg p-3 shadow-2xl max-w-[260px] sm:max-w-sm">
        <div className="flex items-start gap-2">
          <div className="text-xl flex-shrink-0">🎵</div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-dark-text mb-1 font-mono">
              음악 자동 재생
            </h3>
            <p className="text-[11px] text-dark-muted mb-2 leading-snug">
              홈페이지 진입 시 음악을 자동으로 재생할까요?
            </p>
            <div className="flex gap-1">
              <button
                onClick={handleAccept}
                className="flex-1 px-2 py-1 bg-brand-green text-dark-card text-[11px] font-mono font-bold rounded hover:bg-brand-accent transition-colors cursor-pointer"
              >
                재생
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 px-2 py-1 bg-transparent border border-dark-border-subtle text-dark-muted text-[11px] font-mono rounded hover:border-brand-green hover:text-brand-green transition-colors cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
          <button
            onClick={handleDecline}
            className="text-dark-muted hover:text-dark-text transition-colors cursor-pointer flex-shrink-0"
            aria-label="닫기"
          >
            <span className="material-icons text-base">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}

