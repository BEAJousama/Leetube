import { Request, Response, NextFunction } from 'express';
import { getService } from '@/shared/core/service-container';
import { CommentService } from '@/services/comment.service';
import { 
  CreateCommentDto, 
  UpdateCommentDto, 
  CommentResponseDto,
  UserResponseDto
} from '@/shared/types/dtos';

export interface GetCommentsQuery {
  page?: string;
  limit?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CommentController {
  private commentService: CommentService;

  constructor() {
    this.commentService = getService<CommentService>('CommentService');
  }

  /**
   * Create a new comment for a movie
   * POST /api/movies/:movieId/comments
   */
  async createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { movieId } = req.params;
      const commentData: CreateCommentDto = {
        ...req.body,
        movieId
      };
      const user = req.user as UserResponseDto;
      
      if (!user) {
        res.status(401).json({ 
          message: 'Authentication required' 
        });
        return;
      }
      
      if (!commentData.content || commentData.content.trim().length === 0) {
        res.status(400).json({ 
          message: 'Comment content is required' 
        });
        return;
      }
      
      if (commentData.content.length > 1000) {
        res.status(400).json({ 
          message: 'Comment content must be less than 1000 characters' 
        });
        return;
      }
      
      const comment = await this.commentService.createComment(user.id, commentData);
      
      res.status(201).json({
        message: 'Comment created successfully',
        comment
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ 
          message: 'Movie not found' 
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get comments for a movie
   * GET /api/movies/:movieId/comments
   */
  async getMovieComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { movieId } = req.params;
      const {
        page = '1',
        limit = '20',
        sortOrder = 'desc'
      } = req.query as GetCommentsQuery;

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

      const result = await this.commentService.getCommentsByMovie(movieId, {
        page: pageNum,
        limit: limitNum,
        sortOrder
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get comment by ID
   * GET /api/comments/:id
   */
  async getCommentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const comment = await this.commentService.getCommentById(id);
      
      if (!comment) {
        res.status(404).json({ 
          message: 'Comment not found' 
        });
        return;
      }
      
      res.json(comment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get comments by user
   * GET /api/users/:userId/comments
   */
  // async getUserComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  //   try {
  //     const { userId } = req.params;
  //     const {
  //       page = '1',
  //       limit = '20',
  //       sortOrder = 'desc'
  //     } = req.query as GetCommentsQuery;

  //     const pageNum = Math.max(1, parseInt(page));
  //     const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  //     const result = await this.commentService.getCommentsByUser(userId, {
  //       page: pageNum,
  //       limit: limitNum,
  //       sortOrder
  //     });

  //     res.json(result);
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  /**
   * Update a comment
   * PUT /api/comments/:id
   */
  async updateComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateCommentDto = req.body;
      const user = req.user as UserResponseDto;
      
      if (!user) {
        res.status(401).json({ 
          message: 'Authentication required' 
        });
        return;
      }
      
      if (!updateData.content || updateData.content.trim().length === 0) {
        res.status(400).json({ 
          message: 'Comment content is required' 
        });
        return;
      }
      
      if (updateData.content.length > 1000) {
        res.status(400).json({ 
          message: 'Comment content must be less than 1000 characters' 
        });
        return;
      }
      
      const comment = await this.commentService.updateComment(id, user.id, updateData);
      
      if (!comment) {
        res.status(404).json({ 
          message: 'Comment not found or you do not have permission to edit it' 
        });
        return;
      }
      
      res.json({
        message: 'Comment updated successfully',
        comment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a comment
   * DELETE /api/comments/:id
   */
  async deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = req.user as UserResponseDto;
      
      if (!user) {
        res.status(401).json({ 
          message: 'Authentication required' 
        });
        return;
      }
      
      const success = await this.commentService.deleteComment(id, user.id);
      
      if (!success) {
        res.status(404).json({ 
          message: 'Comment not found or you do not have permission to delete it' 
        });
        return;
      }
      
      res.json({
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent comments (for admin or public feed)
   * GET /api/comments/recent
   */
  async getRecentComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = '10' } = req.query;
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
      
      const comments = await this.commentService.getRecentComments(limitNum);
      
      res.json({
        comments,
        count: comments.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get my comments (current user's comments)
   * GET /api/comments/me
   */
  async getMyComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as UserResponseDto;
      const {
        page = '1',
        limit = '20',
        sortOrder = 'desc'
      } = req.query as GetCommentsQuery;
      
      if (!user) {
        res.status(401).json({ 
          message: 'Authentication required' 
        });
        return;
      }

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

      const result = await this.commentService.getCommentsByUser(user.id, {
        page: pageNum,
        limit: limitNum,
        sortOrder
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
