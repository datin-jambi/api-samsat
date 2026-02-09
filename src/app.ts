import express, { Application } from 'express';
import cors from 'cors';
import { appConfig } from './config/app.config';
import { apiKeyMiddleware } from './middlewares/apiKey.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/notFound.middleware';
import { logger } from './utils/logger.util';

// Import routes
import kendaraanRoutes from './modules/kendaraan/kendaraan.route';
import pajakRoutes from './modules/pajak/pajak.route';
import jrRoutes from './modules/jr/jr.route';

/**
 * Create Express Application
 * 
 * Setup semua middleware dan routes
 */
export function createApp(): Application {
  const app = express();

  // ==========================================
  // MIDDLEWARES GLOBAL
  // ==========================================
  
  // CORS - allow request dari domain lain
  app.use(cors());

  // Parse JSON body
  app.use(express.json());

  // Parse URL-encoded body
  app.use(express.urlencoded({ extended: true }));

  // Log setiap request (hanya di development)
  if (appConfig.isDevelopment) {
    app.use((req, _res, next) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });
  }

  // ==========================================
  // HEALTH CHECK (tanpa API key)
  // ==========================================
  
  app.get('/health', (_req, res) => {
    res.json({
      status: true,
      message: 'API is running',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: appConfig.env,
      },
    });
  });

  // ==========================================
  // API ROUTES (dengan API key)
  // ==========================================
  
  // Semua route di bawah /api butuh API key
  app.use('/api', apiKeyMiddleware);

  // Register module routes
  app.use('/api/kendaraan', kendaraanRoutes);
  app.use('/api/pajak', pajakRoutes);
  app.use('/api/jr', jrRoutes);

  // ==========================================
  // ERROR HANDLERS
  // ==========================================
  
  // 404 handler - harus setelah semua routes
  app.use(notFoundMiddleware);

  // Global error handler - harus paling akhir
  app.use(errorMiddleware);

  return app;
}
