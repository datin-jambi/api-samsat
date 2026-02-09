import dotenv from 'dotenv';

// Load environment variables dari file .env
dotenv.config();

/**
 * Validasi environment variable
 * Throw error jika ada yang kosong
 */
function validateEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} tidak ditemukan. Pastikan sudah diset di file .env`);
  }
  return value;
}

/**
 * Environment Configuration
 * Semua konfigurasi dari .env dikumpulkan di sini
 * Mudah di-track dan di-debug
 */
export const env = {
  // Aplikasi
  APP_NAME: validateEnv('APP_NAME'),
  APP_PORT: validateEnv('APP_PORT'),
  NODE_ENV: validateEnv('NODE_ENV'),

  // Database
  DB_HOST: validateEnv('DB_HOST'),
  DB_PORT: validateEnv('DB_PORT'),
  DB_NAME: validateEnv('DB_NAME'),
  DB_USER: validateEnv('DB_USER'),
  DB_PASSWORD: validateEnv('DB_PASSWORD'),

  // Security
  API_KEY: validateEnv('API_KEY'),

  // External Services
  URL_JR: validateEnv('URL_JR'),
};
