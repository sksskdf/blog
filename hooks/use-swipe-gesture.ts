import { useState, useEffect, useRef, useCallback, RefObject } from "react";

const SWIPE_CLOSE_THRESHOLD = 100;
const SWIPE_OPACITY_THRESHOLD = 200;
const THROTTLE_MS = 16;

interface UseSwipeGestureOptions {
  isOpen: boolean;
  onClose: () => void;
  playerRef: RefObject<HTMLDivElement>;
}

interface UseSwipeGestureReturn {
  swipeOffset: number;
  swipeOpacity: number;
  swipeTransform: string | undefined;
  swipeTransition: string;
}

export function useSwipeGesture({
  isOpen,
  onClose,
  playerRef,
}: UseSwipeGestureOptions): UseSwipeGestureReturn {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const lastTouchMoveTime = useRef<number>(0);
  const swipeOffsetRef = useRef<number>(0);

  useEffect(() => {
    swipeOffsetRef.current = swipeOffset;
  }, [swipeOffset]);

  useEffect(() => {
    if (!isOpen || !playerRef.current) return;

    const element = playerRef.current;
    const swipeIndicator = element.querySelector(
      "[data-swipe-indicator]"
    ) as HTMLElement;
    if (!swipeIndicator) return;

    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const touchStartHandler = (e: globalThis.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      touchStartY.current = touch.clientY;
      touchStartX.current = touch.clientX;
    };

    const touchMoveHandler = (e: globalThis.TouchEvent) => {
      if (touchStartY.current === null || touchStartX.current === null) return;

      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      if (now - lastTouchMoveTime.current < THROTTLE_MS) return;
      lastTouchMoveTime.current = now;

      const touch = e.touches[0];
      if (!touch) return;

      const deltaY = touch.clientY - touchStartY.current;
      const deltaX = Math.abs(touch.clientX - touchStartX.current);

      if (deltaY > 0 && deltaY > deltaX) {
        setSwipeOffset(deltaY);
      }
    };

    const touchEndHandler = () => {
      const currentOffset = swipeOffsetRef.current;
      if (currentOffset > SWIPE_CLOSE_THRESHOLD) {
        onClose();
      }
      touchStartY.current = null;
      touchStartX.current = null;
      setSwipeOffset(0);
    };

    swipeIndicator.addEventListener(
      "touchstart",
      touchStartHandler as EventListener,
      { passive: false }
    );
    swipeIndicator.addEventListener(
      "touchmove",
      touchMoveHandler as EventListener,
      { passive: false }
    );
    swipeIndicator.addEventListener("touchend", touchEndHandler, {
      passive: false,
    });

    return () => {
      if (
        swipeIndicator &&
        swipeIndicator.parentNode &&
        document.contains(swipeIndicator)
      ) {
        try {
          swipeIndicator.removeEventListener(
            "touchstart",
            touchStartHandler as EventListener
          );
          swipeIndicator.removeEventListener(
            "touchmove",
            touchMoveHandler as EventListener
          );
          swipeIndicator.removeEventListener("touchend", touchEndHandler);
        } catch (error) {
          console.warn("Error removing touch event listeners:", error);
        }
      }
    };
  }, [isOpen, onClose, playerRef]);

  const swipeOpacity =
    swipeOffset > 0
      ? Math.max(0.5, 1 - swipeOffset / SWIPE_OPACITY_THRESHOLD)
      : 1;

  const swipeTransform =
    swipeOffset > 0 ? `translateY(${swipeOffset}px)` : undefined;

  const swipeTransition =
    swipeOffset === 0 ? "transform 0.2s ease-out" : "none";

  return {
    swipeOffset,
    swipeOpacity,
    swipeTransform,
    swipeTransition,
  };
}

