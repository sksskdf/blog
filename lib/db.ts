import { neon } from '@neondatabase/serverless';
import { QueryResult } from '../types/db';

const sql = neon(process.env.DATABASE_URL!);

export async function query(text: string, params?: unknown[]): Promise<QueryResult[]> {
  try {
    const result = await sql(text, params);
    return result as QueryResult[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function queryOne(text: string, params?: unknown[]): Promise<QueryResult | null> {
  try {
    const result = await sql(text, params);
    return (result[0] as QueryResult) || null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export { sql };

