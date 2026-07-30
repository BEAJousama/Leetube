import { Request, Response, NextFunction } from 'express';
import { getService } from '@/shared/core/service-container';
import { FortyTwoOAuthService } from '@/services/oauth/42-oauth.service';
import { config } from '@/config/environment';
import { logger } from '@/shared/utils/logger';
import { extractDeviceInfo } from '../utils/device-management';

/**
 * Decorator to initiate 42 OAuth flow
 * Redirects user to 42 OAuth consent screen
 */
export function InitiateFortyTwoOAuth(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  descriptor.value = async function (req: Request, res: Response) {
    try {
      const fortyTwoOAuthService = getService<FortyTwoOAuthService>('FortyTwoOAuthService');
      
      // Capture device info from the user's actual request (before redirect)
      const deviceInfo = await extractDeviceInfo(req);
      logger.info('Captured device info for 42 OAuth:', {
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
      
      const authUrl = fortyTwoOAuthService.getAuthUrl();
      res.redirect(authUrl);
    } catch (error) {
      logger.error('42 OAuth initiation failed:', error);
      res.status(500).json({ error: '42 OAuth initiation failed' });
    }
  };

  return descriptor;
}

/**
 * Decorator for 42 OAuth callback handling
 * Use this on your callback route handler
 */
export function FortyTwoOAuthCallback(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (req: Request, res: Response, next?: NextFunction) {
    try {
      const fortyTwoOAuthService = getService<FortyTwoOAuthService>('FortyTwoOAuthService');
      const code = req.query.code as string;
      const error = req.query.error as string;

      if (error) {
        return res.status(400).json({ 
          error: '42 OAuth authentication failed',
          details: error 
        });
      }

      if (!code) {
        return res.status(400).json({ 
          error: 'Authorization code not provided' 
        });
      }

      // Exchange code for tokens and user info
      // Get device info from stored cookie (captured during initiation)
      let deviceInfo;
      try {
        const deviceInfoCookie = req.cookies.oauth_device_info;
        if (deviceInfoCookie) {
          deviceInfo = JSON.parse(deviceInfoCookie);
          logger.info('Retrieved stored device info for 42 OAuth:', {
            userAgent: deviceInfo.userAgent,
            ipAddress: deviceInfo.ipAddress,
            deviceInfo: deviceInfo.deviceInfo,
            location: deviceInfo.location
          });
        } else {
          logger.warn('No stored device info found, using callback request info (may be inaccurate)');
          deviceInfo = await extractDeviceInfo(req);
          logger.info('Fallback device info for 42 OAuth:', {
            userAgent: deviceInfo.userAgent,
            ipAddress: deviceInfo.ipAddress,
            deviceInfo: deviceInfo.deviceInfo,
            location: deviceInfo.location
          });
        }
      } catch (error) {
        logger.error('Failed to parse stored device info:', error);
        deviceInfo = await extractDeviceInfo(req);
        logger.info('Error fallback device info for 42 OAuth:', {
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
          deviceInfo: deviceInfo.deviceInfo,
          location: deviceInfo.location
        });
      }
      
      const result = await fortyTwoOAuthService.exchangeCodeForTokens(code, deviceInfo);
      
      // Clear the temporary device info cookie
      res.clearCookie('oauth_device_info', { path: '/' });
      
      // Set tokens in HTTP-only cookies

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days (refresh token)
      });

      

      // Add result to request for the controller method
      (req as any).oauthResult = result;
      
      return await originalMethod.call(this, req, res, next);
    } catch (error) {
      logger.error('42 OAuth callback failed:', error);
      const errorUrl = `${config.frontendUrl}/auth/error?provider=42&error=oauth_failed`;
      return res.redirect(errorUrl);
    }
  };

  return descriptor;
}

