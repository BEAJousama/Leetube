import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Service, IService, getService } from '@/shared/core/service-container';
import { UserService } from './user.service';
import {config} from '@/config/environment';
import nodemailer from 'nodemailer';
import { prisma } from '@/shared/database/connection';
import { logger } from '@/shared/utils/logger';

import { 
  CreateUserDto, 
  UserResponseDto,
  AuthResponse,
  LoginDeviceInfo,
  LoginDto
} from '@/shared/types/dtos';


@Service()
export class AuthService implements IService {
  private _userService?: UserService;

  private get userService(): UserService {
    if (!this._userService) {
      this._userService = getService<UserService>('UserService');
    }
    return this._userService;
  }

  constructor() {
    logger.info('Auth Service initialized');
  }


  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateAccessToken(userId: string): string {
    return jwt.sign(
      { userId },
      this.getJwtSecret(),
      { expiresIn: '15m' }
    );
  }


  async register(userData: CreateUserDto, deviceInfo?: LoginDeviceInfo): Promise<AuthResponse> {
    try {

      // tolowercase email and username for consistency
      userData.email = userData.email.toLowerCase().trim();
      userData.username = userData.username.toLowerCase().trim();

      const existingUser = await this.userService.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const existingUsername = await this.userService.getUserByUsername(userData.username);
      if (existingUsername) {
        throw new Error('Username already taken');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);
      // Create user
      const user = await this.userService.createUser({
        ...userData,
        password: hashedPassword
      });

      // Send verification email
      await this.sendVerificationEmail(user.email);
      
      // Generate tokens
      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = await this.generateRefreshToken(user.id, deviceInfo);

      return { user, accessToken, refreshToken }
    } catch (error) {
      logger.error('Registration failed:', error);
      throw new Error('Registration failed: ' + error);
    }
  }

  async login(loginData: LoginDto, deviceInfo?: LoginDeviceInfo): Promise<AuthResponse> {
    // Determine if input is email or username
    loginData.emailOrUsername = loginData.emailOrUsername.toLowerCase().trim();
    const isEmail = this.isEmailFormat(loginData.emailOrUsername);
    try
    {
      // Find user by email or username
      const user = isEmail 
        ? await this.userService.getUserByEmail(loginData.emailOrUsername)
        : await this.userService.getUserByUsername(loginData.emailOrUsername);
      
      if (!user) {
          throw new Error(`Invalid username or email`);
      }

      // Get user with password for verification
      const userWithPassword = await this.getUserWithPassword(loginData.emailOrUsername, isEmail);
      if (!userWithPassword) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(loginData.password, userWithPassword.password);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await this.userService.updateLastLogin(user.id);

      // Generate tokens (OAuth cleanup handled by generateRefreshToken)
      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = await this.generateRefreshToken(user.id, deviceInfo);

      return { user, accessToken, refreshToken };
    } catch (error) {
      logger.error('Login failed:', error);
      throw new Error('Login failed: ' + error);
    }
  }

