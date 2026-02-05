import { createApp } from './app';
import { appConfig } from './config/app.config';
import { testConnection, closePool } from './db/postgres';
import { logger } from './utils/logger.util';

/**
 * Start HTTP Server
 * 
 * Alur:
 * 1. Test koneksi database
 * 2. Create express app
 * 3. Start listening
 * 4. Handle graceful shutdown
 */
async function startServer(): Promise<void> {
  try {
    // 1. Test database connection
    logger.info('Testing database connection...');
    await testConnection();

    // 2. Create express app
    const app = createApp();

    // 3. Start server
    const server = app.listen(appConfig.port, () => {
      logger.info('='.repeat(50));
      logger.info(`🚀 ${appConfig.name} is running`);
      logger.info(`📍 Environment: ${appConfig.env}`);
      logger.info(`🌐 Server: http://localhost:${appConfig.port}`);
      logger.info(`🏥 Health: http://localhost:${appConfig.port}/health`);
      logger.info('='.repeat(50));
    });

    // 4. Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);
      
      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database pool
        await closePool();
        
        logger.info('All connections closed. Goodbye!');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen to termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
