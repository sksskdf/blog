import { query, queryOne } from './db';

export async function getTodayVisitorCount() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await queryOne(
      'SELECT count FROM visitor_stats WHERE date = $1',
      [today]
    );
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting visitor count:', error);
    return 0;
  }
}

export async function incrementVisitorCount() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 먼저 오늘 날짜의 레코드가 있는지 확인
    const existing = await queryOne(
      'SELECT count FROM visitor_stats WHERE date = $1',
      [today]
    );

    if (existing) {
      // 기존 레코드가 있으면 count 증가
      await query(
        'UPDATE visitor_stats SET count = count + 1 WHERE date = $1',
        [today]
      );
    } else {
      // 기존 레코드가 없으면 새로 생성
      await query(
        'INSERT INTO visitor_stats (date, count) VALUES ($1, 1)',
        [today]
      );
    }
  } catch (error) {
    console.error('Error incrementing visitor count:', error);
    throw error;
  }
}

