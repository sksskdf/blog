/**
 * 디바이스 타입 감지 유틸리티
 * 실제 모바일과 데스크톱 브라우저의 개발자 도구 시뮬레이션 모두에서 일관되게 작동
 */

/**
 * 모바일 디바이스인지 확인
 * @param breakpoint - 브레이크포인트 (기본값: 768px, Tailwind의 md 브레이크포인트)
 * @returns 모바일 여부
 */
export function isMobileDevice(breakpoint: number = 768): boolean {
  if (typeof window === 'undefined') return false;
  
  // 1. 화면 너비로 먼저 확인 (시뮬레이션과 실제 모바일 모두에서 작동)
  const isSmallScreen = window.innerWidth < breakpoint;
  
  // 2. 터치 지원 여부 확인 (실제 모바일에서만 true)
  const hasTouchSupport = 'ontouchstart' in window || 
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;
  
  // 3. User Agent 확인 (추가 검증)
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  
  // 화면이 작거나, 터치를 지원하거나, 모바일 User Agent인 경우 모바일로 판단
  return isSmallScreen || (hasTouchSupport && isMobileUA);
}

/**
 * 태블릿 디바이스인지 확인
 * @returns 태블릿 여부
 */
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const width = window.innerWidth;
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // 태블릿은 보통 768px ~ 1024px 사이
  return width >= 768 && width < 1024 && hasTouchSupport;
}

/**
 * 데스크톱 디바이스인지 확인
 * @returns 데스크톱 여부
 */
export function isDesktopDevice(): boolean {
  return !isMobileDevice() && !isTabletDevice();
}

// React import
import { useState, useEffect } from 'react';

/**
 * 화면 크기 변경 감지를 위한 hook (컴포넌트에서 사용)
 * @param breakpoint - 브레이크포인트 (기본값: 768px)
 * @returns 모바일 여부
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  if (typeof window === 'undefined') return false;
  
  const [isMobile, setIsMobile] = useState(() => isMobileDevice(breakpoint));
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice(breakpoint));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    // orientationchange 이벤트도 감지 (모바일 기기 회전)
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, [breakpoint]);
  
  return isMobile;
}

