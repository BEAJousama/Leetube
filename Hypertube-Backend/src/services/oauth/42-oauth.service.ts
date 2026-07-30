import {Strategy as FortyTwoStrategy} from "passport-42";
import passport from 'passport';
import { Service, IService, getService } from '@/shared/core/service-container';
import { UserService } from '@/services/user.service';
import { AuthService } from '@/services/auth.service';
import { config } from '@/config/environment';
import { UserResponseDto, CreateUserDto } from '@/shared/types/dtos';
import axios from 'axios';
import { logger } from "@/shared/utils/logger";

export interface FortyTwoProfile {
  id: string;
  login: string;
  email: string;
  first_name: string;
  last_name: string;
  displayName: string;
  image_url: string;
  provider: string;
  _raw: string;
  _json: any;
}

export interface FortyTwoTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  created_at: number;
}

export interface FortyTwoOAuthResult {
  user: UserResponseDto;
  token: string;
  refreshToken: string;
  isNewUser: boolean;
}

@Service()
export class FortyTwoOAuthService implements IService {
  private userService!: UserService;
  private authService!: AuthService;

  constructor() {
    // Initialize services from container
    setTimeout(() => {
      this.userService = getService<UserService>('UserService');
      this.authService = getService<AuthService>('AuthService');
      this.initializePassport();
    }, 0);
    logger.info('42 OAuth Service initialized');
  }

