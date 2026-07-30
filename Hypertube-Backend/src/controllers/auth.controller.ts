import { Request, Response, NextFunction } from 'express';
import { getService } from '@/shared/core/service-container';
import { config } from '@/config/environment';
import { AuthService } from '@/services/auth.service';
import { logger } from '@/shared/utils/logger';
import { extractDeviceInfo, extractDeviceName } from '@/shared/utils/device-management';
import { 
  CreateUserDto, 
  UserResponseDto,
} from '@/shared/types/dtos';
import { 
  InitiateGoogleOAuth, 
  GoogleOAuthCallback 
} from '@/shared/decorators/google-oauth.decorators';
import { 
  InitiateFortyTwoOAuth, 
  FortyTwoOAuthCallback 
} from '@/shared/decorators/42-oauth.decorators';

export interface LoginDto {
  emailOrUsername: string;
  password: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = getService<AuthService>('AuthService');
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: CreateUserDto = req.body;
      const deviceInfo = await extractDeviceInfo(req);

      if (!userData.email || !userData.username || !userData.password || !userData.firstName || !userData.lastName) {
        res.status(400).json({
          message: 'All fields (email, username, password, firstName, lastName) are required'
        });
        return;
      }

      const result = await this.authService.register(userData, deviceInfo);
      
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        accessToken: result.accessToken
      });
    } catch (error: any) {
      if (error.message.includes('already exists') || error.message.includes('already taken')) {
        res.status(409).json({ 
          message: error.message 
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData: LoginDto = req.body;
      const deviceInfo = await extractDeviceInfo(req);

      const result = await this.authService.login(loginData, deviceInfo);

      if (!result) {
        res.status(401).json({ 
          message: 'Invalid email or password' 
        });
        return;
      }
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      res.json({
        message: 'Login successful',
        user: result.user,
        accessToken: result.accessToken
      });
    } catch (error: any) {
      if (error.message.includes('Invalid email or password')) {
        res.status(401).json({ 
          message: 'Invalid credentials' 
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        await this.authService.revokeRefreshToken(refreshToken);
      }
      
      const clearCookieOptions = {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax'
      };
      res.clearCookie('refreshToken', clearCookieOptions);
      
      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      res.status(500).json({
        message: 'Logout failed'
      });
    }
  }

    /**
   * Verify user email with token
   * GET /api/auth/verify-email
   */
    async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
          res.status(400).json({
            message: 'Valid token is required'
          });
          return;
        }

        const result = await this.authService.verifyEmail(token);

        if (!result) {
          res.status(400).json({
            message: 'Invalid or expired verification token'
          });
          return;
        }

        res.json({
          message: 'Email verified successfully',
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('expired')) {
          res.status(400).json({
            message: 'Verification token has expired'
          });
          return;
        }
        else if (error instanceof Error && error.message.includes('already verified')) {
          res.status(400).json({
            message: 'Email is already verified'
          });
          return;
        }
        next(error);
      }
    }

    /**
   * Resend verification email
   * POST /api/auth/resend-verification
   */
    async resendVerificationEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { email } = req.body;

        if (!email) {
          res.status(400).json({
            message: 'Email is required'
          });
          return;
        }

        const result = await this.authService.resendVerificationEmail(email);

        if (!result) {
          res.status(404).json({
            message: 'User not found or email already verified'
          });
          return;
        }

        res.json({
          message: 'Verification email sent successfully'
        });
      } catch (error) {
        next(error);
      }
    }

  /**
   * Refresh token
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(400).json({ 
          message: 'Refresh token is required' 
        });
        return;
      }
      
      const tokens = await this.authService.refreshAccessToken(refreshToken);
      
      if (!tokens) {
        res.status(401).json({ 
          message: 'Invalid or expired refresh token' 
        });
        return;
      }
      
      if (tokens.refreshToken) {
        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: config.nodeEnv === 'production',
          sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
      }
      
      res.json({
        message: 'Token refreshed successfully',
        accessToken: tokens.accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as UserResponseDto;
      const { oldPassword, newPassword }: ChangePasswordDto = req.body;

      if (!user) {
        res.status(401).json({ 
          message: 'Not authenticated' 
        });
        return;
      }
      
      if (!oldPassword || !newPassword) {
        res.status(400).json({ 
          message: 'Old password and new password are required' 
        });
        return;
      }
      
      if (newPassword.length < 6) {
        res.status(400).json({ 
          message: 'New password must be at least 6 characters long' 
        });
        return;
      }
      
      const success = await this.authService.changePassword(
        user.id, 
        oldPassword, 
        newPassword
      );
      
      if (!success) {
        res.status(400).json({ 
          message: 'Invalid old password' 
        });
        return;
      }
      
      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }


/**
 * Forgot Password
 * POST /api/auth/forgot-password
 */

