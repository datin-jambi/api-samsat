import { env } from './env';
import { PoolConfig } from 'pg';

/**
 * Konfigurasi database PostgreSQL
 * Menggunakan connection pool untuk performa yang lebih baik
 */
export const databaseConfig: PoolConfig = {
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT, 10),
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  
  // Pool settings
  max: 20, // maksimal 20 koneksi dalam pool
  idleTimeoutMillis: 30000, // tutup koneksi yang idle setelah 30 detik
  connectionTimeoutMillis: 2000, // timeout jika tidak bisa connect dalam 2 detik
};
