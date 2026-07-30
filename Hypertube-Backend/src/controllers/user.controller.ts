import { Request, Response, NextFunction } from 'express';
import { getService } from '@/shared/core/service-container';
import { UserService } from '@/services/user.service';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto 
} from '@/shared/types/dtos';
import path from 'path';
import fs from 'fs';
import { logger } from '@/shared/utils/logger';

export interface GetUsersQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: 'username' | 'firstName' | 'lastName' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = getService<UserService>('UserService');
  }

  /**
   * Get all users with pagination and search
   * GET /api/users
   */
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query as GetUsersQuery;

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

      const result = await this.userService.getUsers({
        page: pageNum,
        limit: limitNum,
        search,
        sortBy,
        sortOrder
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user
   * GET /api/users/me
   */

  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      const user = await this.userService.getUserById((req as any).user?.id || '');

      if (!user) {
        res.status(401).json({ 
          message: 'Not authenticated' 
        });
        return;
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await this.userService.getUserById(id);
      
      if (!user) {
        res.status(404).json({ 
          message: 'User not found' 
        });
        return;
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by username
   * GET /api/users/username/:username
   */
  async getUserByUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username } = req.params;
      
      const user = await this.userService.getUserByUsername(username);
      
      if (!user) {
        res.status(404).json({ 
          message: 'User not found' 
        });
        return;
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  }


  /**
   * Update user profile
   * PUT /api/users/:id
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateUserDto = req.body;
      const currentUser = req.user as UserResponseDto;

      updateData.username = updateData.username?.toLocaleLowerCase().trim();
      updateData.email = updateData.email?.toLocaleLowerCase().trim();
      
      if (currentUser.id !== id) {
        res.status(403).json({ 
          message: 'You can only update your own profile' 
        });
        return;
      }
      
      const user = await this.userService.updateUser(id, updateData);
      
      if (!user) {
        res.status(404).json({ 
          message: 'You cannot update user data!' 
        });
        return;
      }
      
      res.json({
        message: 'User updated successfully',
        user
      });
    } catch (error: any) {
      if (error.message.includes('already exists') || error.code === 'P2002') {
        res.status(409).json({ 
          message: 'Username or email already taken' 
        });
        return;
      }
      else if (error.message.includes('Cannot change') || error.code === 'P2003') {
        res.status(403).json({ 
          message: 'Cannot change OAuth user email or username' 
        });
        return;
      }
      next(error);
    }
  }

  /** 
   * Upload user profile picture
   * POST /api/users/:id/picture
   */
  async uploadProfilePicture(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const currentUser = req.user as UserResponseDto;
      
      if (currentUser.id !== id) {
        res.status(403).json({ 
          message: 'You can only update your own profile picture' 
        });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ 
          message: 'No file uploaded' 
        });
        return;
      }

      const uploadsDir = '/app/uploads';
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }      
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}_${file.originalname}`;
      const uploadPath = path.join(uploadsDir, uniqueFilename);
      fs.writeFileSync(uploadPath, file.buffer);
      
      const user = await this.userService.updateUser(id, {
        picture: `/uploads/${uniqueFilename}`
      });
      
      if (!user) {
        res.status(404).json({ 
          message: 'User not found' 
        });
        return;
      }
      
      res.json({
        message: 'Profile picture updated successfully',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * /api/users/:id/remove-picture
   * DELETE user profile picture
   */

  async removeProfilePicture(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const currentUser = req.user as UserResponseDto;
      
      if (currentUser.id !== id) {
        res.status(403).json({ 
          message: 'You can only remove your own profile picture' 
        });
        return;
      }

      fs.readdir('/app/uploads', (err, files) => {
        if (err) {
          logger.error('Could not list the directory.', err);
          return;
        }

        files.forEach((file, index) => {
          const filePath = path.join('/app/uploads', file);

          fs.stat(filePath, (error, stat) => {
            if (error) {
              logger.error('Error stating file.', error);
              return;
            }

            if (file.includes(id)) {
              fs.unlink(filePath, (err) => {
                if (err) {
                  logger.error('Error deleting file.', err);
                } else {
                  logger.info(`Deleted file: ${filePath}`);
                }
              });
            }
          });
        });
      });

      const user = await this.userService.updateUser(id, {
        picture: null
      });
      
      if (!user) {
        res.status(404).json({ 
          message: 'User not found' 
        });
        return;
      }
      
      res.json({
        message: 'Profile picture removed successfully',
        user
      });
    } catch (error) {
      next(error);
    }
  }



  /**
   * Update user last login
   * POST /api/users/:id/last-login
   */
  async updateLastLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const currentUser = req.user as UserResponseDto;
      
      if (currentUser.id !== id) {
        res.status(403).json({ 
          message: 'Unauthorized' 
        });
        return;
      }
      
      await this.userService.updateLastLogin(id);
      
      res.json({
        message: 'Last login updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search users
   * GET /api/users/search
   */
  // async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  //   try {
  //     const { q: query, page = '1', limit = '20' } = req.query as {
  //       q?: string;
  //       page?: string;
  //       limit?: string;
  //     };
      
  //     if (!query || query.trim().length < 2) {
  //       res.status(400).json({ 
  //         message: 'Search query must be at least 2 characters long' 
  //       });
  //       return;
  //     }
      
  //     const pageNum = Math.max(1, parseInt(page));
  //     const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      
  //     const result = await this.userService.getUsers({
  //       page: pageNum,
  //       limit: limitNum,
  //       search: query.trim(),
  //       sortBy: 'username',
  //       sortOrder: 'asc'
  //     });
      
  //     res.json(result);
  //   } catch (error) {
  //     next(error);
  //   }
  // }

}
