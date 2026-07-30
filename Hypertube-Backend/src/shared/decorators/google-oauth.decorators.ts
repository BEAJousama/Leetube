import { Request, Response, NextFunction } from 'express';
import { getService } from '@/shared/core/service-container';
import { GoogleOAuthService } from '@/services/oauth/google-oauth.service';
import { config } from '@/config/environment';
import { logger } from '@/shared/utils/logger';
import { extractDeviceInfo } from '../utils/device-management';

/**
 * Decorator to initiate Google OAuth flow
 * Redirects user to Google OAuth consent screen
 */
export function InitiateGoogleOAuth(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  descriptor.value = async function (req: Request, res: Response) {
    try {
      const googleOAuthService = getService<GoogleOAuthService>('GoogleOAuthService');
      
      // Capture device info from the user's actual request (before redirect)
      const deviceInfo = await extractDeviceInfo(req);
      logger.info('Captured device info for Google OAuth:', {
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        deviceInfo: deviceInfo.deviceInfo,
        location: deviceInfo.location
      });
      
      // Store device info in session or temporary storage
      // Using cookies that will be available during callback
      const deviceInfoCookieOptions = {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax' as const,
        maxAge: 10 * 60 * 1000, // 10 minutes - just enough for OAuth flow
        path: '/',
      };
      
      res.cookie('oauth_device_info', JSON.stringify(deviceInfo), deviceInfoCookieOptions);
      
      const authUrl = googleOAuthService.getAuthUrl();
      res.redirect(authUrl);
    } catch (error) {
      logger.error('Google OAuth initiation failed:', error);
      res.status(500).json({ error: 'Google OAuth initiation failed' });
    }
  };

  return descriptor;
}

/**
 * Decorator for Google OAuth callback handling
 * Use this on your callback route handler
 */
export function GoogleOAuthCallback(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (req: Request, res: Response, next?: NextFunction) {
    try {
      const googleOAuthService = getService<GoogleOAuthService>('GoogleOAuthService');
      const code = req.query.code as string;
      const error = req.query.error as string;

      if (error) {
        return res.status(400).json({ 
          error: 'OAuth authentication failed',
          details: error 
        });
      }

      if (!code) {
        return res.status(400).json({ 
          error: 'Authorization code not provided' 
        });
      }

      // Retrieve stored device info from cookies (captured during initiation)
      let deviceInfo: any = null;
      try {
        const deviceInfoCookie = req.cookies?.oauth_device_info;
        if (deviceInfoCookie) {
          deviceInfo = JSON.parse(deviceInfoCookie);
          logger.info('Retrieved stored device info for Google OAuth:', {
            userAgent: deviceInfo.userAgent,
            ipAddress: deviceInfo.ipAddress,
            deviceInfo: deviceInfo.deviceInfo,
            location: deviceInfo.location
          });
          
          // Clear the temporary cookie
          res.clearCookie('oauth_device_info', { path: '/' });
        } else {
          logger.warn('No device info cookie found, falling back to callback request info');
          // Fallback to callback request (less accurate)
          deviceInfo = await extractDeviceInfo(req);
          logger.info('Fallback device info for Google OAuth:', {
            userAgent: deviceInfo.userAgent,
            ipAddress: deviceInfo.ipAddress,
            deviceInfo: deviceInfo.deviceInfo,
            location: deviceInfo.location
          });
        }
      } catch (error) {
        logger.error('Error retrieving stored device info, using fallback:', error);
        deviceInfo = await extractDeviceInfo(req);
        logger.info('Error fallback device info for Google OAuth:', {
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
          deviceInfo: deviceInfo.deviceInfo,
          location: deviceInfo.location
        });
      }

      // Exchange code for tokens and user info
      const result = await googleOAuthService.exchangeCodeForTokens(code, deviceInfo);
      
      // Set tokens in HTTP-only cookies
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days (refresh token)
      });

      // Add result to request for the controller method
      (req as any).oauthResult = result;
      
      return await originalMethod.call(this, req, res, next);
    } catch (error) {
      logger.error('Google OAuth callback failed:', error);
      
      // Don't expose sensitive OAuth errors to frontend
      // Instead redirect to frontend error page with generic message
      const errorUrl = `${config.frontendUrl}/auth/error?provider=google&error=oauth_failed`;
      return res.redirect(errorUrl);
    }
  };

  return descriptor;
}




