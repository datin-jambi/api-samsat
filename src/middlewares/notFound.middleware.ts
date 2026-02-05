import { Request, Response } from 'express';
import { notFoundResponse } from '../utils/response.util';
import { Message } from '../constants/message';

/**
 * Not Found Middleware
 * Handle request ke endpoint yang tidak ada
 * 
 * Dipasang setelah semua route didefinisikan
 */
export function notFoundMiddleware(_req: Request, res: Response): void {
  notFoundResponse(res, Message.ROUTE_NOT_FOUND);
}
