import App from './app';
import { connectDatabase, disconnectDatabase } from './shared/database/connection';
import { logger } from './shared/utils/logger';
import { TorrentService } from './services/torrent.service';
import { MemoryMonitor } from './shared/utils/memory-monitor';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // process.exit(1);
});

async function bootstrap() {
  try {
    // Initialize database connection
    await connectDatabase();
    logger.info('Database connected successfully');
    
    // Start memory monitoring
    const memoryMonitor = MemoryMonitor.getInstance();
    memoryMonitor.start();

    // Create and start the application
    const app = new App();
    app.listen();


    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Shutting down gracefully...');
      
      try {
        // Stop memory monitoring   
        const memoryMonitor = MemoryMonitor.getInstance();
        memoryMonitor.stop();        
        // Disconnect database
        await disconnectDatabase();
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start the application:', error);
    process.exit(1);
  }
}

bootstrap();
