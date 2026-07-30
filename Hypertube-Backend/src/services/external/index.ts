export { TMDBService } from './tmdb.service';
export { YTSService } from './yts.service';
export { ExternalMovieService } from './external-movie.service';

export type {
  TMDBMovie,
  TMDBMovieDetails,
  TMDBSearchResult,
  TMDBCredits,
  ExternalMovieData,
} from './tmdb.service';

export type {
  MovieSearchOptions,
  MovieSearchResult,
  EnrichedMovieData,
} from './external-movie.service';

export type {
  YTSTorrent,
  YTSMovieDetails,
  MagnetLink,
} from './yts.service';