  private initializePassport(): void {
    passport.use('42', new FortyTwoStrategy({
      clientID: config.oauth.school42.clientId,
      clientSecret: config.oauth.school42.clientSecret,
      callbackURL: config.oauth.school42.redirectUri
    } as any, this.handle42Callback.bind(this)));

    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await this.userService.getUserById(id);
        done(null, user);
      } catch (error) {
        done(error);
      }
    });
  }

  private async handle42Callback(accessToken: string, refreshToken: string, profile: FortyTwoProfile, done: Function): Promise<void> {
    try {
      const email = profile.email;
      
      if (!email) {
        return done(new Error('No email found in 42 profile'), null);
      }

      let user = await this.userService.getUserByEmail(email);
      
      if (user) {
        await this.updateUserOAuthInfo(user.id, {
          school42Id: profile.id,
          accessToken,
          refreshToken,
          expiresIn: 7200
        });
        
        return done(null, user);
      }

      const username = await this.generateUniqueUsername(profile.first_name, profile.last_name, profile.login);
      
      const newUserData: CreateUserDto = {
        email,
        username,
        firstName: profile.first_name,
        lastName: profile.last_name,
        password: this.generateRandomPassword(),
        picture: profile.image_url || null,
        emailVerified: true,
        oauthProvider: '42',
        preferredLanguage: 'en',
        oauthId: profile.id
      };

      user = await this.userService.createUser(newUserData);

      await this.storeOAuthTokens(user.id, {
        school42Id: profile.id,
        accessToken,
        refreshToken,
        expiresIn: 7200
      });

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: config.oauth.school42.clientId,
      redirect_uri: config.oauth.school42.redirectUri,
      response_type: 'code',
      scope: 'public',
      state: this.generateState()
    });

    return `https://api.intra.42.fr/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, deviceInfo?: { userAgent?: string; ipAddress?: string; deviceInfo?: string; location?: string }): Promise<FortyTwoOAuthResult> {
    try {
      const tokenRequestData = {
        grant_type: 'authorization_code',
        client_id: config.oauth.school42.clientId,
        client_secret: config.oauth.school42.clientSecret,
        code,
        redirect_uri: config.oauth.school42.redirectUri
      };

      const tokenResponse = await axios.post<FortyTwoTokenResponse>(
        'https://api.intra.42.fr/oauth/token',
        new URLSearchParams(tokenRequestData).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, refresh_token } = tokenResponse.data;

      const profileResponse = await axios.get('https://api.intra.42.fr/v2/me', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });

      const profile = profileResponse.data;
      
      const mappedProfile: FortyTwoProfile = {
        id: profile.id.toString(),
        login: profile.login,
        email: profile.email,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        displayName: profile.displayname || `${profile.first_name} ${profile.last_name}`.trim(),
        image_url: profile.image_url || profile.image?.link || '',
        provider: '42',
        _raw: JSON.stringify(profile),
        _json: profile
      };

      let user = await this.userService.getUserByEmail(mappedProfile.email);
      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        const username = await this.generateUniqueUsername(mappedProfile.first_name, mappedProfile.last_name, mappedProfile.login);
        
        const newUserData: CreateUserDto = {
          email: mappedProfile.email,
          username,
          firstName: mappedProfile.first_name,
          lastName: mappedProfile.last_name,
          password: this.generateRandomPassword(),
          picture: mappedProfile.image_url || null,
          emailVerified: true,
          oauthProvider: '42',
          preferredLanguage: 'en',
          oauthId: mappedProfile.id
        };

        user = await this.userService.createUser(newUserData);
      }

      await this.storeOAuthTokens(user.id, {
        school42Id: mappedProfile.id,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: tokenResponse.data.expires_in
      });

      const jwtToken = this.authService.generateAccessToken(user.id);
      
      // Use the actual device info passed from the OAuth decorator
      const deviceInfoForToken = deviceInfo ? {
        userAgent: deviceInfo.userAgent || 'Unknown',
        ipAddress: deviceInfo.ipAddress || '127.0.0.1',
        deviceInfo: deviceInfo.deviceInfo || 'Unknown Device',
        location: deviceInfo.location || 'Unknown Location'
      } : {
        userAgent: '42-oauth',
        ipAddress: '127.0.0.1',
        deviceInfo: '42 OAuth Device',
        location: 'Unknown Location'
      };
      
      const refreshJwtToken = await this.authService.generateRefreshToken(user.id, deviceInfoForToken);

      return {
        user,
        token: jwtToken,
        refreshToken: refreshJwtToken,
        isNewUser
      };
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(`42 OAuth error: ${error.response.data.error} - ${error.response.data.error_description || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('Failed to connect to 42 OAuth API');
      }
      
      throw new Error(`Failed to authenticate with 42: ${error.message}`);
    }
  }

  private async updateUserOAuthInfo(userId: string, oauthData: {
    school42Id: string;
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }): Promise<void> {
    await this.userService.updateUserOAuthInfo(userId, '42', oauthData);
  }

  private async storeOAuthTokens(userId: string, oauthData: {
    school42Id: string;
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }): Promise<void> {
    await this.userService.updateUserOAuthInfo(userId, '42', oauthData);
  }

  private async generateUniqueUsername(firstName: string, lastName: string, login: string): Promise<string> {
    // Try the 42 login first
    if (login && login.length >= 3) {
      const isAvailable = await this.isUsernameAvailable(login);
      if (isAvailable) {
        return login;
      }
      
      // If login is taken, try with a number suffix
      for (let i = 1; i <= 999; i++) {
        const candidate = `${login}${i}`;
        const isAvailable = await this.isUsernameAvailable(candidate);
        if (isAvailable) {
          return candidate;
        }
      }
    }
    
    // Try firstName + lastName combination
    const baseUsername = `${firstName?.toLowerCase() || ''}${lastName?.toLowerCase() || ''}`.replace(/\s+/g, '');
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
      const candidate = `user42_${Date.now()}_${randomSuffix}`;
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
    return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async refreshAccessToken(refreshToken: string): Promise<FortyTwoTokenResponse> {
    try {
      const response = await axios.post<FortyTwoTokenResponse>(
        'https://api.intra.42.fr/oauth/token',
        {
          grant_type: 'refresh_token',
          client_id: config.oauth.school42.clientId,
          client_secret: config.oauth.school42.clientSecret,
          refresh_token: refreshToken
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new Error('Failed to refresh 42 access token');
    }
  }
}

