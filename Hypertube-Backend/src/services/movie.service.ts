import { prisma } from '@/shared/database/connection';
import { Service, IService, getService } from '@/shared/core/service-container';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/shared/middleware/error.middleware';
import { 
  CreateMovieDto, 
  MovieResponseDto 
} from '@/shared/types/dtos';
import { 
  ExternalMovieService, 
  MovieSearchOptions,
  ExternalMovieData,
  EnrichedMovieData 
} from './external';
import { 
  validateInput, 
  movieDataSchema,
} from '@/shared/validation/movie.validation';
import { MovieFetchOptions } from './external/external-movie.service';

@Service()
export class MovieService implements IService {
  private _externalMovieService?: ExternalMovieService;

  constructor() {
    // MovieService initialized
    logger.info('Movie Service initialized');
  }

  // Lazy loading getter to avoid circular dependencies
  private get externalMovieService(): ExternalMovieService {
    if (!this._externalMovieService) {
      this._externalMovieService = getService<ExternalMovieService>('ExternalMovieService');
    }
    return this._externalMovieService!;
  }

  // ==========================================
  // CORE MOVIE CRUD OPERATIONS
  // ==========================================

  // ============================================================================
  // CORE MOVIE CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new movie in the database
   */
  async createMovie(movieData: CreateMovieDto): Promise<MovieResponseDto> {
    // Validate and sanitize input data
    const validatedData = validateInput<CreateMovieDto>(movieDataSchema, movieData);

    const movie = await prisma.movie.create({
      data: {
        title: validatedData.title,
        rating: validatedData.rating,
        description: validatedData.description,
        year: validatedData.releaseYear,
        duration: validatedData.runtime,
        genre: Array.isArray(validatedData.genre) ? validatedData.genre.join(', ') : validatedData.genre,
        director: validatedData.director,
        posterUrl: validatedData.poster,
        backdropUrl: validatedData.backdrop,
        language: validatedData.language, 
        tmdbId: validatedData.tmdbId || null,
        imdbId: validatedData.imdbId,
      },
    });

    return this.mapToMovieResponse(movie);
  }

  /**
   * Get a movie by ID with optional user-specific information
   */

  async getMovieById(id: string, userId?: string): Promise<MovieResponseDto | null> {
    const movie = await prisma.movie.findUnique({
      where: { id },  
      include: {
        ratings: true,
        userMovies: userId ? {
          where: { userId }
        } : false
      }
    });

    if (!movie) {
      return null;
    }

    return this.mapToMovieResponse(movie, userId);
  }

  private mapToMovieResponse(movie: any, userId?: string): MovieResponseDto {
    const ratings = movie.ratings || [];
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / totalRatings 
      : null;

    // Extract user-specific information
    const userMovie = userId && movie.userMovies?.find((um: any) => um.userId === userId);
    const userRating = userId ? ratings.find((r: any) => r.userId === userId)?.rating : undefined;

    const baseResponse = {
      title: movie.title,
      id: movie.id,
      description: movie.description || '',
      releaseYear: movie.year || 0,
      runtime: movie.duration,
      rating: movie.rating,
      genre: movie.genre ? movie.genre.split(', ') : [],
      director: movie.director,
      cast: movie.cast,
      poster: movie.posterUrl,
      backdrop: movie.backdropUrl,
      trailerUrl: movie.trailerUrl,
      averageRating: averageRating ? Number(averageRating.toFixed(1)) : undefined,
      totalRatings,
      tmdbId: movie.tmdbId?.toString(),
      imdbId: movie.imdbId,
      downloadPath: movie.downloadPath,
      fileSize: movie.fileSize ? Number(movie.fileSize) : undefined,
      downloaded: movie.downloaded,
      downloading: movie.downloading,
      downloadProgress: movie.downloadProgress,
      lastAccessed: movie.lastAccessed,
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
    };

    // Add user-specific fields only when userId is provided
    if (userId && userMovie) {
      return {
        ...baseResponse,
        inLibrary: !!userMovie.watchlist,
        inFavorite: !!userMovie.favorite,
        isWatched: !!userMovie.watched,
        userRating
      };
    }

    return baseResponse;
  }

