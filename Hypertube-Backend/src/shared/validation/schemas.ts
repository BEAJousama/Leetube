import { time } from 'console';
import e from 'express';
import Joi from 'joi';

// Auth schemas
export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
            .required()
            .messages({
              'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            }),
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional()
});

export const loginSchema = Joi.object({
  emailOrUsername: Joi.string().min(3).max(255).required(),
  password: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
            .required()
            .messages({
              'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});


export const emailSchema = Joi.object({
  email: Joi.string().email().required()
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().optional(),
  username: Joi.string().alphanum().min(3).max(30).optional()
}).or('email', 'username')

export const resetPasswordSchema = Joi.object({
  newPassword: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
            .required()
            .messages({
              'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            }),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
            .required()
            .messages({
              'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            }),
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required()
});

// Param validation schemas
export const tokenParamSchema = Joi.object({
  token: Joi.string().required()
});

export const deviceIdParamSchema = Joi.object({
  deviceId: Joi.string().required()
});


// User schemas
export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  preferredLanguage: Joi.string().valid('en', 'es', 'fr', 'de').optional(),
  email: Joi.string().email().optional(),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  picture: Joi.string().uri().allow(null).optional()
});

export const libraryAddSchema = Joi.object({
  status: Joi.string().valid('want to watch', 'watching', 'watched').required()
});

// Movie schemas
export const createMovieSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(1).max(2000).required(),
  releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5).required(),
  runtime: Joi.number().integer().min(1).max(1000).optional(),
  genre: Joi.array().items(Joi.string().min(1).max(50)).min(1).required(),
  director: Joi.string().min(1).max(100).optional(),
  cast: Joi.array().items(Joi.string().min(1).max(100)).optional(),
  imdbId: Joi.string().pattern(/^tt\d{7,8}$/).optional(),
  tmdbId: Joi.string().optional(),
  poster: Joi.string().uri().optional(),
  backdrop: Joi.string().uri().optional()
});

export const updateMovieSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().min(1).max(2000).optional(),
  releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5).optional(),
  runtime: Joi.number().integer().min(1).max(1000).optional(),
  genre: Joi.array().items(Joi.string().min(1).max(50)).min(1).optional(),
  director: Joi.string().min(1).max(100).optional(),
  cast: Joi.array().items(Joi.string().min(1).max(100)).optional(),
  poster: Joi.string().uri().optional(),
  backdrop: Joi.string().uri().optional()
});

export const movieSearchSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional().allow(''),
  year: Joi.string().pattern(/^\d{4}$/).optional().allow(''),
  genre: Joi.string().min(1).max(50).optional().allow(''),
  cast: Joi.string().min(1).max(100).optional().allow(''),
  director: Joi.string().min(1).max(100).optional().allow(''),
  page: Joi.number().integer().min(1).max(1000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('popularity', 'rating', 'year', 'title').default('popularity')
});

export const movieLibrarySchema = Joi.object({
  watched: Joi.boolean().optional(),
  watchlist: Joi.boolean().optional()
});

export const movieIdSchema = Joi.object({
  movieId: Joi.alternatives().try(
    Joi.string().pattern(/^\d+$/), // TMDB ID (numeric string)
    Joi.string().min(1).max(50) // Database ID
  ).required()
});

// Comment schemas
export const commentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  movieId: Joi.string()
});

export const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required()
});

// Rating schemas
export const ratingSchema = Joi.object({
  rating: Joi.number().min(1).max(10).required().messages({
    'number.base': 'Rating must be a number',
    'number.min': 'Rating must be between 1 and 10',
    'number.max': 'Rating must be between 1 and 10',
    'any.required': 'Rating is required'
  })
});

// Torrent schemas
export const torrentSchema = Joi.object({
  movieId: Joi.string().required(),
  magnet: Joi.string().required(),
  userId: Joi.string().required(),
});

// Query schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const trendingMoviesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  timeWindow: Joi.string().valid('day', 'week').default('week')
});
