import { env } from './env';

/**
 * Konfigurasi aplikasi
 * Berisi setting-setting umum aplikasi
 */
export const appConfig = {
  name: env.APP_NAME,
  port: parseInt(env.APP_PORT, 10),
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
};
