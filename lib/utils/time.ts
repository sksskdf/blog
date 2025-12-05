/**
 * 시간 관련 유틸리티 함수
 */

/**
 * 초를 MM:SS 형식의 문자열로 변환합니다
 * @param seconds - 변환할 초
 * @returns MM:SS 형식의 문자열
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

