// User DTOs
export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  picture?: string | null;
  emailVerified?: boolean;
  oauthProvider?: string;
  preferredLanguage?: string;
  oauthId?: string;
}

// Auth DTOs
export interface AuthResponse {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface LoginDeviceInfo {
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: string;
  location?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  preferredLanguage?: string;
  picture?: string | null;
}

export interface UserResponseDto {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string | null;
  preferredLanguage: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUserDto {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  picture?: string | null;
  createdAt: Date;
}

// Movie DTOs
export interface CreateMovieDto {
  id?: string; // Optional string ID - will use TMDB/IMDB based ID or auto-generate
  title: string;
  rating?: number; // Average rating (1-10)
  description: string;
  releaseYear: number;
  runtime?: number;
  genre: string[];
  director?: string;
  language?: string;
  country?: string;
  cast?: any[];
  imdbId?: string;
  tmdbId?: number; // Changed to number to match Prisma schema
  poster?: string;
  backdrop?: string;
}

export interface UpdateMovieDto {
  title?: string;
  description?: string;
  releaseYear?: number;
  runtime?: number;
  genre?: string[];
  director?: string;
  cast?: any[];
  language?: string;
  country?: string;
  imdbId?: string;
  tmdbId?: number; // Changed to number to match Prisma schema
  poster?: string;
  backdrop?: string;
}

export interface LoginDto {
  emailOrUsername: string;
  password: string;
}

export interface MovieResponseDto {
  id: string;
  title: string;
  description: string;
  rating?: number; // Average rating (1-10)
  releaseYear: number;
  year?: number; // Additional year field for compatibility
  runtime?: number;
  genre: string[];
  director?: string;
  cast?: any[];
  imdbId?: string;
  tmdbId?: number; // Changed to number to match Prisma schema
  poster?: string;
  backdrop?: string;
  trailerUrl?: string;
  averageRating?: number;
  totalRatings?: number;
  // User-specific fields (only populated when userId is provided)
  inLibrary?: boolean;
  inFavorite?: boolean;
  isWatched?: boolean;
  userRating?: number; // The current user's rating for this movie (1-10)
  // Torrent-related fields
  downloadPath?: string;
  fileSize?: number; // Convert from BigInt to number for JSON serialization
  downloaded?: boolean;
  downloading?: boolean;
  downloadProgress?: number; // 0.0 to 1.0
  lastAccessed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Comment DTOs
export interface CreateCommentDto {
  content: string;
  movieId: string;
}

export interface UpdateCommentDto {
  content: string;
}

export interface CommentResponseDto {
  id: string;
  content: string;
  movieId: string;
  userId: string;
  user: PublicUserDto;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Rating DTOs
export interface CreateRatingDto {
  userId: string;
  movieId: string;
  rating: number; // 1-10
}

export interface RatingResponseDto {
  id: string;
  rating: number;
  userId: string;
  movieId: string;
  user: PublicUserDto;
  movie: MovieResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
