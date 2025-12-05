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



    const standardUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(standardUrl)}&format=json`;
    
    let response: Response;
    try {
      response = await fetch(oEmbedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },

        signal: AbortSignal.timeout(10000),
      });
    } catch (fetchError: unknown) {

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


    let data: { html?: string; title?: string; [key: string]: unknown };
    try {
      data = await response.json();
    } catch (jsonError) {
      return {
        embeddable: false,
        error: '동영상 정보를 파싱할 수 없습니다.',
      };
    }


    if (data && data.html && typeof data.html === 'string') {

      if (data.html.includes('iframe') && data.html.includes(videoId)) {
        return { embeddable: true };
      }
    }


    return {
      embeddable: false,
      error: '이 동영상은 외부 재생이 허용되지 않습니다.',
    };
  } catch (error) {
    console.error('Error checking YouTube embeddable:', error);

    return {
      embeddable: false,
      error: '외부 재생 가능 여부를 확인하는 중 오류가 발생했습니다.',
    };
  }
}
