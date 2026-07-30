
import nodeCron from "node-cron";
import { logger } from "../utils/logger";
import { getService } from "./service-container";
import { MovieService } from "../../services/movie.service";
import { TorrentService } from "../../services/torrent.service";
import { AuthService } from "../../services/auth.service";

import { config } from "../../config/environment";

/**
 * Schedule cron jobs for various cleanup and maintenance tasks
 */
export const scheduleCronJobs = () => {
  logger.info('Initializing cron jobs...');

  // Keep-alive ping every 14 minutes to prevent Render free tier from spinning down
  nodeCron.schedule("*/14 * * * *", async () => {
    try {
      logger.info("Running keep-alive ping to prevent spin down");
      const url = `${config.baseUrl}/health`;
      const response = await fetch(url);
      if (response.ok) {
        logger.info(`Keep-alive successful: ${response.status}`);
      } else {
        logger.warn(`Keep-alive returned non-ok status: ${response.status}`);
      }
    } catch (error: any) {
      logger.error(`Error in keep-alive ping: ${error.message}`);
    }
  });

  // Cleanup expired refresh tokens every hour
  nodeCron.schedule("0 * * * *", async () => {
    try {
      logger.info("Running scheduled job: Cleanup expired refresh tokens");
      const authService = getService<AuthService>('AuthService');
      await authService.cleanupExpiredTokens();
    } catch (error) {
      logger.error("Error in cleanup expired tokens job:", error);
    }
  });

  // Cleanup old download files every 10 minutes
  nodeCron.schedule("*/10 * * * *", async () => {
    try {
      logger.info("Running scheduled job: Cleanup old download files");
      const movieService = getService<MovieService>('MovieService');
      await movieService.cleanupOldDownloads();
    } catch (error) {
      logger.error("Error in cleanup old downloads job:", error);
    }
  });

  // Health check and memory monitoring every 30 minutes
  nodeCron.schedule("*/30 * * * *", async () => {
    try {
      logger.info("Running scheduled job: System health check");
      const memoryUsage = process.memoryUsage();
      logger.info('Memory Usage:', {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      });
    } catch (error) {
      logger.error("Error in health check job:", error);
    }
  });

  logger.info('Cron jobs initialized successfully');
};
