import { Request, Response, NextFunction } from 'express';
import { getService } from '@/shared/core/service-container';
import { MovieService } from '@/services/movie.service';
import { RatingService } from '@/services/rating.service';
import { 
  UserResponseDto,
  CreateRatingDto,
} from '@/shared/types/dtos';
import { logger } from '@/shared/utils/logger';
import { MovieSearchOptions } from '@/services/external/external-movie.service';
import { sanitizeInput, searchOptionsSchema } from '@/shared/validation/movie.validation';

export interface MovieQuery {
  page?: string;
  limit?: string;
  search?: string;
  genre?: string;
  year?: string;
  sortBy?: 'title' | 'releaseYear' | 'averageRating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  minRating?: string;
}

export interface SearchExternalQuery {
  title?: string;
  year?: string;
  genre?: string;
  page?: string;
  limit?: string;
  sortBy?: 'popularity' | 'rating' | 'year' | 'title';
  minRating?: string;
  maxRating?: string;
  minYear?: string;
  maxYear?: string;
}

export class MovieController {
  private movieService: MovieService;
  private ratingService: RatingService;

  constructor() {
    this.movieService = getService<MovieService>('MovieService');
    this.ratingService = getService<RatingService>('RatingService');
  }

  /**
   * Get a movie by ID
   * GET /api/movies/:id
   */
  async getMovieById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user as UserResponseDto | undefined;
      
      const movie = await this.movieService.getMovieById(id, user?.id);
      
      if (!movie) {
        res.status(404).json({ 
          message: 'Movie not found' 
        });
        return;
      }
      
      res.json(movie);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Rate a movie
   * POST /api/movies/:id/rate
   */
  async rateMovie(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: movieId } = req.params;
      const { rating } = req.body; 
      const user = (req as any).user as UserResponseDto;
      
      if (!user) {
        res.status(401).json({ 
          message: 'Authentication required' 
        });
        return;
      }
      
      const ratingData: CreateRatingDto = {
        userId: user.id,
        movieId,
        rating: Math.round(rating)
      };

      const movie = await this.movieService.findOrCreateMovieByExternalId(movieId);

      if (!movie) {
        res.status(404).json({ 
          message: 'Movie not found in external APIs' 
        });
        return;
      }
      
      const result = await this.ratingService.createOrUpdateRating(user.id, ratingData);
      
      res.json({
        message: 'Movie rated successfully',
        rating: result
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ 
          message: 'Movie not found' 
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get movie ratings
   * GET /api/movies/:id/ratings
   */
  async getMovieRatings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: movieId } = req.params;      
      const result = await this.ratingService.getMovieRatings(movieId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear user's rating for a movie
   * POST /api/movies/:id/clear-rating
   */
  async clearRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: movieId } = req.params;
      const user = (req as any).user as UserResponseDto;

      if (!user) {
        res.status(401).json({
          message: 'Authentication required'
        });
        return;
      }

      await this.ratingService.clearRating(user.id, movieId);

      res.json({
        message: 'Rating cleared successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's rating for a movie
   * GET /api/movies/:id/ratings/me
   */
  async getUserMovieRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: movieId } = req.params;
      const user = (req as any).user as UserResponseDto;
      
      if (!user) {
        res.status(401).json({ 
          message: 'Authentication required' 
        });
        return;
      }
      
      const rating = await this.ratingService.getUserMovieRating(user.id, movieId);
      
      if (!rating) {
        res.status(404).json({ 
          message: 'No rating found' 
        });
        return;
      }
      
      res.json(rating);
    } catch (error) {
      next(error);
    }
  }


