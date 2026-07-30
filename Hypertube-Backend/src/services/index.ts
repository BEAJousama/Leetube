import { container } from '@/shared/core/service-container';
import { UserService } from './user.service';
import { MovieService } from './movie.service';
import { CommentService } from './comment.service';
import { RatingService } from './rating.service';
import { AuthService } from './auth.service';
import { GoogleOAuthService } from './oauth/google-oauth.service';
import { FortyTwoOAuthService } from './oauth/42-oauth.service';
import { TMDBService, YTSService, ExternalMovieService } from './external';
import { TorrentService } from './torrent.service';
import { OpenSubtitlesService } from './external/opensubtitles.service';

export function initializeServices() {
  const allServices = [
    'UserService', 'AuthService', 'MovieService', 'CommentService', 
    'RatingService', 'GoogleOAuthService', 
    'FortyTwoOAuthService', 'TMDBService', 'YTSService', 'ExternalMovieService',
    'TorrentService', 'OpenSubtitlesService'
  ];
  const missingServices = allServices.filter(service => !container.has(service));
  
  if (missingServices.length > 0) {
    throw new Error(`Missing required services: ${missingServices.join(', ')}`);
  }
}

export {
  UserService,
  MovieService,
  CommentService,
  RatingService,
  AuthService,
  TorrentService,
  GoogleOAuthService,
  FortyTwoOAuthService,
  TMDBService,
  YTSService,
  ExternalMovieService,
  OpenSubtitlesService
};

export type {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  PublicUserDto,
  CreateMovieDto,
  UpdateMovieDto,
  MovieResponseDto,
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto,
  CreateRatingDto,
  RatingResponseDto,
} from '@/shared/types/dtos';
