import { Service, IService, getService } from '@/shared/core/service-container';
import { TMDBService, ExternalMovieData } from './tmdb.service';
import { YTSService, MagnetLink } from './yts.service';
import { prisma } from '@/shared/database/connection';
import { logger } from '@/shared/utils/logger';
import { TTLCache } from '@/shared/utils/cache';

export interface MovieSearchOptions {
  title?: string;
  year?: string;
  genre?: string;
  page?: number;
  limit?: number;
  cast?: string;
  director?: string;
  sortBy?: 'popularity' | 'rating' | 'year' | 'title';
  sortOrder?: 'asc' | 'desc';
  language?: string;
}

export interface MovieFetchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'popularity' | 'rating' | 'year' | 'title';
  genre?: string;
}

export interface MovieSearchResult {
  movies: ExternalMovieData[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface EnrichedMovieData extends ExternalMovieData {
  sources?: {
    torrents: MagnetLink[];
    bestTorrent: MagnetLink | null;
    trailer: string | null;
    hasStreaming: boolean;
  };
  averageRating?: number;
  totalRatings?: number;
  userRating?: number;
}

@Service()
export class ExternalMovieService implements IService {
  private _tmdbService?: TMDBService;
  private _ytsService?: YTSService;
  private readonly movieCache = new TTLCache<EnrichedMovieData>(3600, 500); // 1 hour TTL, max 500 items

  constructor() {
    // ExternalMovieService initialized
    logger.info('ExternalMovieService initialized');
  }

  // Lazy loading getters to avoid circular dependencies
  private get tmdbService(): TMDBService {
    if (!this._tmdbService) {
      this._tmdbService = getService<TMDBService>('TMDBService');
    }
    return this._tmdbService!;
  }

  private get ytsService(): YTSService {
    if (!this._ytsService) {
      this._ytsService = getService<YTSService>('YTSService');
    }
    return this._ytsService!;
  }

  /**
   * Get movies using TMDB as primary source
   */
  async getMovies(options: MovieSearchOptions): Promise<MovieSearchResult> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'popularity',
        genre = 'all',
      } = options;

      let tmdbResults;
      const discoverOptions: any = {
        page,
        limit,
        sortBy: this.mapSortBy(sortBy),
        genre: genre,
      };
        
      tmdbResults = await this.tmdbService.discoverMovies(discoverOptions);

      const movies = await Promise.all(
        tmdbResults.results.slice(0, limit).map(movie =>
          this.tmdbService.normalizeMovieData(movie, false)
        )
      );

      return {
        movies,
        totalResults: tmdbResults.total_results,
        totalPages: tmdbResults.total_pages,
        currentPage: page,
        hasNextPage: page < tmdbResults.total_pages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      logger.error('External movie search error:', error);
      throw new Error('Failed to search movies');
    }
  }