  /**
   * Enrich external movies with user-specific information (inLibrary, inFavorite, isWatched)
   */
  private async enrichExternalMoviesWithUserInfo(movies: ExternalMovieData[], userId?: string): Promise<ExternalMovieData[]> {
    
    if (!userId) {
      return movies;
    }

    const tmdbIds = movies.map(movie => movie.tmdbId).filter(id => id > 0);

    if (tmdbIds.length === 0) {
      return movies;
    }

    try {
      const userMovies = await prisma.userMovie.findMany({
        where: {
          userId: userId,
          movie: {
            tmdbId: {
              in: tmdbIds
            }
          }
        },
        select: {
          watched: true,
          favorite: true,
          watchlist: true,
          movie: {
            select: {
              tmdbId: true
            }
          }
        }
      });

      const userMovieMap = new Map<number, { inLibrary: boolean; inFavorite: boolean; isWatched: boolean; }>();
      userMovies.forEach((um: any) => {
        if (um.movie.tmdbId) {
          userMovieMap.set(um.movie.tmdbId, {
            inLibrary: um.watchlist,
            inFavorite: um.favorite,
            isWatched: um.watched
          });
        }
      });

      // Enrich movies with user information
      return movies.map(movie => ({
        ...movie,
        inLibrary: userMovieMap.get(movie.tmdbId)?.inLibrary || false,
        inFavorite: userMovieMap.get(movie.tmdbId)?.inFavorite || false,
        isWatched: userMovieMap.get(movie.tmdbId)?.isWatched || false,
      }));

    } catch (error) {
      logger.warn('Failed to enrich movies with user info:', error);
      return movies; // Return original movies on error
    }
  }

