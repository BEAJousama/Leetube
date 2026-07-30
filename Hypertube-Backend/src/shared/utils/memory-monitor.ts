import { logger } from './logger';

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly heapThreshold = 1.8 * 1024 * 1024 * 1024; // 1.8GB threshold

  private constructor() {}

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  start(): void {
    if (this.monitoringInterval) return;

    // Monitor memory every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30 * 1000);

    logger.info('Memory monitoring started');
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Memory monitoring stopped');
    }
  }

  private checkMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const externalMB = Math.round(memUsage.external / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);

    // Log memory stats
    logger.info('Memory Usage:', {
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      external: `${externalMB}MB`,
      rss: `${rssMB}MB`
    });

    // Warning if approaching threshold
    if (memUsage.heapUsed > this.heapThreshold * 0.8) {
      logger.warn(`High memory usage detected: ${heapUsedMB}MB / ${Math.round(this.heapThreshold / 1024 / 1024)}MB`);
    }

    // Critical warning if very close to threshold
    if (memUsage.heapUsed > this.heapThreshold * 0.9) {
      logger.error(`CRITICAL: Memory usage approaching limit: ${heapUsedMB}MB`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logger.info('Forced garbage collection');
      }
    }
  }

  // Get current memory stats
  getMemoryStats() {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapPercentage: Math.round((memUsage.heapUsed / this.heapThreshold) * 100)
    };
  }
} 