  private async sendVerificationEmail(email: string): Promise<void> {
    try {
      const token = jwt.sign(
        { email, purpose: 'email_verification' },
        this.getJwtSecret(),
        { expiresIn: '24h' } // 24 hours for email verification
      );

      const url = `${config.frontendUrl}/verify-email?token=${token}`;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.email.from.email,
          pass: config.email.smtp.pass
        }
      });

      await transporter.sendMail({
        from: config.email.from.email,
        to: email,
        subject: 'Verify your email - LeeTube',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to LeeTube!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
              Verify Email
            </a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${url}">${url}</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
        `,
        text: `Welcome to LeeTube! Please verify your email by clicking this link: ${url}`
      });

    } catch (error) {
      logger.error('Failed to send verification email:', error);
      // We don't throw here so that registration can still succeed even if SMTP fails
      // throw new Error('Failed to send verification email');
    }
  }


  async verifyEmail(token: string): Promise<{ user: UserResponseDto; newtoken: string } | null> {
    try {
      // Decode and verify the token
      const decoded = jwt.verify(token, this.getJwtSecret()) as any;
      
      if (decoded.purpose !== 'email_verification') {
        throw new Error('Invalid token purpose');
      }

      const email = decoded.email;
      if (!email) {
        throw new Error('Invalid token: no email found');
      }

      // Find the user by email
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if email is already verified
      if (user.emailVerified) {
        throw new Error('Email is already verified');
      }

      // Update emailVerified to true
      await this.userService.updateEmailVerified(user.id);
      
      // Get updated user data
      const updatedUser = await this.userService.getUserById(user.id);
      if (!updatedUser) {
        throw new Error('Failed to get updated user data');
      }

      // Generate new token with verified email status
      const newtoken = this.generateAccessToken(user.id);
            
      return { user: updatedUser, newtoken };
    } catch (error) {
      logger.error('Email verification failed:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid or expired verification token');
      }
      throw error;
    }
  }

  async resendVerificationEmail(email: string): Promise<boolean> {
    try {
      // Find user by email
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        return false;
      }

      // Check if email is already verified
      if (user.emailVerified) {
        return false;
      }


      // Send verification email
      await this.sendVerificationEmail(email);
      return true;
    } catch (error) {
      logger.error('Failed to resend verification email:', error);
      throw new Error('Failed to resend verification email');
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user) {
        return false;
      }

      const userWithPassword = await this.getUserWithPassword(user.email, true);
      if (!userWithPassword) {
        return false;
      }

      // Verify old password
      const isValidOldPassword = await this.verifyPassword(oldPassword, userWithPassword.password);
      if (!isValidOldPassword) {
        return false;
      }

      // Hash and update new password
      const hashedNewPassword = await this.hashPassword(newPassword);
      await this.updateUserPassword(userId, hashedNewPassword);

      return true;
    } catch (error) {
      return false;
    }
  }

  async generateRefreshToken(userId: string, deviceInfo?: LoginDeviceInfo): Promise<string> {

    if (deviceInfo?.userAgent === '42-oauth') {
      await this.cleanupOAuthTokens(userId, '42-oauth', deviceInfo);
    } else if (deviceInfo?.userAgent === 'google-oauth') {
      await this.cleanupOAuthTokens(userId, 'google-oauth', deviceInfo);
    } else if (deviceInfo?.userAgent) {
      await this.cleanupDeviceTokens(userId, deviceInfo);
    }
    
    // Generate a unique refresh token
    const refreshTokenValue = jwt.sign(
      { userId, type: 'refresh' },
      this.getJwtSecret(),
      { expiresIn: '30d' } 
    );

    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshTokenValue,
        deviceInfo: deviceInfo?.deviceInfo,
        userAgent: deviceInfo?.userAgent,
        ipAddress: deviceInfo?.ipAddress,
        location: deviceInfo?.location,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        lastUsedAt: new Date(),
      },
    });

    return refreshTokenValue;
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string } | null> {
    try {
      
      
      // Find refresh token in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { 
          token: refreshToken,
        },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        return null;
      }

      // If token is inactive, it might have been used before (token reuse attack)
      if (!storedToken.isActive) {
        // Log security incident and revoke all user tokens
        logger.warn(`Refresh token reuse detected for user ${storedToken.userId}`);
        return null;
      }

      const decoded = jwt.verify(refreshToken, this.getJwtSecret()) as any;
      if (decoded.userId !== storedToken.userId) {
        return null;
      }

      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { lastUsedAt: new Date() },
      });

      const newAccessToken = this.generateAccessToken(storedToken.userId);

      // Optionally rotate refresh token (recommended for security)
      const tokenAge = Date.now() - storedToken.createdAt.getTime();
      const shouldRotate = tokenAge > (7 * 24 * 60 * 60 * 1000); // 7 days
      if (shouldRotate) {
        const newRefreshToken = await this.rotateRefreshToken(storedToken.id, storedToken.userId, {
        deviceInfo: storedToken.deviceInfo,
        userAgent: storedToken.userAgent,
        ipAddress: storedToken.ipAddress,
        location: storedToken.location,
        });
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
      }

      // edit lastUsedAt only if not rotating (refresh for security)
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { lastUsedAt: new Date() },
      });

      return { 
        accessToken: newAccessToken, 
      };
    } catch (error) {
      return null;
    }
  }

  private async rotateRefreshToken(oldTokenId: string, userId: string, deviceInfo: any): Promise<string> {
    // Use a transaction to ensure atomicity
    return await prisma.$transaction(async (tx: any) => {
      // Delete old token (more secure than just deactivating)
      await tx.refreshToken.delete({
        where: { id: oldTokenId }
      });

      // Create new refresh token
      const newRefreshToken = jwt.sign(
        { userId, type: 'refresh' },
        this.getJwtSecret(),
        { expiresIn: '30d' }
      );

      await tx.refreshToken.create({
        data: {
          userId,
          token: newRefreshToken,
          deviceInfo: deviceInfo.deviceInfo,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true
        },
      });

      return newRefreshToken;
    });
  }

  async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { isActive: false },
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    
    
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  async revokeAllUserTokensExcept(userId: string, excludeToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, token: { not: excludeToken } },
      data: { isActive: false },
    });
  }

  async getUserActiveDevices(userId: string, currentRefreshToken: string | null): Promise<any[]> {
    
    const refreshTokens = await prisma.refreshToken.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        token: true,
        deviceInfo: true,
        userAgent: true,
        ipAddress: true,
        lastUsedAt: true,
        location: true,
        createdAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });

  

    return refreshTokens.map((d : any) => ({
      id: d.id,
      deviceInfo: d.deviceInfo,
      userAgent: d.userAgent,
      ipAddress: d.ipAddress,
      lastUsedAt: d.lastUsedAt,
      createdAt: d.createdAt,
      token: d.token,
      location: d.location,
      isCurrentDevice: currentRefreshToken && d.token === currentRefreshToken,
    }));
  }

  async initiatePasswordReset(email: string, username: string): Promise<boolean> {

    // Check if user exists with either email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (!user) {
      return false;
    }

    // Generate password reset token
    const token = this.generatePasswordResetToken(user.id);

    // Send password reset email
    await this.sendPasswordResetEmail(user.email, token);

    return true;
  }

  private generatePasswordResetToken(userId: string): string {
    return jwt.sign(
      { userId, purpose: 'password_reset' },
      this.getJwtSecret(),
      { expiresIn: '1h' } // 1 hour expiry
    );
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const url = `${config.frontendUrl}/auth/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.from.email,
        pass: config.email.smtp.pass
      }
    });
    
    await transporter.sendMail({
      from: config.email.from.email,
      to: email,
      subject: 'Password Reset - LeeTube',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <a href="${url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
            Reset Password
          </a>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        </div>
      `,
      text: `You requested a password reset. Use this link to reset your
      password: ${url}`
    });
}

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, this.getJwtSecret()) as any;
      
      if (decoded.purpose !== 'password_reset') {
        throw new Error('Invalid token purpose');
      }

      const userId = decoded.userId;
      if (!userId) {
        throw new Error('Invalid token: no userId found');
      }
      
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Hash and update new password
      const hashedNewPassword = await this.hashPassword(newPassword);
      await this.updateUserPassword(userId, hashedNewPassword);
      return true;
    }
    catch (error) {
      logger.error('Password reset failed:', error);
      return false;
    }
  }


  private getJwtSecret(): string {
    return config.jwt.secret || 'fallback-secret-for-development';
  }

  private async getUserWithPassword(emailOrUsername: string, isEmail: boolean): Promise<any> {
    // Direct Prisma call to get password field
    const whereClause = isEmail 
      ? { email: emailOrUsername, isActive: true }
      : { username: emailOrUsername, isActive: true };
    
    return prisma.user.findUnique({
      where: whereClause,
      select: {
        id: true,
        email: true,
        password: true,
        username: true
      }
    });
  }

  private async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  }

  /**
   * Clean up expired refresh tokens for all users
   */
  async cleanupExpiredRefreshTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    
    return result.count;
  }

  /**
   * Clean up all refresh tokens for a specific user (useful for logout all devices)
   */
  async revokeAllUserRefreshTokens(userId: string): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: { userId }
    });
    
    return result.count;
  }

  /**
   * Smart device-aware token cleanup strategy
   * Balances security with multi-device usability
   */
  private async cleanupDeviceTokens(userId: string, deviceInfo: LoginDeviceInfo): Promise<void> {
    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);
    
    // Strategy 1: Same device/browser - replace old token (prevent session hijacking)
    if (deviceFingerprint) {
      await prisma.refreshToken.deleteMany({
        where: {
          userId,
          deviceInfo: deviceFingerprint,
          isActive: true
        }
      });
    }
    
    // Strategy 2: Enforce global user token limits (prevent token hoarding)
    const totalActiveTokens = await prisma.refreshToken.count({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    // If user has more than 10 active tokens across all devices, clean up oldest
    if (totalActiveTokens >= 10) {
      const oldestTokens = await prisma.refreshToken.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        orderBy: { lastUsedAt: 'asc' },
        take: Math.max(1, totalActiveTokens - 9) // Keep 9 most recent
      });

      if (oldestTokens.length > 0) {
        await prisma.refreshToken.deleteMany({
          where: {
            id: { in: oldestTokens.map((t: any) => t.id) }
          }
        });
      }
    }
  }

  /**
   * Generate device fingerprint for same-device detection
   * Combines User-Agent with other identifying factors
   */
  private generateDeviceFingerprint(deviceInfo: LoginDeviceInfo): string | null {
    if (!deviceInfo.userAgent) return null;
    
    // Create a more stable device identifier
    // Note: This is simplified - in production you might want more sophisticated fingerprinting
    const browserBase = deviceInfo.userAgent.split(' ')[0]; // Get browser type
    const deviceType = this.extractDeviceType(deviceInfo.userAgent);
    
    return `${browserBase}_${deviceType}_${deviceInfo.ipAddress || 'unknown'}`;
  }

  /**
   * Extract device type from User-Agent for fingerprinting
   */
  private extractDeviceType(userAgent: string): string {
    if (userAgent.includes('Mobile')) return 'mobile';
    if (userAgent.includes('Tablet')) return 'tablet';
    if (userAgent.includes('Windows')) return 'windows';
    if (userAgent.includes('Mac')) return 'mac';
    if (userAgent.includes('Linux')) return 'linux';
    return 'unknown';
  }

  /**
   * Device-aware token cleanup for OAuth providers
   * Allows multiple devices but prevents same-device token accumulation
   */
  private async cleanupOAuthTokens(userId: string, oauthProvider: string, deviceInfo: LoginDeviceInfo): Promise<void> {
    // For OAuth: Allow multiple devices but limit per device
    // This gives better UX than the old "one token per provider" approach
    
    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);
    
    if (deviceFingerprint) {
      // Strategy 1: Same device/browser - replace old OAuth token for this provider
      await prisma.refreshToken.deleteMany({
        where: {
          userId,
          userAgent: oauthProvider,
          deviceInfo: deviceFingerprint,
          isActive: true
        }
      });
    }
    
    // Strategy 2: Limit OAuth tokens per provider (max 5 devices per OAuth provider)
    const providerTokenCount = await prisma.refreshToken.count({
      where: {
        userId,
        userAgent: oauthProvider,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    if (providerTokenCount >= 5) {
      // Clean up oldest tokens for this OAuth provider
      const oldestTokens = await prisma.refreshToken.findMany({
        where: {
          userId,
          userAgent: oauthProvider,
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        orderBy: { lastUsedAt: 'asc' },
        take: Math.max(1, providerTokenCount - 4) // Keep 4 most recent
      });

      if (oldestTokens.length > 0) {
        await prisma.refreshToken.deleteMany({
          where: {
            id: { in: oldestTokens.map((t: any) => t.id) }
          }
        });
      }
    }
  }

  /**
   * Check if input string is in email format
   */
  private isEmailFormat(emailOrUsername: string): boolean {
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailOrUsername);
  }

  /**
   * Cleanup expired refresh tokens (for cron job)
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isActive: false }
          ]
        }
      });
      
      logger.info(`Cleaned up ${result.count} expired/inactive refresh tokens`);
    } catch (error) {
      logger.error('Failed to cleanup expired tokens:', error);
      throw error;
    }
  }
}
