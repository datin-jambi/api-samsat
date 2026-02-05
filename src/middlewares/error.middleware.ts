import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.util';
import { logger } from '../utils/logger.util';
import { Message } from '../constants/message';

/**
 * Global Error Handler Middleware
 * Catch semua error yang tidak di-handle di controller
 * 
 * Harus dipasang paling akhir setelah semua route
 */
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error untuk debugging
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Kirim response error ke client dengan detail yang jelas
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  errorResponse(
    res,
    isDevelopment ? err.message : Message.INTERNAL_ERROR,
    isDevelopment ? {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    } : undefined
  );
}
