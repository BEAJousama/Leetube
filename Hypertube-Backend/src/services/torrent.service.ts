import { IService, Service, getService } from "@/shared/core/service-container";
import { MovieService } from "./movie.service";
import { logger } from "@/shared/utils/logger";

@Service()
export class TorrentService implements IService {
  private _movieService?: MovieService;

  constructor() {
    logger.info('Torrent Service initialized');
  }

  // Lazy loading getter to avoid circular dependencies
  private get movieService(): MovieService {
    if (!this._movieService) {
      this._movieService = getService<MovieService>('MovieService');
    }
    return this._movieService!;
  }

  // Download service - starts downloading in background
  async downloadMovieService(engineEntry: any, movieId?: string) { 
    // const engine = engineEntry.engine;   
    // Select only the video file (not all files)
    // const videoFile = engine.files.find((file: any) => 
    //   file.name.toLowerCase().endsWith('.mkv') || 
    //   file.name.toLowerCase().endsWith('.mp4') ||
    //   file.name.toLowerCase().endsWith('.avi') ||
    //   file.name.toLowerCase().endsWith('.mov')
    // );

    // const videoFile = engine.files[engineEntry.metadata.clipIndex]

    // if (videoFile) {
    //   videoFile.select();
    // } else {
    //   logger.warn("No video file found in torrent");
    // }

    // Note: Movie library management is handled by dedicated services
    // Torrent service only handles download/streaming user engagement tracking

    // Log download progress and update database
    // engine.on("download", async () => {
    //   const progress = engine.swarm.downloaded / engine.torrent.length;
    //   const progressPercent = Math.round(progress * 100);
      
    //   logger.info(`Download progress: ${progressPercent}%`);
      
    //   // Update movie download progress in database
    //   if (movieId && progress > 0) {
    //     try {
    //       await this.movieService.updateMovieDownloadProgress(movieId, progressPercent);
    //     } catch (error) {
    //       logger.error(`Failed to update download progress for movie ${movieId}:`, error);
    //     }
    //   }
    // });

    // engine.on("idle", async () => {
    //   logger.info("Torrent download completed!");
      
    //   // Mark movie as downloaded in database
    //   if (movieId) {
    //     try {
    //       await this.movieService.markMovieAsDownloaded(movieId);
    //     } catch (error) {
    //       logger.error(`Failed to mark movie ${movieId} as downloaded:`, error);
    //     }
    //   }
    // });
  }
}

export const TorrentServer = TorrentService;
