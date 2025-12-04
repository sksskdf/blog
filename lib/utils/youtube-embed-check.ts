/**
 * YouTube 외부 재생 가능 여부 확인 유틸리티
 */

import { getYouTubeVideoId } from './youtube';

/**
 * YouTube 동영상이 외부 재생 가능한지 확인
 * oEmbed API를 사용하여 확인합니다.
 * 
 * 참고: oEmbed API만으로는 완벽하게 확인할 수 없지만,
 * 외부 재생이 금지된 동영상은 보통 404나 401을 반환합니다.
 */
export async function checkYouTubeEmbeddable(url: string): Promise<{
  embeddable: boolean;
  error?: string;
}> {
  try {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
      return { embeddable: false, error: '유효한 YouTube URL이 아닙니다.' };
    }

    // oEmbed API를 사용하여 확인
    // 표준 YouTube URL 형식으로 변환
    const standardUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(standardUrl)}&format=json`;
    
    let response: Response;
    try {
      response = await fetch(oEmbedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // 타임아웃 설정 (10초)
        signal: AbortSignal.timeout(10000),
      });
    } catch (fetchError: unknown) {
      // 네트워크 오류나 타임아웃
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return {
          embeddable: false,
          error: '동영상 정보 확인 시간이 초과되었습니다. 외부 재생이 허용되지 않을 수 있습니다.',
        };
      }
      if (fetchError instanceof Error && fetchError.name === 'TypeError') {
        return {
          embeddable: false,
          error: '동영상 정보를 확인할 수 없습니다. 네트워크 오류가 발생했습니다.',
        };
      }
      return {
        embeddable: false,
        error: '동영상 정보를 확인할 수 없습니다.',
      };
    }

    if (!response.ok) {
      // 404, 401, 403 등은 외부 재생 불가능을 의미
      if (response.status === 404 || response.status === 401 || response.status === 403) {
        return {
          embeddable: false,
          error: '이 동영상은 외부 재생이 허용되지 않습니다.',
        };
      }
      return {
        embeddable: false,
        error: `동영상 정보를 확인할 수 없습니다. (상태 코드: ${response.status})`,
      };
    }

    // oEmbed 응답 확인
    let data: { html?: string; title?: string; [key: string]: unknown };
    try {
      data = await response.json();
    } catch (jsonError) {
      return {
        embeddable: false,
        error: '동영상 정보를 파싱할 수 없습니다.',
      };
    }

    // oEmbed가 성공하고 html이 있으면 외부 재생 가능
    if (data && data.html && typeof data.html === 'string') {
      // 추가 검증: html에 iframe이 포함되어 있고 videoId가 포함되어 있는지 확인
      if (data.html.includes('iframe') && data.html.includes(videoId)) {
        return { embeddable: true };
      }
    }

    // oEmbed는 성공했지만 embed 정보가 없는 경우
    return {
      embeddable: false,
      error: '이 동영상은 외부 재생이 허용되지 않습니다.',
    };
  } catch (error) {
    console.error('Error checking YouTube embeddable:', error);
    // 예상치 못한 오류 발생 시 안전하게 false 반환 (이전에는 true를 반환했음)
    return {
      embeddable: false,
      error: '외부 재생 가능 여부를 확인하는 중 오류가 발생했습니다.',
    };
  }
}