  /**
   * Get movies from external APIs (includes streaming sources)
   */
  async getExternalMovies(options: any, userId?: string): Promise<{
    movies: ExternalMovieData[];
    totalResults: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const results = await this.externalMovieService.getMovies(options);

      const moviesWithSources = await Promise.all(
        results.movies.map(async (movie) => {
          if (movie.imdbId) {
            try {
              const streamingData = await this.externalMovieService.getStreamingDataForMovie(movie.imdbId);
              if (streamingData.bestTorrent) {
                return {
                  ...movie,
                  sources: streamingData
                };
              }
            } catch (error) {
              logger.warn(`Failed to get streaming data for movie ${movie.title}:`, error);
              return movie;
            }
          }
          return movie;
        })
      );

      // Enrich with user-specific information
      const enrichedMovies = await this.enrichExternalMoviesWithUserInfo(moviesWithSources, userId);
      
      return {
        movies: enrichedMovies,
        totalResults: results.totalResults,
        totalPages: results.totalPages,
        currentPage: results.currentPage,
      };
    } catch (error) {
      logger.error('External movie search error:', error);
      throw new Error('Failed to search external movies');
    }
  }

  // ==========================================
  // EXTERNAL API INTEGRATION
  // ==========================================

  /**
   * Search external movies (with title, year, genre, cast, director filters)
   */
  async searchExternalMovies(options: MovieSearchOptions, userId?: string): Promise<{
    movies: ExternalMovieData[];
    totalResults: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const results = await this.externalMovieService.searchMovies(options);
      const enrichedMovies = await this.enrichExternalMoviesWithUserInfo(results.movies, userId);
      return {
        movies: enrichedMovies,
        totalResults: results.totalResults,
        totalPages: results.totalPages,
        currentPage: results.currentPage,
      };
    } catch (error) {
      logger.error('External movie search error:', error);
      throw new Error('Failed to search external movies');
    }
  }

  /**
   * Get popular movies from external APIs (with streaming sources)
   */
  async getExternalPopularMovies(page: number = 1, limit: number = 20, userId?: string): Promise<{
    movies: ExternalMovieData[];
    totalResults: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const options : MovieFetchOptions = {
        page,
        limit,
        sortBy: 'popularity' as 'popularity' | 'rating' | 'year' | 'title',
        genre: 'all',
      };
      const results = await this.externalMovieService.getMovies(options);
      const enrichedMovies = await this.enrichExternalMoviesWithUserInfo(results.movies, userId);
      
      return {
        movies: enrichedMovies,
        totalResults: results.totalResults,
        totalPages: results.totalPages,
        currentPage: results.currentPage,
      };
    } catch (error) {
      logger.error('External popular movies error:', error);
      throw new Error('Failed to fetch popular movies');
    }
  }

  /**
   * Get top rated movies from external APIs (with streaming sources)
   */
  async getExternalTopRatedMovies(page: number = 1, limit: number = 20, userId?: string): Promise<{
    movies: ExternalMovieData[];
    totalResults: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const results = await this.externalMovieService.getTopRatedMovies(page, limit);
      // Enrich with user-specific information
      const enrichedMovies = await this.enrichExternalMoviesWithUserInfo(results.movies, userId);

      return {
        movies: enrichedMovies,
        totalResults: results.totalResults,
        totalPages: results.totalPages,
        currentPage: results.currentPage,
      };
    } catch (error) {
      logger.error('External top rated movies error:', error);
      throw new Error('Failed to fetch top rated movies');
    }
  }

  /**
   * Get trending movies from external APIs (with streaming sources)
   */
  async getExternalTrendingMovies(page: number = 1, limit: number = 20, timeWindow: 'day' | 'week' = 'week', userId?: string): Promise<{
    movies: ExternalMovieData[];
    totalResults: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const results = await this.externalMovieService.getTrendingMovies(timeWindow, page);
      // Enrich with user-specific information
      const enrichedMovies = await this.enrichExternalMoviesWithUserInfo(results.movies, userId);

      return {
        movies: enrichedMovies,
        totalResults: results.totalResults,
        totalPages: results.totalPages,
        currentPage: results.currentPage,
      };
    } catch (error) {
      logger.error('External trending movies error:', error);
      throw new Error('Failed to fetch trending movies');
    }
  }

  /**
   * Get enriched movie details from external APIs with internal ratings
   */
  async getExternalMovieDetails(tmdbId: number, userId?: string): Promise<EnrichedMovieData> {
    try {
      const movieData = await this.externalMovieService.getEnrichedMovieData(tmdbId);

      if (!movieData) {
        throw new Error('Movie not found in external sources');
      }
      
      // Check if movie exists locally and add internal rating data
      const localMovie = await prisma.movie.findFirst({
        where: { 
          OR: [
            { id: `${tmdbId}` },
            { tmdbId: tmdbId }
          ]
        },
        include: {
          ratings: true,
          userMovies: userId ? { where: { userId } } : false
        }
      });

      // If movie exists locally, enrich with database data
      if (localMovie) {
        const mappedMovie = this.mapToMovieResponse(localMovie, userId);
        return {
          ...movieData,
          averageRating: mappedMovie.averageRating,
          totalRatings: mappedMovie.totalRatings,
          ...(userId && {
            inLibrary: mappedMovie.inLibrary,
            inFavorite: mappedMovie.inFavorite,
            isWatched: mappedMovie.isWatched,
            userRating: mappedMovie.userRating
          })
        };
      }
      
      // If not found locally but userId provided, enrich with user info
      if (userId) {
        const enrichedMovies = await this.enrichExternalMoviesWithUserInfo([movieData], userId);
        return enrichedMovies[0];
      }
      
      return movieData;
    } catch (error) {
      logger.error('External movie details error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT') || error.message.includes('ENETUNREACH')) {
          throw new AppError('Movie details temporarily unavailable. Please try again later.', 503);
        }
        if (error.message.includes('404')) {
          throw new AppError('Movie not found', 404);
        }
      }
      
      throw new AppError('Failed to fetch movie details', 500);
    }
  }

  /**
   * Import movie from external API to local database and add to user's library
   */
  async importMovieFromExternal(tmdbId: number, userId?: string): Promise<MovieResponseDto> {
    try {
      // Get enriched data with streaming sources from external APIs
      const externalData = await this.externalMovieService.getEnrichedMovieData(tmdbId);

      // Check if movie already exists using the TMDB-based ID format
      const tmdbBasedId = `${externalData.tmdbId}`;
      let existingMovie = await prisma.movie.findFirst({
        where: { 
          OR: [
            { id: tmdbBasedId }, // Check by TMDB-based ID first
            { tmdbId: parseInt(externalData.id) } // Fallback to tmdbId field for legacy entries
          ]
        },
      });

      let movie: any;
      if (existingMovie) {
        movie = existingMovie;
        logger.info(`Movie ${externalData.title} already exists in database with ID ${existingMovie.id}`);
      } else {
        // Create movie in database using TMDB ID as primary key
        const movieId = `${externalData.tmdbId}`;
        
        const movieData: CreateMovieDto = {
          id: movieId, // Use TMDB-based ID as primary key
          rating: externalData.rating,
          title: externalData.title,
          description: externalData.description,
          releaseYear: externalData.releaseYear,
          runtime: externalData.runtime,
          genre: externalData.genres,
          director: externalData.director,
          language: externalData.language,
          cast: externalData.cast,
          country: externalData.country,
          poster: externalData.poster || undefined,
          backdrop: externalData.backdrop || undefined,
          tmdbId: externalData.tmdbId, // Store the actual TMDB ID as integer
          imdbId: externalData.imdbId,
        };

        movie = await this.createMovieRecord(movieData);
        logger.info(`Created new movie ${externalData.title} with ID ${movie.id}`);
        
        // Save movie sources (torrents, subtitles) to database if available
        if (externalData.sources) {
          await this.externalMovieService.saveMovieSources(movie.id, externalData.sources);
          
          // Fetch updated movie data to include trailer URL
          const updatedMovie = await prisma.movie.findUnique({
            where: { id: movie.id }
          });
          if (updatedMovie) {
            movie = updatedMovie;
          }
        }
      }

      return this.mapToMovieResponse(movie);
    } catch (error) {
      logger.error('Import movie error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to import movie from external API: ${errorMessage}`);
    }
  }

  // ==========================================
  // USER LIBRARY MANAGEMENT
  // ==========================================

  /**
   * Unified method to handle all UserMovie interactions (library, favorites, watched status)
   * Automatically imports movie if it doesn't exist in database
   */
  private async updateUserMovieInteraction(
    userId: string, 
    movieId: string, 
    updates: {
      watched?: boolean;
      favorite?: boolean;
      watchlist?: boolean;
    },
    importIfMissing: boolean = true
  ): Promise<void> {
    try {
      // Check if movie exists in database
      const movieExists = await prisma.movie.findUnique({
        where: { id: movieId },
        select: { id: true }
      });

      // If movie doesn't exist and import is enabled, try to import it
      if (!movieExists && importIfMissing) {
        // Try to parse as TMDB ID and import
        const tmdbId = parseInt(movieId);
        if (!isNaN(tmdbId)) {
          try {
            await this.importMovieFromExternal(tmdbId);
          } catch (importError) {
            logger.warn(`Failed to import movie ${movieId}, proceeding with placeholder:`, importError);
            // Create placeholder if import fails
            await this.findOrCreateMovieByExternalId(movieId);
          }
        } else {
          // Create placeholder for non-numeric IDs
          await this.findOrCreateMovieByExternalId(movieId);
        }
      }

      // Create or update UserMovie relationship
      await prisma.userMovie.upsert({
        where: {
          userId_movieId: { userId, movieId }
        },
        update: {
          ...updates,
          updatedAt: new Date()
        },
        create: {
          userId,
          movieId,
          watched: updates.watched ?? false,
          favorite: updates.favorite ?? false,
          watchlist: updates.watchlist ?? false,
        }
      });
    } catch (error) {
      logger.error('Update user movie interaction error:', error);
      throw new Error(`Failed to update movie interaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add movie to user's library by TMDB ID - imports if doesn't exist
   */
  async addMovieToLibraryByTmdbId(userId: string, tmdbId: number): Promise<MovieResponseDto> {
    try {
      // Try to find existing movie
      const existingMovie = await prisma.movie.findFirst({
        where: { tmdbId: tmdbId },
        select: { id: true, title: true }
      });

      let movieId: string;
      
      if (existingMovie) {
        movieId = existingMovie.id;
        logger.info(`Using existing movie: ${existingMovie.title}`);
      } else {
        logger.info(`Importing new movie with TMDB ID: ${tmdbId}`);
        const importedMovie = await this.importMovieFromExternal(tmdbId);
        movieId = importedMovie.id;
      }

      // Add to user's library
      await this.addMovieToUserLibrary(userId, movieId);
      
      // Return movie with user data
      const movie = await this.getMovieById(movieId, userId);
      if (!movie) {
        throw new Error('Failed to retrieve movie');
      }
      
      return movie;
    } catch (error) {
      logger.error(`Add movie to library error (tmdbId: ${tmdbId}):`, error);
      throw new Error(`Failed to add movie to library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add movie to user's library (creates UserMovie relationship)
   */
  async addMovieToUserLibrary(userId: string, movieId: string): Promise<void> {
    await this.updateUserMovieInteraction(userId, movieId, { watchlist: true });
    logger.info(`Added movie ${movieId} to library for user ${userId}`);
  }

  /**
   * Create movie record in database (helper method)
   */
  private async createMovieRecord(movieData: CreateMovieDto): Promise<any> {
    try {
      const movie = await prisma.movie.create({
        data: {
          ...(movieData.id && { id: movieData.id }),
          title: movieData.title,
          description: movieData.description,
          rating: movieData.rating,
          year: movieData.releaseYear,
          duration: movieData.runtime,
          genre: Array.isArray(movieData.genre) ? movieData.genre.join(', ') : movieData.genre,
          director: movieData.director,
          language: movieData.language,
          posterUrl: movieData.poster,
          country: movieData.country,
          backdropUrl: movieData.backdrop,
          tmdbId: movieData.tmdbId ? Number(movieData.tmdbId) : null,
          imdbId: movieData.imdbId,
          // Add cast creation here
        },
      });

      logger.info(`Successfully created movie record: ${movie.title} (ID: ${movie.id})`);
      return movie;
    } catch (error) {
      logger.error('Create movie record error:', error);
      throw new Error(`Failed to create movie record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's movie library with filtering options
   */
  async getUserMovieLibrary(userId: string, options: {
    watchlist?: boolean;
    watched?: boolean;
    favorite?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    movies: MovieResponseDto[];
    total: number;
  }> {
    try {
      const where: any = { userId };
      
      if (options.watchlist !== undefined) where.watchlist = options.watchlist;

      const [userMovies, total] = await Promise.all([
        prisma.userMovie.findMany({
          where: {
            userId,
            watchlist: true
          },
          include: {
            movie: true
          },
          orderBy: { createdAt: 'desc' },
          take: options.limit || 50,
          skip: options.offset || 0
        }),
        prisma.userMovie.count({
          where: {
            userId,
            watchlist: true
          }
        })
      ]);

      const movies = userMovies.map((um: any) => this.mapToMovieResponse(um.movie));

      return { movies, total };
    } catch (error) {
      logger.error('Get user movie library error:', error);
      throw new Error('Failed to get user movie library');
    }
  }

  /**
   * Remove movie from user's library
   */
  async removeMovieFromUserLibrary(userId: string, movieId: string): Promise<void> {
    await this.removeMovieFromLibrary(userId, movieId);
  }

  /**
   * Add movie to user's favorites
   */
  async addMovieToFavourite(userId: string, movieId: string, options:{
    favorite?: boolean;
  } = {
    favorite: true,
  }): Promise<MovieResponseDto> {
    try {
      // Update user movie interaction with favorite status
      await this.updateUserMovieInteraction(userId, movieId, options);
      
      // Return updated movie with user data
      const movie = await this.getMovieById(movieId, userId);
      if (!movie) {
        throw new Error('Movie not found after update');
      }

      logger.info(`Updated favorite status for movie ${movieId} for user ${userId}`);
      return movie;
    } catch (error) {
      logger.error('Add movie to favourite error:', error);
      throw new Error('Failed to add movie to favourite');
    }
  }

  /**
   * Remove movie from user's favorites
   */
  async DeleteFromFavourite(userId: string, movieId: string): Promise<MovieResponseDto> {
    try {
      await this.removeMovieFromFavorites(userId, movieId);
      
      // Return updated movie with user data
      const movie = await this.getMovieById(movieId, userId);
      if (!movie) {
        throw new Error('Movie not found after update');
      }

      return movie;
    } catch (error) {
      logger.error('Remove movie from favourite error:', error);
      throw new Error('Failed to remove movie from favourite');
    }
  }

  /**
   * Update user movie status (watched, favorite, watchlist)
   */
  async updateUserMovieStatus(userId: string, movieId: string, updates: {
    watched?: boolean;
    favorite?: boolean;
    watchlist?: boolean;
  }): Promise<void> {
    await this.updateUserMovieInteraction(userId, movieId, updates);
  }
  
  /**
   * Get user's favorite movies with pagination
   */
  async getFavorites(userId: string, limit: number = 20, offset: number = 0): Promise<{
    movies: MovieResponseDto[];
    total: number;
  }> {
    try {
      const [userMovies, total] = await Promise.all([
        prisma.userMovie.findMany({
          where: {
            userId,
            favorite: true
          },
          include: {
            movie: true
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.userMovie.count({
          where: {
            userId,
            favorite: true
          }
        })
      ]);

      const movies = userMovies.map((um: any) => this.mapToMovieResponse(um.movie, userId));

      return { movies, total };
    } catch (error) {
      logger.error('Get favorite movies error:', error);
      throw new Error('Failed to get favorite movies');
    }
  }

  /**
   * Health check for external movie APIs
   */
  async checkExternalAPIsHealth(): Promise<{ tmdb: boolean; yts: boolean }> {
    try {
      return await this.externalMovieService.healthCheck();
    } catch (error) {
      logger.error('External APIs health check error:', error);
      return { tmdb: false, yts: false };
    }
  }

  /**
   * Mark a movie as watched for a user
   */
  async markMovieAsWatched(userId: string, movieId: string): Promise<void> {
    await this.updateUserMovieInteraction(userId, movieId, { watched: true });
    logger.info(`Marked movie ${movieId} as watched for user ${userId}`);
  }

  /**
   * Remove movie from user's favorites
   */
  async removeMovieFromFavorites(userId: string, movieId: string): Promise<void> {
    await this.updateUserMovieInteraction(userId, movieId, { favorite: false }, false);
    logger.info(`Removed movie ${movieId} from favorites for user ${userId}`);
  }

  /**
   * Remove movie from user's library/watchlist
   */
  async removeMovieFromLibrary(userId: string, movieId: string): Promise<void> {
    await this.updateUserMovieInteraction(userId, movieId, { watchlist: false }, false);
    logger.info(`Removed movie ${movieId} from library for user ${userId}`);
  }

  /**
   * Mark movie as unwatched
   */
  async markMovieAsUnwatched(userId: string, movieId: string): Promise<void> {
    await this.updateUserMovieInteraction(userId, movieId, { watched: false }, false);
    logger.info(`Marked movie ${movieId} as unwatched for user ${userId}`);
  }

  /**
   * Handle movie interaction when user rates a movie
   * This ensures UserMovie record exists when rating is created
   */
  async handleMovieRatingInteraction(userId: string, movieId: string): Promise<void> {
    await this.updateUserMovieInteraction(userId, movieId, {});
    logger.info(`Created/updated UserMovie record for rating on movie ${movieId} by user ${userId}`);
  }

  /**
   * Update user's last access time for a movie (during streaming/downloading)
   */
  async updateUserMovieLastAccessed(userId: string, movieId: string): Promise<void> {
    try {
      // Update UserMovie lastAccessed without changing other statuses
      await prisma.userMovie.update({
        where: {
          userId_movieId: { userId, movieId }
        },
        data: {
          updatedAt: new Date()
        }
      });
    } catch (error) {
      // If UserMovie doesn't exist, create it to track engagement
      try {
        await this.updateUserMovieInteraction(userId, movieId, {}, false);
      } catch (createError) {
        logger.error(`Failed to update/create UserMovie last accessed for ${movieId}:`, createError);
      }
    }
  }

  /**
   * Import movie from external API with torrent metadata
   */
  async importMovieFromExternalWithTorrentData(
    tmdbId: number, 
    torrentMetadata: {
      downloadPath: string;
      fileSize: bigint;
      downloaded: boolean;
      downloading: boolean;
      downloadProgress: number;
      lastAccessed: Date;
    },
    userId?: string
  ): Promise<MovieResponseDto> {
    try {
      const externalData = await this.externalMovieService.getEnrichedMovieData(tmdbId);
      const movieId = `${externalData.tmdbId}`;

      // Check if movie already exists
      const existingMovie = await prisma.movie.findFirst({
        where: { 
          OR: [
            { id: movieId },
            { tmdbId: parseInt(externalData.id) }
          ]
        },
      });

      let movie: any;
      if (existingMovie) {
        // Update existing movie with torrent metadata
        movie = await prisma.movie.update({
          where: { id: existingMovie.id },
          data: {
            ...torrentMetadata,
            updatedAt: new Date()
          }
        });
        logger.info(`Updated movie ${externalData.title} with torrent metadata`);
      } else {
        // Create basic movie data
        const movieData: CreateMovieDto = {
          id: movieId,
          rating: externalData.rating,
          title: externalData.title,
          description: externalData.description,
          releaseYear: externalData.releaseYear,
          runtime: externalData.runtime,
          genre: externalData.genres,
          director: externalData.director,
          language: externalData.language,
          cast: externalData.cast,
          country: externalData.country,
          poster: externalData.poster || undefined,
          backdrop: externalData.backdrop || undefined,
          tmdbId: externalData.tmdbId,
          imdbId: externalData.imdbId,
        };

        // Create movie with both basic data and torrent metadata
        movie = await prisma.movie.create({
          data: {
            ...(movieData.id && { id: movieData.id }),
            title: movieData.title,
            description: movieData.description,
            rating: movieData.rating,
            year: movieData.releaseYear,
            duration: movieData.runtime,
            genre: Array.isArray(movieData.genre) ? movieData.genre.join(', ') : movieData.genre,
            director: movieData.director,
            language: movieData.language,
            posterUrl: movieData.poster,
            country: movieData.country,
            backdropUrl: movieData.backdrop,
            tmdbId: movieData.tmdbId ? Number(movieData.tmdbId) : null,
            imdbId: movieData.imdbId,
            // Add torrent metadata
            downloadPath: torrentMetadata.downloadPath,
            fileSize: torrentMetadata.fileSize,
            downloaded: torrentMetadata.downloaded,
            downloading: torrentMetadata.downloading,
            downloadProgress: torrentMetadata.downloadProgress,
            lastAccessed: torrentMetadata.lastAccessed,
          },
        });
        
        logger.info(`Created new movie ${externalData.title} with torrent metadata`);
        
        // Save movie sources if available
        if (externalData.sources) {
          await this.externalMovieService.saveMovieSources(movie.id, externalData.sources);
          
          // Refresh movie data
          const updatedMovie = await prisma.movie.findUnique({
            where: { id: movie.id }
          });
          if (updatedMovie) {
            movie = updatedMovie;
          }
        }
      }

      return this.mapToMovieResponse(movie);
    } catch (error) {
      logger.error('Import movie with torrent data error:', error);
      throw new Error('Failed to import movie with torrent data');
    }
  }

  /**
   * Update movie torrent metadata
   */
  async updateMovieTorrentData(
    movieId: string, 
    torrentMetadata: {
      downloadPath: string;
      fileSize: bigint;
      downloaded: boolean;
      downloading: boolean;
      downloadProgress: number;
      lastAccessed: Date;
    }
  ): Promise<void> {
    try {
      await prisma.movie.update({
        where: { id: movieId },
        data: {
          downloadPath: torrentMetadata.downloadPath,
          fileSize: torrentMetadata.fileSize,
          downloaded: torrentMetadata.downloaded,
          downloading: torrentMetadata.downloading,
          downloadProgress: torrentMetadata.downloadProgress,
          lastAccessed: torrentMetadata.lastAccessed,
          updatedAt: new Date()
        }
      });
      logger.info(`Updated torrent metadata for movie ${movieId}`);
    } catch (error) {
      logger.error('Update movie torrent data error:', error);
      throw new Error('Failed to update movie torrent data');
    }
  }

  /**
   * Update movie download progress
   */
  async updateMovieDownloadProgress(movieId: string, progress: number): Promise<void> {
    try {
      await prisma.movie.update({
        where: { id: movieId },
        data: {
          downloadProgress: progress,
          lastAccessed: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Update movie download progress error:', error);
      throw new Error('Failed to update movie download progress');
    }
  }

  /**
   * Mark movie as downloaded
   */
  async markMovieAsDownloaded(movieId: string): Promise<void> {
    try {
      await prisma.movie.update({
        where: { id: movieId },
        data: {
          downloaded: true,
          downloading: false,
          downloadProgress: 100,
          lastAccessed: new Date(),
          updatedAt: new Date()
        }
      });
      logger.info(`Marked movie ${movieId} as downloaded`);
    } catch (error) {
      logger.error('Mark movie as downloaded error:', error);
      throw new Error('Failed to mark movie as downloaded');
    }
  }

  /**
   * Reset movie download state (cleanup)
   */
  async resetMovieDownloadState(movieId: string): Promise<void> {
    try {
      await prisma.movie.update({
        where: { id: movieId },
        data: {
          downloaded: false,
          downloading: false,
          downloadProgress: 0,
          updatedAt: new Date()
        }
      });
      logger.info(`Reset download state for movie ${movieId}`);
    } catch (error) {
      logger.error('Reset movie download state error:', error);
      throw new Error('Failed to reset movie download state');
    }
  }

  /**
   * Update movie lastAccessed timestamp
   */
  async updateMovieLastAccessed(movieId: string): Promise<void> {
    try {
      await prisma.movie.update({
        where: { id: movieId },
        data: {
          lastAccessed: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Update movie last accessed error:', error);
      // Don't throw error for this non-critical update
    }
  }

  /**
   * Find movie by external ID (TMDB, IMDB) or create if doesn't exist
   */
  async findOrCreateMovieByExternalId(externalId: string): Promise<{ id: string; title: string, downloaded?: boolean }> {
    try {
      // Try to find existing movie
      const movie = await prisma.movie.findFirst({
        where: {
          OR: [
            { id: externalId },
            { tmdbId: parseInt(externalId) || undefined },
            { imdbId: externalId },
            { id: `${externalId}` }
          ]
        },
        select: { id: true, title: true, downloaded: true }
      });

      if (movie) {
        return movie;
      }

      // If numeric, try importing from TMDB
      if (/^\d+$/.test(externalId)) {
        try {
          const importedMovie = await this.importMovieFromExternal(parseInt(externalId));
          return { id: importedMovie.id, title: importedMovie.title };
        } catch (error) {
          logger.warn(`Failed to import movie with TMDB ID ${externalId}:`, error);
        }
      }

      // Create placeholder as fallback
      const placeholderMovie = await prisma.movie.create({
        data: {
          id: externalId,
          title: `Movie ${externalId}`,
          tmdbId: /^\d+$/.test(externalId) ? parseInt(externalId) : undefined,
          imdbId: externalId.startsWith('tt') ? externalId : undefined,
        },
        select: { id: true, title: true }
      });

      logger.info(`Created placeholder movie record for external ID ${externalId}`);
      return placeholderMovie;
    } catch (error) {
      logger.error('Find or create movie by external ID error:', error);
      throw new Error(`Failed to find or create movie with external ID: ${externalId}`);
    }
  }

  /**
   * Get watched movies for a user
   */
  async getWatchedMovies(userId: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{
    movies: MovieResponseDto[];
    total: number;
  }> {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const [userMovies, total] = await Promise.all([
        prisma.userMovie.findMany({
          where: {
            userId,
            watched: true
          },
          include: {
            movie: true
          },
          skip,
          take: limit,
          orderBy: {
            updatedAt: 'desc'
          }
        }),
        prisma.userMovie.count({
          where: {
            userId,
            watched: true
          }
        })
      ]);

      const movies = userMovies.map((um: any) => this.mapToMovieResponse(um.movie, userId));

      return { movies, total };
    } catch (error) {
      logger.error('Get watched movies error:', error);
      throw new Error('Failed to get watched movies');
    }
  }

  // ==========================================
  // CRON JOB CLEANUP METHODS
  // ==========================================

  /**
   * Cleanup old download files (for cron job)
   */
  async cleanupOldDownloads(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');

      const downloadPath = path.join(process.cwd(), 'downloads');

      if (!fs.existsSync(downloadPath)) {
        logger.info('Downloads directory does not exist, skipping cleanup');
        return;
      }

      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const files = fs.readdirSync(downloadPath);
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(downloadPath, file);
        // Assume file or directory name is the movieId
        const movieId = file;
        try {
          const movie = await prisma.movie.findUnique({ where: { id: movieId } });
          if (!movie) {
            logger.warn(`No movie found in DB for download dir/file: ${file}`);
            continue;
          }
          // Use lastAccessed from DB, fallback to file mtime if missing
          const lastAccessedRaw = movie.lastAccessed;
          const lastAccessed = typeof lastAccessedRaw === 'string' ? new Date(lastAccessedRaw) : lastAccessedRaw;
          if (lastAccessed && lastAccessed < oneHourAgo) {
            if (fs.statSync(filePath).isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(filePath);
            }
            // Reset DB state
            await this.resetMovieDownloadState(movieId);
            cleanedCount++;
            logger.info(`Removed old download for movieId ${movieId} (lastAccessed: ${lastAccessed})`);
          }
        } catch (err) {
          logger.warn(`Failed to process or delete ${filePath}:`, err);
        }
      }

      logger.info(`Cleaned up ${cleanedCount} old download files`);
    } catch (error) {
      logger.error('Failed to cleanup old downloads:', error);
      throw error;
    }
  }
}
