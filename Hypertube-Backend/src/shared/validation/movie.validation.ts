import Joi from 'joi';

// Movie service specific validation schemas
export const tmdbIdSchema = Joi.number().integer().min(1).max(999999999).required();

export const userIdSchema = Joi.string().min(1).max(50).required();

export const movieDataSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  rating: Joi.number().min(0).max(10).optional(),
  description: Joi.string().max(5000).optional().allow(''),
  releaseYear: Joi.number().integer().min(1888).max(new Date().getFullYear() + 5).optional(),
  runtime: Joi.number().integer().min(1).max(1000).optional(),
  genre: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  director: Joi.string().max(200).optional().allow(''),
  poster: Joi.string().uri().optional().allow(''),
  backdrop: Joi.string().uri().optional().allow(''),
  language: Joi.string().max(10).optional().allow(''),
  tmdbId: Joi.number().integer().optional(),
  imdbId: Joi.string().max(20).optional().allow('')
});

export const searchOptionsSchema = Joi.object({
  title: Joi.string().max(200).optional().allow(''),
  year: Joi.string().pattern(/^\d{4}$/).optional().allow(''),
  genre: Joi.string().max(50).optional().allow(''),
  cast: Joi.string().max(100).optional().allow(''),
  director: Joi.string().max(100).optional().allow(''),
  page: Joi.number().integer().min(1).max(1000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const movieFetchSchema =  Joi.object({
  page: Joi.number().integer().min(1).max(1000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().min(1).max(100).default('popularity'),
  genre: Joi.string().min(1).max(50).default('all'),
});

/**
 * Validate and sanitize input data
 */
export function validateInput<T = any>(schema: Joi.Schema, data: any): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
  }

  return value as T;
}

/**
 * Validate input but don't throw on error - just sanitize
 */
export function sanitizeInput<T = any>(schema: Joi.Schema, data: any): T {
  const { value } = schema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  return value as T;
}