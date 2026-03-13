import { Pool } from 'pg';
import { databaseConfig } from '../config/database.config';
import { logger } from '../utils/logger.util';

/**
 * PostgreSQL Connection Pool
 * 
 * Konsep:
 * - Pool = kumpulan koneksi database yang siap dipakai
 * - Lebih efisien daripada buka-tutup koneksi setiap request
 * - Mirip seperti PDO di PHP, tapi dengan connection pooling
 */
export const pool = new Pool(databaseConfig);
const SLOW_QUERY_THRESHOLD_MS = 500;

function compactSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim().slice(0, 200);
}

/**
 * Test koneksi database
 * Dipanggil saat aplikasi start
 */
export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info('✓ Database connected:', result.rows[0].now);
    client.release(); // kembalikan koneksi ke pool
  } catch (error) {
    logger.error('✗ Database connection failed:', error);
    throw error;
  }
}

/**
 * Tutup semua koneksi di pool
 * Dipanggil saat aplikasi shutdown
 */
export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}

/**
 * Helper untuk execute query
 * Otomatis handle koneksi dari pool
 * 
 * @param sql - SQL query mentah
 * @param params - Parameter untuk prepared statement
 * @returns Query result
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const startTime = Date.now();

  try {
    const result = await pool.query(sql, params);
    const durationMs = Date.now() - startTime;

    if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
      logger.warn('Slow query detected', {
        durationMs,
        rowCount: result.rowCount,
        sql: compactSql(sql)
      });
    }

    return result.rows as T[];
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    // Log error dengan detail
    logger.error('Database query error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      table: error.table,
      durationMs,
      sql: compactSql(sql)
    });
    
    // Throw error dengan pesan yang lebih jelas
    const errorMessage = error.code === '42P01' 
      ? `Tabel "${error.table || 'unknown'}" tidak ditemukan di database`
      : error.code === '42703'
      ? `Kolom tidak ditemukan: ${error.message}`
      : error.code === '28P01'
      ? 'Koneksi database gagal: Username/password salah'
      : error.code === '3D000'
      ? 'Database tidak ditemukan'
      : `Database error: ${error.message}`;
    
    throw new Error(errorMessage);
  }
}

/**
 * Helper untuk execute query dan ambil 1 row saja
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}
