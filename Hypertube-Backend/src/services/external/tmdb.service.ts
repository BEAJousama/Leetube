import axios, { AxiosInstance, AxiosError } from 'axios';
import https from 'https';
import { config } from '@/config/environment';
import { Service, IService } from '@/shared/core/service-container';
import { logger } from '@/shared/utils/logger';
import { MovieSearchOptions } from './external-movie.service';

// TMDB API Response Types
export interface TMDBSearchResult {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  video: boolean;
  original_language: string;
}
export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
  video: boolean;
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number | null;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; name: string }[];
  status: string;
  tagline: string | null;
  budget: number;
  revenue: number;
  imdb_id: string | null;
  homepage: string | null;
  belongs_to_collection: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
}

export interface TMDBCredits {
  id: number;
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

// Normalized Movie Types
export interface ExternalMovieData {
  id: string;
  tmdbId: number;
  imdbId?: string;
  title: string;
  originalTitle: string;
  description: string;
  releaseYear: number;
  runtime?: number;
  genres: string[];
  director?: string;
  cast: any[];
  poster: string | null;
  backdrop: string | null;
  trailerUrl?: string | null;
  rating: number;
  voteCount: number;
  popularity: number;
  language: string;
  country?: string;
  status?: string;
  tagline?: string;
  budget?: number;
  revenue?: number;
  homepage?: string;
  // User-specific fields (populated when userId is provided)
  inLibrary?: boolean;
  inFavorite?: boolean;
  isWatched?: boolean;
  sources?: {
    torrents: Array<{
      quality: string;
      magnet: string;
      seeds: number;
      peers: number;
      size: string;
      hash: string;
    }>;
    bestTorrent: {
      quality: string;
      magnet: string;
      seeds: number;
      peers: number;
      size: string;
      hash: string;
    } | null;
    trailer: string | null;
    hasStreaming: boolean;
  };
}

interface Genre {
  id: number;
  name: string;
}

interface Person {
  id: number;
  name: string;
  known_for_department: string;
  profile_path: string | null;
  popularity: number;
}

interface PersonSearchResult {
  page: number;
  results: Person[];
  total_pages: number;
  total_results: number;
}

@Service()
export class TMDBService implements IService {
  private client: AxiosInstance;
  
  // TMDB Genre ID mapping
  private readonly genreMap: Record<string, number> = {
    'Action': 28,
    'Adventure': 12,
    'Animation': 16,
    'Comedy': 35,
    'Crime': 80,
    'Documentary': 99,
    'Drama': 18,
    'Family': 10751,
    'Fantasy': 14,
    'History': 36,
    'Horror': 27,
    'Music': 10402,
    'Mystery': 9648,
    'Romance': 10749,
    'Sci-Fi': 878,
    'TV Movie': 10770,
    'Thriller': 53,
    'War': 10752,
    'Western': 37
  };

  constructor() {
    this.client = axios.create({
      baseURL: config.apis.tmdb.baseUrl,
      params: {
        api_key: config.apis.tmdb.apiKey,
      },
      family: 4, // Force IPv4 to prevent Alpine Docker DNS hang issues
      httpsAgent: new https.Agent({ 
        keepAlive: true, 
        keepAliveMsecs: 10000,
        timeout: 10000, // socket timeout
        maxSockets: 20, // limit concurrent connections to prevent ETIMEDOUT
        maxFreeSockets: 10
      }),
      headers: {
        'Accept-Encoding': 'identity'
      }
    });

    this.setupRetryInterceptor();
    
    logger.info('TMDB Service initialized');
  }

  private setupRetryInterceptor() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any;
        const maxRetries = parseInt(process.env.TMDB_RETRY_ATTEMPTS || '1'); // Reduced to 1 retry
        const retryDelay = parseInt(process.env.TMDB_RETRY_DELAY || '500'); // Reduced to 500ms
        
        // Initialize retry count if not exists
        if (!config.__retryCount) {
          config.__retryCount = 0;
        }

        // Check if we should retry (only for specific errors)
        const shouldRetry = 
          config.__retryCount < maxRetries &&
          (error.code === 'ETIMEDOUT' || 
           error.code === 'ECONNRESET' ||
           (error.response && [502, 503, 504].includes(error.response.status)));

        if (shouldRetry) {
          config.__retryCount++;
          logger.warn(`TMDB request failed, retrying (${config.__retryCount}/${maxRetries}):`, {
            url: config.url,
            error: error.code || error.message,
            status: error.response?.status
          });

          // Wait before retrying with minimal delay
          await new Promise(resolve => setTimeout(resolve, retryDelay));

          return this.client.request(config);
        }

