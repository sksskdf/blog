import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function query(text, params) {
  try {
    const result = await sql(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function queryOne(text, params) {
  try {
    const result = await sql(text, params);
    return result[0] || null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export { sql };

