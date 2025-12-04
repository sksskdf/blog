/**
 * YouTube 관련 유틸리티 함수
 */

/**
 * YouTube URL에서 비디오 ID 추출
 */
export function getYouTubeVideoId(url: string | null): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * YouTube URL인지 확인
 */
export function isYouTubeUrl(url: string | null): boolean {
  return url ? (url.includes('youtube.com') || url.includes('youtu.be')) : false;
}

