import { Service, IService, getService } from '@/shared/core/service-container';
import { UserService } from './user.service';
import { MovieService } from './movie.service';
import { prisma } from '@/shared/database/connection';
import { 
  CreateCommentDto, 
  UpdateCommentDto, 
  CommentResponseDto 
} from '@/shared/types/dtos';
import { logger } from '@/shared/utils/logger';

@Service()
export class CommentService implements IService {
  private _movieService!: MovieService;
  
  private get movieService(): MovieService {
    if (!this._movieService) {
      this._movieService = getService<MovieService>('MovieService');
    }
    return this._movieService;
  }

  constructor() {
    // Get services from container after they're registered
    logger.info('Comment Service initialized');
  }

  async createComment(userId: string, commentData: CreateCommentDto): Promise<CommentResponseDto> {
    try {
      // Check if movie exists in database
      const existingMovie = await prisma.movie.findUnique({
        where: { id: commentData.movieId },
        select: { id: true, title: true }
      });

      if (!existingMovie) {
        // Movie doesn't exist, try to import it from external API
        logger.info(`Movie ${commentData.movieId} not found in database, attempting to import from TMDB`);
        
        try {
          // Parse movieId as TMDB ID and import the movie
          const tmdbId = parseInt(commentData.movieId);
          if (isNaN(tmdbId)) {
            throw new Error(`Invalid movie ID format: ${commentData.movieId}. Expected numeric TMDB ID.`);
          }

          // Import movie from external API
          await this.movieService.importMovieFromExternal(tmdbId, userId);
          logger.info(`Successfully imported movie ${commentData.movieId} from TMDB`);
        } catch (importError) {
          logger.error(`Failed to import movie ${commentData.movieId}:`, importError);
          throw new Error(`Movie with ID ${commentData.movieId} does not exist and could not be imported from external API.`);
        }
      }

      // Create the comment (movie now exists)
      const comment = await prisma.comment.create({
        data: {
          content: commentData.content,
          userId,
          movieId: commentData.movieId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              createdAt: true
            }
          }
        }
      });

      return this.mapCommentToDto(comment);
    } catch (error) {
      logger.error('Create comment error:', error);
      throw error;
    }
  }

  async getCommentById(id: string): Promise<CommentResponseDto | null> {
    
    const comment = await prisma.comment.findUnique({
      where: { id, isDeleted: false },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            createdAt: true
          }
        }
      }
    });

    return comment ? this.mapCommentToDto(comment) : null;
  }

  async getCommentsByMovie(movieId: string, options: {
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ 
    comments: CommentResponseDto[]; 
    total: number; 
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    
    const { page = 1, limit = 20, sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { movieId, isDeleted: false },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              picture: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit
      }),
      prisma.comment.count({ where: { movieId, isDeleted: false } })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      comments: comments.map((comment: any) => this.mapCommentToDto(comment)),
      total,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  }

  async getCommentsByUser(userId: string, options: {
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ comments: CommentResponseDto[]; total: number; totalPages: number }> {
    
    const { page = 1, limit = 20, sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { userId, isDeleted: false },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit
      }),
      prisma.comment.count({ where: { userId, isDeleted: false } })
    ]);

    return {
      comments: comments.map((comment: any) => this.mapCommentToDto(comment)),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateComment(id: string, userId: string, updateData: UpdateCommentDto): Promise<CommentResponseDto | null> {
    try {      
      const comment = await prisma.comment.update({
        where: { 
          id, 
          userId, // Ensure user owns the comment
          isDeleted: false 
        },
        data: {
          content: updateData.content,
          isEdited: true,
          editedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              createdAt: true
            }
          }
        }
      });

      return this.mapCommentToDto(comment);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null; // Comment not found or user doesn't own it
      }
      throw error;
    }
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    try {      
      await prisma.comment.update({
        where: { 
          id, 
          userId, // Ensure user owns the comment
          isDeleted: false 
        },
        data: { isDeleted: true }
      });

      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return false; // Comment not found or user doesn't own it
      }
      throw error;
    }
  }

  async getRecentComments(limit: number = 10): Promise<CommentResponseDto[]> {
    
    const comments = await prisma.comment.findMany({
      where: { isDeleted: false },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return comments.map((comment: any) => this.mapCommentToDto(comment));
  }

  // Helper methods
  private mapCommentToDto(comment: any): CommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      movieId: comment.movieId,
      userId: comment.userId,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        firstName: comment.user.firstName,
        picture: comment.user.picture,
        lastName: comment.user.lastName,
        createdAt: comment.user.createdAt
      },
      isEdited: comment.isEdited,
      editedAt: comment.editedAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    };
  }
}