  /**
   * Search movies by title or year, or cast, or director, or genre
   */
  async searchMovies(options: MovieSearchOptions): Promise<MovieSearchResult> {
    try {
      const {
        page = 1,
        limit = 20,
      } = options;

      const tmdbResults = await this.tmdbService.searchMovies(options);
      const movies = await Promise.all(
        tmdbResults.results.map(movie =>
          this.tmdbService.normalizeMovieData(movie, false)
        )
      );

      return {
        movies,
        totalResults: tmdbResults.total_results,
        totalPages: tmdbResults.total_pages,
        currentPage: page,
        hasNextPage: page < tmdbResults.total_pages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      logger.error('External movie search error:', error);
      throw new Error('Failed to search movies');
    }
  }

  /**
   * Get popular movies
   */
  async getPopularMovies(page: number = 1, limit: number = 20): Promise<MovieSearchResult> {
    return this.getTmdbMovies(() => this.tmdbService.getPopularMovies(page), page, limit);
  }

  /**
   * Get top rated movies
   */
  async getTopRatedMovies(page: number = 1, limit: number = 20): Promise<MovieSearchResult> {
    return this.getTmdbMovies(() => this.tmdbService.getTopRatedMovies(page), page, limit);
  }

  /**
   * Get trending movies
   */
  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<MovieSearchResult> {
    return this.getTmdbMovies(() => this.tmdbService.getTrendingMovies(page), page);
  }

  /**
   * Get detailed movie information by TMDB ID
   */
  async getMovieDetails(tmdbId: number): Promise<ExternalMovieData> {
    try {
      const tmdbDetails = await this.tmdbService.getMovieDetails(tmdbId);
      if (!tmdbDetails) {
        throw new Error('Movie not found')
      }
      return await this.tmdbService.normalizeMovieData(tmdbDetails, true);
    } catch (error) {
      logger.error('Get movie details error:', error);
      throw new Error('Failed to fetch movie details');
    }
  }

  /**
   * Get enriched movie data combining TMDB and YTS (torrents + trailers)
   */
  async getEnrichedMovieData(tmdbId: number): Promise<EnrichedMovieData> {
    const cacheKey = `movie_${tmdbId}`;
    const cachedData = this.movieCache.get(cacheKey);
    
    if (cachedData) {
      logger.debug(`[Cache Hit] Movie details for TMDB ID: ${tmdbId}`);
      return cachedData;
    }

    try {
      const movieData = await this.getMovieDetails(tmdbId);

      if (!movieData) {
        throw new Error('Movie not found');
      }
      
      let finalData: EnrichedMovieData = movieData;
      
      if (movieData.imdbId) {
        try {
          const streamingData = await this.ytsService.getStreamingData(movieData.imdbId);
          finalData = {
            ...movieData,
            sources: streamingData
          };
        } catch (ytsError) {
          logger.warn('Failed to get YTS streaming data:', ytsError);
        }
      }

      this.movieCache.set(cacheKey, finalData);
      return finalData;
    } catch (error) {
      logger.error('Get enriched movie data error:', error);
      throw new Error('Failed to fetch enriched movie data');
    }
  }

  /**
   * Helper method to reduce repetitive TMDB movie fetching logic
   */
  private async getTmdbMovies(
    tmdbFetcher: () => Promise<any>, 
    page: number, 
    limit?: number
  ): Promise<MovieSearchResult> {
    try {
      const tmdbResults = await tmdbFetcher();
      
      const movies = await Promise.all(
        (limit ? tmdbResults.results.slice(0, limit) : tmdbResults.results).map((movie: any) =>
          this.tmdbService.normalizeMovieData(movie, false)
        )
      );

      return {
        movies,
        totalResults: tmdbResults.total_results,
        totalPages: tmdbResults.total_pages,
        currentPage: page,
        hasNextPage: page < tmdbResults.total_pages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      logger.error('TMDB movie fetch error:', error);
      throw new Error('Failed to fetch movies');
    }
  }

  /**
   * Map sort options to TMDB format
   */
  private mapSortBy(sortBy: string): string {
    const sortMap: { [key: string]: string } = {
      popularity: 'popularity.desc',
      rating: 'vote_average.desc',
      year: 'release_date.desc',
      title: 'original_title.asc',
    };

    return sortMap[sortBy] || 'popularity.desc';
  }

  /**
   * Save movie sources (torrents/magnet links) to database
   */
  async saveMovieSources(movieId: string, sources: {
    torrents: MagnetLink[];
    bestTorrent: MagnetLink | null;
    trailer: string | null;
    hasStreaming: boolean;
  }): Promise<void> {
    try {
      if (sources.torrents.length > 0) {
        const movieSources = sources.torrents.map((torrent, index) => ({
          movieId,
          sourceName: 'YTS',
          sourceId: `${torrent.hash}-${index}`,
          magnetLink: torrent.magnet,
          quality: torrent.quality,
          seeders: torrent.seeds,
          leechers: torrent.peers,
          fileSize: BigInt(torrent.size.replace(/[^\d]/g, '') || '0'), // Convert size string to number
          isVerified: true
        }));

        await prisma.movieSource.createMany({
          data: movieSources,
          skipDuplicates: true
        });

        logger.info(`Saved ${movieSources.length} torrent sources for movie ${movieId}`);
      }

      if (sources.trailer) {
        const trailerUrl = `https://www.youtube.com/watch?v=${sources.trailer}`;
        await prisma.movie.update({
          where: { id: movieId },
          data: {
            trailerUrl
          }
        });
        logger.info(`Updated trailer for movie ${movieId}: ${trailerUrl}`);
      }

    } catch (error) {
      logger.error(`Error saving movie sources for movie ${movieId}:`, error);
      throw new Error('Failed to save movie sources to database');
    }
  }

  /**
   * Get streaming data for a movie by IMDB ID
   */
  
  async getStreamingDataForMovie(imdbId: string): Promise<{
    torrents: MagnetLink[];
    bestTorrent: MagnetLink | null;
    trailer: string | null;
    hasStreaming: boolean;
  }> {
    try {
      return await this.ytsService.getStreamingData(imdbId);
    } catch (error) {
      logger.error(`Failed to get streaming data for IMDB ID ${imdbId}:`, error);
      return {
        torrents: [],
        bestTorrent: null,
        trailer: null,
        hasStreaming: false
      };
    }
  }

  /**
   * Health check for external APIs
   */
  async healthCheck(): Promise<{ tmdb: boolean; yts: boolean }> {
    const results = { tmdb: false, yts: false };

    try {
      await this.tmdbService.getPopularMovies(1);
      results.tmdb = true;
    } catch (error) {
      logger.error('TMDB health check failed:', error);
    }

    try {
      await this.ytsService.getStreamingData('tt0111161');
      results.yts = true;
    } catch (error) {
      logger.error('YTS health check failed:', error);
    }

    return results;
  }
}
