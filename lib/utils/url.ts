/**
 * URL 관련 유틸리티 함수
 */

/**
 * URL을 정규화합니다 (절대 URL과 상대 URL 모두 처리)
 * @param url - 정규화할 URL
 * @returns 정규화된 URL
 */
export function normalizeUrl(url: string): string {
  if (!url) return "";
  try {

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    if (typeof window !== "undefined") {
      return new URL(url, window.location.origin).href;
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * 두 URL이 같은지 비교합니다 (절대 URL과 상대 URL 모두 처리)
 * @param url1 - 첫 번째 URL
 * @param url2 - 두 번째 URL
 * @returns URL이 같은지 여부
 */
export function compareUrls(url1: string, url2: string): boolean {
  if (!url1 || !url2) return false;
  
  const normalized1 = normalizeUrl(url1);
  const normalized2 = normalizeUrl(url2);
  
  return (
    normalized1 === normalized2 ||
    url1 === url2 ||
    url1.includes(url2) ||
    url2.includes(url1)
  );
}