async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void>
{
  const {username, email} = req.body;

  if (!email && !username) {
    res.status(400).json({
      message: 'Email or username is required'
    });
    return;
  }
  
  try {
    await this.authService.initiatePasswordReset(email, username);
    res.json({
      message: 'If the account exists, a password reset link has been sent to the registered email.'
    });
  } catch (error) {
    next(error);
  }
  
}

/**
 * Reset Password
 * Post /api/auth/reset-password
 */

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void>
  {
    const {newPassword } = req.body;
    const { token } = req.params;
    
    if (!token || !newPassword) {
      res.status(400).json({
        message: 'Token and new password are required'
      });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ 
        message: 'New password must be at least 6 characters long' 
      });
      return;
    }
    
    try {
      const success = await this.authService.resetPassword(token, newPassword);
      
      if (!success) {
        res.status(400).json({
          message: 'Invalid or expired password reset token'
        });
        return;
      }
      
      res.json({
        message: 'Password has been reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active devices for current user
   * GET /api/auth/devices
   */
  async getActiveDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as UserResponseDto;
      
      if (!user) {
        res.status(401).json({ 
          message: 'Not authenticated' 
        });
        return;
      }
      
      const devices = await this.authService.getUserActiveDevices(user.id, req.cookies.refreshToken);
      
      const simplifiedDevices = devices.map(d => ({
        id: d.id,
        userAgent: d.userAgent,
        deviceName: extractDeviceName(d.userAgent || ''),
        location: d.location,
        deviceInfo: d.deviceInfo,
        ipAddress: d.ipAddress.split(':')[d.ipAddress.split(':').length - 1],
        isCurrentDevice: d.isCurrentDevice,
        lastUsedAt: d.lastUsedAt,
        createdAt: d.createdAt
      }));

      res.json({
        devices: simplifiedDevices
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke all refresh tokens (logout from all devices)
   * POST /api/auth/logout-all
   */
  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user as UserResponseDto;
      
      if (!user) {
        res.status(401).json({ 
          message: 'Not authenticated' 
        });
        return;
      }
      
      await this.authService.revokeAllUserTokensExcept(user.id, req.cookies.refreshToken);
      
      // Clear the current refresh token cookie
      // res.clearCookie('refreshToken');
      
      res.json({
        message: 'Logged out from all devices successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke a specific refresh token
   * POST /api/auth/revoke-device
   */
  async revokeDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { deviceId } = req.params;

      const user = (req as any).user as UserResponseDto;
      
      if (!user) {
        res.status(401).json({ 
          message: 'Not authenticated' 
        });
        return;
      }
      if (!deviceId) {
        res.status(400).json({ 
          message: 'Device ID is required'  
        });
        return;
      }
      
      const currentRefreshToken = req.cookies.refreshToken;
      
      const devices = await this.authService.getUserActiveDevices(user.id, currentRefreshToken);
      const device = devices.find(d => d.id === deviceId);

      if (!device) {
        res.status(404).json({ 
          message: 'Device not found' 
        });
        return;
      }

      const success = await this.authService.revokeRefreshToken(device.token);

      if (!success) {
        res.status(404).json({ 
          message: 'Token not found or already revoked' 
        });
        return;
      }

      if (device.isCurrentDevice) {
        const clearCookieOptions = {
          httpOnly: true,
          secure: config.nodeEnv === 'production',
          sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax'
        };
        res.clearCookie('refreshToken', clearCookieOptions);
        res.json({
          message: 'Current device revoked successfully. You have been logged out.',
          isCurrentDevice: true
        });
      } else {
        res.json({
          message: 'Device revoked successfully',
          isCurrentDevice: false
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initiate 42 OAuth authentication
   * GET /api/auth/42
   */
  @InitiateFortyTwoOAuth
  async auth42(req: Request, res: Response): Promise<void> {
  }

  /**
   * Handle 42 OAuth callback
   * GET /api/auth/42/callback
   */
  @FortyTwoOAuthCallback
  async auth42Callback(req: Request, res: Response): Promise<void> {
    try {
      const oauthResult = (req as any).oauthResult;
      
      if (!oauthResult) {
        res.status(500).json({
          message: '42 OAuth authentication failed'
        });
        return;
      }

      const token = oauthResult.token;
      const userData = oauthResult.user;
      const isNewUser = oauthResult.isNewUser;

      const cookieOptions = {
        httpOnly: false,
        secure: config.nodeEnv === 'production',
        sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax',
        maxAge: 5 * 60 * 1000,
        path: '/'
      };

      const encodedUserData = encodeURIComponent(JSON.stringify(userData));
      const redirectUrl = `${config.frontendUrl}/auth/success?provider=42&isNewUser=${isNewUser}&token=${token}&userData=${encodedUserData}`;
      return res.redirect(redirectUrl);

    } catch (error) {
      logger.error('42 OAuth callback error:', error);
      const errorUrl = `${config.frontendUrl}/auth/error?provider=42&error=callback_failed`;
      return res.redirect(errorUrl);
    }
  }
  
  /**
   * Initiate Google OAuth authentication
   * GET /api/auth/google
   */
  @InitiateGoogleOAuth
  async googleAuth(req: Request, res: Response): Promise<void> {
  }

  /**
   * Handle Google OAuth callback
   * GET /api/auth/google/callback
   */
  @GoogleOAuthCallback
  async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const oauthResult = (req as any).oauthResult;
      
      if (!oauthResult) {
        res.status(500).json({
          message: 'OAuth authentication failed'
        });
        return;
      }

      const token = oauthResult.token;
      const userData = oauthResult.user;
      const isNewUser = oauthResult.isNewUser;

      const cookieOptions = {
        httpOnly: false,
        secure: config.nodeEnv === 'production',
        sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax',
        maxAge: 5 * 60 * 1000,
        path: '/'
      };

      const encodedUserData = encodeURIComponent(JSON.stringify(userData));
      const redirectUrl = `${config.frontendUrl}/auth/success?provider=google&isNewUser=${isNewUser}&token=${token}&userData=${encodedUserData}`;
      return res.redirect(redirectUrl);

    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      const errorUrl = `${config.frontendUrl}/auth/error?provider=google&error=callback_failed`;
      return res.redirect(errorUrl);
    }
  }

  /**
   * Get OAuth data from HTTP-only cookies
   * GET /api/auth/oauth-data
   */
  async getOAuthData(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.cookies.oauthAccessToken;
      const userData = req.cookies.oauthUserData;

      if (!accessToken || !userData) {
        res.status(404).json({
          message: 'OAuth data not found'
        });
        return;
      }

      const clearCookieOptions = {
        path: '/',
        secure: config.nodeEnv === 'production',
        sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax'
      };
      res.clearCookie('oauthAccessToken', clearCookieOptions);
      res.clearCookie('oauthUserData', clearCookieOptions);

      res.json({
        token: accessToken,
        user: JSON.parse(userData)
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to retrieve OAuth data'
      });
    }
  }

}

