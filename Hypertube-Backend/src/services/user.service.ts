import { prisma } from '@/shared/database/connection';
import { Service, IService } from '@/shared/core/service-container';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto, 
  PublicUserDto 
} from '@/shared/types/dtos';
import { logger } from '@/shared/utils/logger';

@Service()
export class UserService implements IService {

  constructor() {
    // Initialization if needed
    logger.info('User Service initialized');
  }

  async createUser(userData: CreateUserDto): Promise<UserResponseDto> {
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        picture: userData.picture,
        emailVerified: userData.emailVerified || false,
        oauthProvider: userData.oauthProvider,
        oauthId: userData.oauthId,
      }
    });

    return this.mapToUserResponse(user);
  }

  async getUserById(id: string): Promise<UserResponseDto | null> {
    const user = await prisma.user.findUnique({
      where: { id, isActive: true }
    });

    return user ? this.mapToUserResponse(user) : null;
  }

  async getUserByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await prisma.user.findUnique({
      where: { email, isActive: true }
    });

    return user ? this.mapToUserResponse(user) : null;
  }

  async getUserByUsername(username: string): Promise<UserResponseDto | null> {
    const user = await prisma.user.findUnique({
      where: { username, isActive: true }
    });

    return user ? this.mapToUserResponse(user) : null;
  }

  async updateUser(id: string, updateData: UpdateUserDto): Promise<UserResponseDto | null> {
    try {
      // Prevent updating to an email or username that already exists
      if (updateData.email) {
        const existingByEmail = await prisma.user.findUnique({
          where: { email: updateData.email }
        });
        if (existingByEmail && existingByEmail.id !== id) {
          throw new Error('Email already in use');
        }
      }
      if (updateData.username) {
        const existingByUsername = await prisma.user.findUnique({
          where: { username: updateData.username }
        });
        if (existingByUsername && existingByUsername.id !== id) {
          throw new Error('Username already in use');
        }
      }

      // Edit whatever fields are provided in updateData excluding pasword

      if (Object.keys(updateData).length === 0) {
        return this.getUserById(id); // Nothing to update, return current user data
      }

      if(updateData.picture === undefined) {
        delete updateData.picture; // Prevent overwriting picture with undefined
      }
      if(updateData.firstName === undefined) {
        delete updateData.firstName; // Prevent overwriting firstName with undefined
      }
      if(updateData.lastName === undefined) {
        delete updateData.lastName; // Prevent overwriting lastName with undefined
      }
      if(updateData.preferredLanguage === undefined) {
        delete updateData.preferredLanguage; // Prevent overwriting preferredLanguage with undefined
      }
      if(updateData.email === undefined) {
        delete updateData.email; // Prevent overwriting email with undefined
      }

      // check if user use oAuthProvider, if so prevent updating email and username
      const checkUser = await prisma.user.findUnique({
        where: { id, isActive: true }
      });

      if (!checkUser) {
        return null; // User not found
      }

      if (checkUser.oauthProvider) {
        if (updateData.email && updateData.email !== checkUser.email) {
          throw new Error('Cannot change email for OAuth users');
        }
        if (updateData.username && updateData.username !== checkUser.username) {
          throw new Error('Cannot change username for OAuth users');
        }
      }

      const user = await prisma.user.update({
        where: { id, isActive: true },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      return this.mapToUserResponse(user);
    } catch (error) {
      return error instanceof Error ? Promise.reject(error) : null;
    }
  }

  async deactivateUser(id: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() }
    });
  }

  async updateEmailVerified(id: string): Promise<void> {
    await prisma.user.update(
      {
        where: {id},
        data: {
          emailVerified: true
        }
      }
    )
  }

  async getUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'username' | 'firstName' | 'lastName' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ users: UserResponseDto[]; total: number; totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    
    const whereClause: any = { isActive: true };
    
    if (search) {
      whereClause.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return {
      users: users.map((user: any) => this.mapToUserResponse(user)),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Helper methods
  private mapToUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture,
      preferredLanguage: user.preferredLanguage,
      emailVerified: user.emailVerified || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  
  mapToPublicUser(user: any): PublicUserDto {
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt
    };
  }

  async updateUserOAuthInfo(userId: string, provider: string, oauthData: any): Promise<void> {
    // Update user with OAuth information
    await prisma.user.update({
      where: { id: userId },
      data: {
        oauthProvider: provider,
        oauthId: oauthData.googleId || oauthData.school42Id || oauthData.id,
        updatedAt: new Date()
      }
    });
    
    // Store OAuth tokens in the OAuthToken table
    if (oauthData.accessToken) {
      await this.upsertOAuthToken(userId, provider, oauthData);
    }
  }

  async upsertOAuthToken(userId: string, provider: string, tokenData: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }): Promise<void> {
    const expiresAt = tokenData.expiresIn 
      ? new Date(Date.now() + tokenData.expiresIn * 1000)
      : null;

    await prisma.oAuthToken.upsert({
      where: {
        unique_user_provider: {
          userId,
          provider
        }
      },
      update: {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt,
        updatedAt: new Date()
      },
      create: {
        userId,
        provider,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenType: 'Bearer',
        expiresAt,
      }
    });
  }

  async getOAuthToken(userId: string, provider: string): Promise<any> {
    return prisma.oAuthToken.findUnique({
      where: {
        unique_user_provider: {
          userId,
          provider
        }
      }
    });
  }

  async getAllOAuthTokens(): Promise<any[]> {
    return prisma.oAuthToken.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      }
    });
  }
}
