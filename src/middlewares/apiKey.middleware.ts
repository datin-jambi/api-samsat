import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { unauthorizedResponse } from '../utils/response.util';
import { Message } from '../constants/message';

/**
 * API Key Middleware
 * Validasi API key dari header request
 * 
 * Support 2 cara mengirim API key:
 * 1. Via header 'X-API-KEY: your-api-key'
 * 2. Via header 'Authorization: Bearer your-api-key'
 * 
 * Cara kerja:
 * 1. Ambil API key dari header (X-API-KEY atau Authorization)
 * 2. Bandingkan dengan API key dari .env
 * 3. Jika tidak cocok, return 401 Unauthorized
 * 4. Jika cocok, lanjutkan ke handler berikutnya
 */
export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Cek dari header X-API-KEY
  let apiKey = req.headers['x-api-key'] as string;

  // Jika tidak ada, cek dari Authorization: Bearer
  if (!apiKey) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7); // Ambil token setelah "Bearer "
    }
  }

  // Cek apakah API key ada
  if (!apiKey) {
    unauthorizedResponse(res, Message.API_KEY_REQUIRED);
    return;
  }

  // Validasi API key
  if (apiKey !== env.API_KEY) {
    unauthorizedResponse(res, Message.UNAUTHORIZED);
    return;
  }

  // API key valid, lanjutkan
  next();
}