        // Log the final error with more context
        logger.error('TMDB request failed after retries:', {
          url: config.url,
          error: error.code || error.message,
          status: error.response?.status,
          retries: config.__retryCount || 0
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search for movies by title, or year, or genre, or cast, or director
   */

  async searchMovies({
    title,
    genre,
    year,
    cast,
    director,
    page = 1,
    limit = 20,
    language = 'en-US'
  }: MovieSearchOptions): Promise<TMDBSearchResult> {
    try {
      logger.info("Searching TMDB by title:", title, page, language);

      // If searching by title only, use search endpoint
      if (title && !genre && !year && !cast && !director) {
        return await this.searchMoviesByTitle(title, page, language);
      }

      // For advanced filtering, use discover endpoint
      const discoverParams: any = {
        page,
        language,
        sort_by: 'title.asc',
      };

      // Add year filter with basic validation
      if (year) {
        const yearNum = Number(year);
        if (!isNaN(yearNum) && yearNum >= 1888 && yearNum <= new Date().getFullYear() + 5) {
          discoverParams.primary_release_year = yearNum;
        } else {
          logger.warn(`Invalid year "${year}" provided, continuing search without year filter`);
          return {
            page: 1,
            results: [],
            total_results: 0,
            total_pages: 0
          }
        }
      }

      // Add genre filter (genre)
      if (genre) {
        const genreId = await this.getGenreId(genre);
        if (genreId) {
          discoverParams.with_genres = genreId;
        }
      }

      // Add cast filter
      if (cast) {
        const personId = await this.getPersonId(cast);
        if (personId) {
          discoverParams.with_cast = personId;
        } else {
          // Log warning but continue search - don't fail completely
          logger.warn(`Cast member "${cast}" not found, continuing search without cast filter`);
        }
      }

      // Add director filter
      if (director) {
        const directorId = await this.getPersonId(director);
        if (directorId) {
          discoverParams.with_crew = directorId;
        }
      }

      // Remove title from discover params as discover doesn't support text search
      // We'll filter by title client-side if needed

      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      const response = await this.client.get('/discover/movie', {
        params: {
          ...discoverParams,
          'release_date.lte': todayString,
          'vote_count.gte': 50, // Reduced from 1000 to get more results
          'vote_average.gte': 1, // Reduced from 4 to get more results  
          include_adult: false
        }
      });

      let results = response.data.results;

      // If title is provided with other filters, filter results by title
      if (title) {
        results = results.filter((movie: Movie) =>
          movie.title.toLowerCase().includes(title.toLowerCase()) ||
          movie.original_title.toLowerCase().includes(title.toLowerCase())
        );
      }

      // Apply pagination
      if (limit && results.length > limit) {
        results = results.slice(0, limit);
      }
      
      return {
        ...response.data,
        results
      };

    } catch (error: any) {
      // Log detailed error information for debugging
      if (error.code === 'ETIMEDOUT') {
        logger.error('TMDB movie search timeout:', {
          timeout: error.config?.timeout,
          retries: error.config?.__retryCount || 0,
          params: { title, genre, year, cast, director }
        });
      } else {
        logger.error('TMDB movie search error:', {
          error: error.message,
          code: error.code,
          status: error.response?.status,
          params: { title, genre, year, cast, director }
        });
      }
      throw new Error('Failed to search movies from TMDB');
    }
  }

  async searchMoviesByTitle(
    title: string,
    page: number = 1,
    language: string = 'en-US'
  ): Promise<TMDBSearchResult> {
    try {
      const response = await this.client.get('/search/movie', {
        params: {
          query: title,
          page,
          language
        }
      });

      return response.data;
    } catch (error: any) {
      // Log detailed error information for debugging
      if (error.code === 'ETIMEDOUT') {
        logger.error('TMDB title search timeout:', {
          timeout: error.config?.timeout,
          retries: error.config?.__retryCount || 0,
          title, page, language
        });
      } else {
        logger.error('TMDB title search error:', {
          error: error.message,
          code: error.code,
          status: error.response?.status,
          title, page, language
        });
      }
      throw new Error('Failed to search movies by title from TMDB');
    }
  }

  async getGenres(language: string = 'en-US'): Promise<Genre[]> {
    try {
      const response = await this.client.get('/genre/movie/list', {
        params: { language }
      });

      return response.data.genres;
    } catch (error) {
      logger.error('TMDB genres error:', error);
      throw new Error('Failed to fetch genres from TMDB');
    }
  }

  async searchPerson(
    name: string,
    page: number = 1,
    language: string = 'en-US'
  ): Promise<PersonSearchResult> {
    try {
      const response = await this.client.get('/search/person', {
        params: {
          query: name,
          page,
          language
        }
      });

      return response.data;
    } catch (error) {
      logger.error('TMDB person search error:', error);
      throw new Error('Failed to search person from TMDB');
    }
  }

  // Helper methods
  private async getGenreId(genreName: string): Promise<number | null> {
    try {
      const genres = await this.getGenres();
      const genre = genres.find(g =>
        g.name.toLowerCase() === genreName.toLowerCase()
      );

      return genre ? genre.id : null;
    } catch (error) {
      logger.error('Error getting genre ID:', error);
      return null;
    }
  }

  private async getPersonId(personName: string): Promise<number | null> {
    try {
      const searchResult = await this.searchPerson(personName);
      return searchResult.results[0]?.id || null;
    } catch (error) {
      logger.error('Error getting person ID:', error);
      return null;
    }
  }

  /**
   * Get popular movies
   */
  async getPopularMovies(
    page: number = 1,
    language: string = 'en-US'
  ): Promise<TMDBSearchResult> {
    try {
      const response = await this.client.get('/movie/popular', {
        params: {
          page,
          language,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('TMDB popular movies error:', error);
      throw new Error('Failed to fetch popular movies from TMDB');
    }
  }

    /**
   * Get trending movies
   */
  async getTrendingMovies(
    page: number = 1,
    language: string = 'en-US'
  ): Promise<TMDBSearchResult> {
    try {
      const response = await this.client.get('/movie/popular', {
        params: {
          page,
          language,
          time_window: 'week' // daily or weekly
        },
      });

      return response.data;
    } catch (error) {
      logger.error('TMDB trending movies error:', error);
      throw new Error('Failed to fetch trending movies from TMDB');
    }
  }

  /**
   * Get top rated movies
   */
  async getTopRatedMovies(
    page: number = 1,
    language: string = 'en-US'
  ): Promise<TMDBSearchResult> {
    try {
      const response = await this.client.get('/movie/top_rated', {
        params: {
          page,
          language,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('TMDB top rated movies error:', error);
      throw new Error('Failed to fetch top rated movies from TMDB');
    }
  }

  /**
   * Get movie details by TMDB ID
   */
  async getMovieDetails(
    movieId: number,
    language: string = 'en-US'
  ): Promise<TMDBMovieDetails> {
    try {
      const response = await this.client.get(`/movie/${movieId}`, {
        params: {
          language,
        },
      });
      return response.data;
    } catch (error) {
      logger.error('TMDB movie details error:', error);
      // Check if circuit breaker is open
      if (error instanceof Error && error.message.includes('Circuit breaker is OPEN')) {
        throw new Error('TMDB service is temporarily unavailable. Please try again later.');
      }
      throw new Error('Failed to fetch movie details from TMDB');
    }
  }

  /**
   * Get movie credits (cast and crew)
   */
  async getMovieCredits(movieId: number): Promise<TMDBCredits> {
    try {
      const response = await this.client.get(`/movie/${movieId}/credits`);
      return response.data;
    } catch (error) {
      logger.error('TMDB movie credits error:', error);
      throw new Error('Failed to fetch movie credits from TMDB');
    }
  }

  /**
   * Get movie videos (trailers, teasers, etc.)
   */
  async getMovieVideos(movieId: number): Promise<{
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
      official: boolean;
      published_at: string;
    }>;
  }> {
    try {
      const response = await this.client.get(`/movie/${movieId}/videos`);
      return response.data;
    } catch (error: any) {
      // Log detailed error information
      if (error.code === 'ETIMEDOUT') {
        logger.error(`TMDB movie videos timeout for movie ${movieId}:`, {
          timeout: error.config?.timeout,
          retries: error.config?.__retryCount || 0
        });
      } else {
        logger.error('TMDB movie videos error:', {
          movieId,
          error: error.message,
          code: error.code,
          status: error.response?.status
        });
      }
      return { results: [] };
    }
  }

  /**
   * Discover movies with filters
   */
  async discoverMovies(options: MovieSearchOptions = {}): Promise<TMDBSearchResult> {
    try {
      const params: any = {
        page: options.page || 1,
        language: options.language || 'en-US',
        sort_by: options.sortBy || 'popularity.desc',
        include_adult: false,
        include_video: false,
      };

      // Handle genre parameter correctly for TMDB API
      // Add optional parameters
      if (options.genre && options.genre !== 'all') {
        // Map our genre names to TMDB genre IDs
        const genreId = this.genreMap[options.genre];
        if (genreId) {
          params.with_genres = genreId.toString();
        } else {
          // If it's already a number/string ID, use it directly
          params.with_genres = options.genre;
        }
      }

      // Add other optional parameters
      if (options.year) params.year = options.year;
      // get todays date in YYYY-MM-DD format
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      params['release_date.lte'] = todayString;
      params['vote_count.gte'] = 1000;
      params['vote_average.gte'] = 4;

      logger.info('TMDB request URL:', '/discover/movie');
      logger.info('TMDB request params:', params);

      const response = await this.client.get('/discover/movie', {
        params,
      });

      return response.data;
    } catch (error: any) {
      logger.error('TMDB discover movies error:', error.response?.data || error.message);
      throw new Error('Failed to find movies from TMDB');
    }
  }

  /**
   * Get full poster image URL
   */
  getPosterUrl(posterPath: string | null, size: string = 'w500'): string | null {
    if (!posterPath) return null;
    return `${config.apis.tmdb.imageBaseUrl}/${size}${posterPath}`;
  }

  /**
   * Get full backdrop image URL
   */
  getBackdropUrl(backdropPath: string | null, size: string = 'w1280'): string | null {
    if (!backdropPath) return null;
    return `${config.apis.tmdb.imageBaseUrl}/${size}${backdropPath}`;
  }

  /**
   * Convert TMDB movie data to normalized format
   */
  async normalizeMovieData(tmdbMovie: TMDBMovie, includeDetails: boolean = false): Promise<ExternalMovieData> {
    let details: TMDBMovieDetails | null = null;
    let credits: TMDBCredits | null = null;
    let trailerUrl: string | null = null;

    if (includeDetails) {
      try {
        const [detailsData, creditsData, videosData] = await Promise.all([
          this.getMovieDetails(tmdbMovie.id),
          this.getMovieCredits(tmdbMovie.id),
          this.getMovieVideos(tmdbMovie.id),
        ]);
        
        details = detailsData;
        credits = creditsData;
        
        // Find the best trailer (preferably official, YouTube, type: Trailer)
        const trailer = videosData.results
          .filter(video => video.site === 'YouTube' && video.type === 'Trailer')
          .sort((a, b) => {
            // Prioritize official trailers
            if (a.official && !b.official) return -1;
            if (!a.official && b.official) return 1;
            // Then sort by published date (newest first)
            return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
          })[0];

        trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
      } catch (error) {
        logger.warn(`Failed to fetch details for movie ${tmdbMovie.id}:`, error);
      }
    }

    const director = credits?.crew.find(member => member.job === 'Director')?.name;
    const cast = credits?.cast.slice(0, 10).map(member => ({ name: member.name, character: member.character, image: this.getPersonImgUrl(member.profile_path) })) || [];
    const releaseYear = new Date(tmdbMovie.release_date).getFullYear();

    return {
      title: tmdbMovie.title,
      id: tmdbMovie.id.toString(),
      tmdbId: tmdbMovie.id,
      imdbId: details?.imdb_id || undefined,
      originalTitle: tmdbMovie.original_title,
      description: tmdbMovie.overview,
      releaseYear: isNaN(releaseYear) ? new Date().getFullYear() : releaseYear,
      runtime: details?.runtime || undefined,
      genres: details?.genres.map(g => g.name) || [],
      director,
      cast,
      poster: this.getPosterUrl(tmdbMovie.poster_path),
      backdrop: this.getBackdropUrl(tmdbMovie.backdrop_path),
      trailerUrl,
      rating: tmdbMovie.vote_average,
      voteCount: tmdbMovie.vote_count,
      popularity: tmdbMovie.popularity,
      language: tmdbMovie.original_language,
      status: details?.status,
      tagline: details?.tagline || undefined,
      budget: details?.budget,
      revenue: details?.revenue,
      homepage: details?.homepage || undefined,
    };
  }
  getPersonImgUrl(profilePath: string | null, size: string = 'w300'): string | null {
    if (!profilePath) return null;
    return `${config.apis.tmdb.personImgUrl}/${size}${profilePath}`;
  }

}

