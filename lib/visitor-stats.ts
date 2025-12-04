import { query, queryOne } from './db';
import { VisitorStatsRow } from '../types/db';

/**
 * 오늘 날짜의 방문자 수를 가져옵니다.
 * @returns 오늘의 방문자 수 (없으면 0)
 */
export async function getTodayVisitorCount(): Promise<number> {
  try {
    const result = await queryOne(
      'SELECT count FROM visitor_stats WHERE date = CURRENT_DATE'
    ) as VisitorStatsRow | null;
    
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting today visitor count:', error);
    return 0;
  }
}

/**
 * 오늘 날짜의 방문자 수를 1 증가시킵니다.
 * 해당 날짜의 레코드가 없으면 새로 생성합니다.
 */
export async function incrementVisitorCount(): Promise<void> {
  try {
    // 먼저 오늘 날짜의 레코드가 있는지 확인
    const existing = await queryOne(
      'SELECT count FROM visitor_stats WHERE date = CURRENT_DATE'
    ) as VisitorStatsRow | null;
    
    if (existing) {
      // 기존 레코드가 있으면 count를 1 증가
      await query(
        'UPDATE visitor_stats SET count = count + 1 WHERE date = CURRENT_DATE'
      );
    } else {
      // 기존 레코드가 없으면 새로 생성 (count = 1)
      await query(
        'INSERT INTO visitor_stats (date, count) VALUES (CURRENT_DATE, 1)'
      );
    }
  } catch (error) {
    console.error('Error incrementing visitor count:', error);
    throw error;
  }
}