  /**
   * Health check for external APIs
   */
  async healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const apiHealth = await this.movieService.checkExternalAPIsHealth();
      res.json({
        module: 'movies',
        status: 'OK',
        externalAPIs: apiHealth
      });
    } catch (error) {
      res.status(500).json({
        module: 'movies',
        status: 'ERROR',
        error: 'Failed to check API health'
      });
    }
  }

  /**
   * Get movies from external APIs
   * /api/movies
   */
  async getExternalMovies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        sortBy = 'popularity',
        genre = 'all'
      } = req.query as SearchExternalQuery;

      const userId = (req as any).user?.id;

      const searchOptions = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as 'popularity' | 'rating' | 'year' | 'title',
        genre
      };

      const results = await this.movieService.getExternalMovies(searchOptions, userId);
      res.json(results);
    } catch (error) {
      logger.error('External movie search error:', error);
      next(error);
    }
  }

  /**
   * Search movies from external APIs by query (title, genre, year, cast, director)
   * /api/movies/search
  */
  async searchExternalMovies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        year,
        genre,
        page = '1',
        limit = '20',
        title,
        cast,
        director,
        sortBy = 'popularity',
      }  = req.query;

      const options: MovieSearchOptions = {
        title: title as string | undefined,
        year: year as string | undefined,
        genre: genre as string | undefined,
        cast: cast as string | undefined,
        director: director as string | undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as 'popularity' | 'rating' | 'year' | 'title',
      };
      const userId = (req as any).user?.id;

      const results = await this.movieService.searchExternalMovies(options, userId);
      res.json(results);

    } catch (error) {
      this.handleServiceError(error, res, 'Search failed', 'Unable to search movies at the moment');
    }
  }

  /**
   * Add movie to user's library
   * POST /api/movies/:movieId/add-to-library
   * Supports both database movieId and TMDB ID (will auto-import if TMDB ID)
   */
  async addMovieToLibrary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { movieId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User authentication required' });
        return;
      }
      
      const tmdbId = parseInt(movieId);
      const movie = await this.movieService.addMovieToLibraryByTmdbId(userId, tmdbId)
      
      if (!movie) {
        res.status(404).json({ error: 'Movie could not be added to library' });
        return;
      }
      
      res.json({
        message: 'Movie added to your library successfully',
        movie
      });
    } catch (error: any) {
      this.handleServiceError(error, res, 'Failed to add movie', 'Unable to add movie to library at the moment');
    }
  }

  /**
   * Helper method to handle common service errors consistently
   */
  private handleServiceError(error: any, res: Response, defaultError: string, defaultMessage: string): void {
    logger.error('Service error:', error);
    
    if (!(error instanceof Error)) {
      res.status(500).json({ error: defaultError, message: 'An unexpected error occurred' });
      return;
    }

    const message = error.message;
    
    if (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('ENETUNREACH')) {
      res.status(503).json({ 
        error: 'Service temporarily unavailable',
        message: 'Please try again in a moment'
      });
    } else if (message.includes('rate limit')) {
      res.status(429).json({ 
        error: 'Too many requests',
        message: 'Please wait before trying again'
      });
    } else if (message.includes('not found') || message.includes('does not exist')) {
      res.status(404).json({ 
        error: 'Not found',
        message: 'The requested resource could not be found'
      });
    } else if (message.includes('User ID is required') || message.includes('authentication')) {
      res.status(400).json({ 
        error: 'Invalid request',
        message: 'User authentication is required'
      });
    } else {
      res.status(500).json({ 
        error: defaultError,
        message: defaultMessage
      });
    }
  }

  /**
   * Get popular movies from external APIs
   * /api/movies/popular
   */
  async getExternalPopularMovies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20' } = req.query;
      const userId = (req as any).user?.id;
      const results = await this.movieService.getExternalPopularMovies(
        parseInt(page as string),
        parseInt(limit as string),
        userId
      );

      res.json(results);
    } catch (error) {
      logger.error('External popular movies error:', error);
      next(error);
    }
  }

  /**
   * Get top rated movies from external APIs
   * /api/movies/top-rated
   */
  async getExternalTopRatedMovies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20' } = req.query;
      const userId = (req as any).user?.id;
      const results = await this.movieService.getExternalTopRatedMovies(
        parseInt(page as string),
        parseInt(limit as string),
        userId
      );

      res.json(results);
    } catch (error) {
      logger.error('External top rated movies error:', error);
      next(error);
    }
  }

  /**
   * Get trending movies from external APIs
   * /api/movies/trending
   */
  async getExternalTrendingMovies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20', timeWindow = 'week' } = req.query;
      
      const pageNum = Math.max(1, parseInt(page as string));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
      const validTimeWindow = ['day', 'week'].includes(timeWindow as string) ? timeWindow as 'day' | 'week' : 'week';
      
      // Extract userId from authenticated user (optional)
      const userId = (req as any).user?.id;
      
      const result = await this.movieService.getExternalTrendingMovies(pageNum, limitNum, validTimeWindow, userId);
      
      res.json(result);
    } catch (error) {
      logger.error('External trending movies error:', error);
      next(error);
    }
  }

  /**
   * Get detailed movie information from external APIs
   * /api/movies/:id
   */
  async getExternalMovieDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid TMDB ID' });
        return;
      }

      // Extract userId from authenticated user (optional)
      const userId = (req as any).user?.id;

      const movieDetails = await this.movieService.getExternalMovieDetails(id, userId);
      res.json(movieDetails);
    } catch (error) {
      logger.error('External movie details error:', error);
      // Don't send response here, let error middleware handle it
      next(error);
    }
  }

  /**
   * Remove movie from user's library
   * DELETE /api/movies/:movieId/remove-from-library
   */
  async removeFromLibrary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { movieId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User authentication required' });
        return;
      }

      await this.movieService.removeMovieFromUserLibrary(userId, movieId);
      res.json({ message: 'Movie removed from your library' });
    } catch (error) {
      logger.error('Remove movie from library error:', error);
      next(error);
    }
  }

  /**
   * Get user's movie library
   */
  async getUserLibrary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { watchlist, limit, offset } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'User authentication required' });
        return;
      }

      const options = {
        watchlist: watchlist === 'true' ? true : watchlist === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };

      const result = await this.movieService.getUserMovieLibrary(userId, options);
      res.json(result);
    } catch (error) {
      logger.error('Get user movie library error:', error);
      next(error);
    }
  }

  /**
   * Add movie to user's favourite list
   * POST /api/movies/:movieId/add-to-favourites
   */

  async addMovieToFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { movieId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User authentication required' });
        return;
      }
 
      const movie = await this.movieService.addMovieToFavourite(userId, movieId, {favorite: true});
      res.json({ message: 'Movie added to your favourite list', movie});
    } catch (error) {
      logger.error('Add movie to favourite error:', error);
      next(error);
    }
  }

  /**
   * Remove movie from user's favourite list
   * DELETE /api/movies/:movieId/remove-from-favorites
   */
  async deleteFromFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { movieId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User authentication required' });
        return;
      }
      
      await this.movieService.DeleteFromFavourite(userId, movieId);
      res.json({ message: 'Movie removed from your favourite list' });
    } catch (error) {
      logger.error('Remove movie from favourite error:', error);
      next(error);
    }
  }

  /**
   * Get user's favorite movies
   * GET /api/movies/favorites
   */
  async getFavorites(req: Request, res: Response, next: NextFunction): Promise<void>{
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User authentication required' });
        return;
      }

      const movies = await this.movieService.getFavorites(userId);
      res.json(movies);
    } catch (error) {
      logger.error('Get Favorite movies error:', error);
      next(error);
    }
  }

  /**
   * Mark movie as watched
   * POST /api/movies/:movieId/mark-watched
   */
  async markMovieAsWatched(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { movieId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User authentication required' });
        return;
      }

      await this.movieService.markMovieAsWatched(userId, movieId);
      res.json({ message: 'Movie marked as watched' });
    } catch (error) {
      this.handleServiceError(error, res, 'Failed to mark movie as watched', 'Unable to update watch status');
    }
  }

  /**
   * Mark movie as unwatched
   * POST /api/movies/:movieId/mark-unwatched
   */
  async markMovieAsUnwatched(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { movieId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User authentication required' });
        return;
      }

      await this.movieService.markMovieAsUnwatched(userId, movieId);
      res.json({ message: 'Movie marked as unwatched' });
    } catch (error) {
      this.handleServiceError(error, res, 'Failed to mark movie as unwatched', 'Unable to update watch status');
    }
  }

  /**
   * Update multiple movie statuses at once
   * PATCH /api/movies/:movieId/status
   */
  async updateMovieStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { movieId } = req.params;
      const userId = (req as any).user?.id;
      const { watched, favorite, watchlist } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User authentication required' });
        return;
      }

      await this.movieService.updateUserMovieStatus(userId, movieId, {
        ...(watched !== undefined && { watched }),
        ...(favorite !== undefined && { favorite }),
        ...(watchlist !== undefined && { watchlist })
      });

      res.json({ message: 'Movie status updated successfully' });
    } catch (error) {
      this.handleServiceError(error, res, 'Failed to update movie status', 'Unable to update movie status');
    }
  }
}
