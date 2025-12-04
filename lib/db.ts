import { neon } from '@neondatabase/serverless';
import { QueryResult } from '../types/db';

let sql: ReturnType<typeof neon>;

function getSql() {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL environment variable is not set. Please set it in your .env.local file."
      );
    }
    sql = neon(databaseUrl);
  }
  return sql;
}

export async function query(
  text: string,
  params?: unknown[]
): Promise<QueryResult[]> {
  try {
    const db = getSql();
    const result = await db(text, params);
    return result as QueryResult[];
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function queryOne(
  text: string,
  params?: unknown[]
): Promise<QueryResult | null> {
  try {
    const db = getSql();
    const result = await db(text, params);
    const results = result as QueryResult[];
    return results[0] || null;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

