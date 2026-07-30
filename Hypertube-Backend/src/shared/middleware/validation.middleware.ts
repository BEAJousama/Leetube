import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '@/shared/utils/logger';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn('Validation failed:', { 
          path: req.path, 
          errors: errorMessages,
          body: req.body 
        });
        
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Request validation failed',
          details: errorMessages
        });
      }

      // Replace req.body with validated/sanitized data
      req.body = value;
      next();
    } catch (err) {
      logger.error('Validation middleware error:', err);
      return res.status(500).json({
        error: 'Validation error',
        message: 'Internal validation error'
      });
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn('Query validation failed:', { 
          path: req.path, 
          errors: errorMessages,
          query: req.query 
        });
        
        return res.status(400).json({
          error: 'Query validation failed',
          message: 'Request query validation failed',
          details: errorMessages
        });
      }

      req.query = value;
      next();
    } catch (err) {
      logger.error('Query validation middleware error:', err);
      return res.status(500).json({
        error: 'Validation error',
        message: 'Internal query validation error'
      });
    }
  };
};

/**
 * validate cookies
 */

export const validateCookies = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.cookies, {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn('Cookies validation failed:', {
          path: req.path,
          errors: errorMessages,
          cookies: req.cookies
        });

        return res.status(400).json({
          error: 'Cookies validation failed',
          message: 'Request cookies validation failed',
          details: errorMessages
        });
      }

      req.cookies = value;
      next();
    } catch (err) {
      logger.error('Cookies validation middleware error:', err);
      return res.status(500).json({
        error: 'Validation error',
        message: 'Internal cookies validation error'
      });
    }
  };
};

/**
 * Validate route parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        logger.warn('Params validation failed:', { 
          path: req.path, 
          errors: errorMessages,
          params: req.params 
        });
        
        return res.status(400).json({
          error: 'Params validation failed',
          message: 'Request params validation failed',
          details: errorMessages
        });
      }

      req.params = value;
      next();
    } catch (err) {
      logger.error('Params validation middleware error:', err);
      return res.status(500).json({
        error: 'Validation error',
        message: 'Internal params validation error'
      });
    }
  };
};
