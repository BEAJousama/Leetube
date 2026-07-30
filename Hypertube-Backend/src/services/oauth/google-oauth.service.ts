import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Service, IService, getService } from '@/shared/core/service-container';
import { UserService } from '@/services/user.service';
import { AuthService } from '@/services/auth.service';
import { config } from '@/config/environment';
import { UserResponseDto, CreateUserDto } from '@/shared/types/dtos';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { logger } from '@/shared/utils/logger';

export interface GoogleOAuthUser {
  id: string;
  emails: Array<{ value: string; verified?: boolean }>;
  name: {
    givenName: string;
    familyName: string;
  };
  photos: Array<{ value: string }>;
  provider: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

@Service()
export class GoogleOAuthService implements IService {
  private userService!: UserService;
  private authService!: AuthService;

  constructor() {
    // Initialize services from container
    setTimeout(() => {
      this.userService = getService<UserService>('UserService');
      this.authService = getService<AuthService>('AuthService');
      this.initializePassport();
    }, 0);
    logger.info('Google OAuth Service initialized');
  }

  private initializePassport(): void {
    // Configure Google OAuth strategy
    passport.use('google', new GoogleStrategy({
      clientID: config.oauth.google.clientId,
      clientSecret: config.oauth.google.clientSecret,
      callbackURL: config.oauth.google.redirectUri
    } as any, this.handleGoogleCallback.bind(this)));

    // Serialize user for session
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await this.userService.getUserById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  private async handleGoogleCallback(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any
  ): Promise<void> {
    try {
      const email = profile.emails?.[0]?.value;
      
      if (!email) {
        return done(new Error('No email found in Google profile'), null);
      }

      // Check if user already exists
      let user = await this.userService.getUserByEmail(email);

      if (user) {
        // Update Google OAuth info if user exists
        await this.updateUserOAuthInfo(user.id, {
          googleId: profile.id,
          accessToken,
          refreshToken,
          expiresIn: 3600 // Google tokens typically expire in 1 hour
        });
        
        return done(null, user);
      }

      // Create new user if doesn't exist
      const username = await this.generateUniqueUsername(profile.name.givenName, profile.name.familyName);
      
      const newUserData: CreateUserDto = {
        email,
        username,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        password: this.generateRandomPassword(), // Generate random password since OAuth user
        picture: profile.photos?.[0]?.value || null,
        emailVerified: profile.emails?.[0]?.verified || true, // Trust Google verification
        oauthProvider: 'google',
        preferredLanguage: 'en',
        oauthId: profile.id
      };

      user = await this.userService.createUser(newUserData);

      // Store OAuth tokens
      await this.updateUserOAuthInfo(user.id, {
        googleId: profile.id,
        accessToken,
        refreshToken,
        expiresIn: 3600 // Google tokens typically expire in 1 hour
      });

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }

  private async generateUniqueUsername(firstName: string, lastName: string): Promise<string> {
    // Try firstName + lastName combination first
    const baseUsername = `${firstName?.toLowerCase() || ''}${lastName?.toLowerCase() || ''}`.replace(/[^a-z0-9]/g, '');
    
    if (baseUsername.length >= 3) {
      const isAvailable = await this.isUsernameAvailable(baseUsername);
      if (isAvailable) {
        return baseUsername;
      }
      
      // If base username is taken, try with number suffix
      for (let i = 1; i <= 999; i++) {
        const candidate = `${baseUsername}${i}`;
        const isAvailable = await this.isUsernameAvailable(candidate);
        if (isAvailable) {
          return candidate;
        }
      }
    }
    
    // Fallback: generate unique username with timestamp and random string
    let attempts = 0;
    while (attempts < 10) {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const candidate = `google_${Date.now()}_${randomSuffix}`;
      const isAvailable = await this.isUsernameAvailable(candidate);
      if (isAvailable) {
        return candidate;
      }
      attempts++;
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    // Final fallback - should never reach here
    throw new Error('Unable to generate unique username after multiple attempts');
  }

  private async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const existingUser = await this.userService.getUserByUsername(username);
      return existingUser === null;
    } catch (error) {
      // If getUserByUsername throws an error, assume username is available
      return true;
    }
  }

  private generateRandomPassword(): string {
    // Generate a random password for OAuth users (they won't use it for login)
    return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
  }

  private async updateUserOAuthInfo(userId: string, oauthData: {
    googleId: string;
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }): Promise<void> {
    // This would update the user's OAuth information in the database
    // You might want to create a separate table for OAuth tokens
    // For now, we'll add this to the user service
    await this.userService.updateUserOAuthInfo(userId, 'google', oauthData);
  }

  /**
   * Get the Google OAuth URL for authentication
   */
  getAuthUrl(): string {
    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: config.oauth.google.clientId,
      redirect_uri: config.oauth.google.redirectUri,
      scope: 'openid email profile',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      // Add state for CSRF protection
      state: this.generateSecureState()
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens and user info
   */
  async exchangeCodeForTokens(code: string, deviceInfo?: { userAgent?: string; ipAddress?: string; deviceInfo?: string; location?: string }): Promise<{
    user: UserResponseDto;
    token: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.oauth.google.clientId,
          client_secret: config.oauth.google.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: config.oauth.google.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      const tokens = await tokenResponse.json() as GoogleTokenResponse;

      // Get user info using access token
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const googleUser = await userResponse.json();

      // Process the user similar to passport callback
      const result = await this.processGoogleUser(googleUser, tokens, deviceInfo);
      
      return result;
    } catch (error) {
      throw new Error(`Google OAuth error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processGoogleUser(googleUser: any, tokens: any, deviceInfo?: { userAgent?: string; ipAddress?: string; deviceInfo?: string; location?: string }): Promise<{
    user: UserResponseDto;
    token: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    const email = googleUser.email;
    
    if (!email) {
      throw new Error('No email found in Google profile');
    }

    // Check if user already exists
    let user = await this.userService.getUserByEmail(email);
    let isNewUser = false;

    if (user) {
      // Update Google OAuth info if user exists
      await this.updateUserOAuthInfo(user.id, {
        googleId: googleUser.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in
      });
    } else {
      // Create new user if doesn't exist
      isNewUser = true;
      const username = await this.generateUniqueUsername(googleUser.given_name || 'user', googleUser.family_name || 'google');
      
      const newUserData: CreateUserDto = {
        email,
        username,
        firstName: googleUser.given_name || 'User',
        lastName: googleUser.family_name || 'Google',
        password: this.generateRandomPassword(),
        picture: googleUser.picture || null,
        emailVerified: googleUser.email_verified || true,
        oauthProvider: 'google',
        preferredLanguage: 'en',
        oauthId: googleUser.id
      };

      user = await this.userService.createUser(newUserData);

      // Store OAuth tokens
      await this.updateUserOAuthInfo(user.id, {
        googleId: googleUser.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in
      });
    }

    // Generate JWT tokens for our application (not Google's tokens)
    const jwtToken = this.authService.generateAccessToken(user.id);
    
    // Use the actual device info passed from the OAuth decorator
    const deviceInfoForToken = deviceInfo ? {
      userAgent: deviceInfo.userAgent || 'Unknown',
      ipAddress: deviceInfo.ipAddress || '127.0.0.1',
      deviceInfo: deviceInfo.deviceInfo || 'Unknown Device',
      location: deviceInfo.location || 'Unknown Location'
    } : {
      userAgent: 'google-oauth',
      ipAddress: '127.0.0.1',
      deviceInfo: 'Google OAuth Device',
      location: 'Unknown Location'
    };
    
    const refreshJwtToken = await this.authService.generateRefreshToken(user.id, deviceInfoForToken);

    return {
      user,
      token: jwtToken,
      refreshToken: refreshJwtToken,
      isNewUser
    };
  }

  private generateSecureState(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
