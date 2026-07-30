import { Router, Request, Response, NextFunction } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { authenticate } from '../shared/middleware/auth.middleware';
import { asyncHandler } from '@/shared/utils/async.handler';
import { validate } from '@/shared/middleware/validation.middleware';
import { commentSchema, updateCommentSchema } from '@/shared/validation/schemas';

const router: Router = Router();
const commentController = new CommentController();

/**
 * @swagger
 * /api/comments/health:
 *   get:
 *     summary: Comments module health check
 *     tags: [Comments]
 *     responses:
 *       200:
 *         description: Comments module is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 module:
 *                   type: string
 *                   example: comments
 *                 status:
 *                   type: string
 *                   example: OK
 */
// Health check - a very specific route, can be at the top.
router.get('/health', (req: Request, res: Response) => {
  res.json({ module: 'comments', status: 'OK' });
});

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: Get recent comments
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of recent comments to return
 *     responses:
 *       200:
 *         description: Recent comments retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               comments:
 *                 - id: "123"
 *                   content: "Great movie!"
 *                   userId: "user123"
 *                   movieId: "movie123"
 *                   createdAt: "2023-01-01T00:00:00Z"
 *               count: 1
 *       500:
 *         description: Failed to fetch recent comments
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal server error"
 */
// Root path for recent comments - also very specific.
router.get('/', 
  asyncHandler(commentController.getRecentComments.bind(commentController))
);

/**
 * @swagger
 * /api/comments/me:
 *   get:
 *     summary: Get current user's comments
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of comments per page
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order for comments
 *     responses:
 *       200:
 *         description: User comments retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               comments:
 *                 - id: "123"
 *                   content: "Great movie!"
 *                   movieId: "movie123"
 *                   createdAt: "2023-01-01T00:00:00Z"
 *               pagination:
 *                 page: 1
 *                 limit: 20
 *                 total: 5
 *                 pages: 1
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             example:
 *               message: "Authentication required"
 *       500:
 *         description: Failed to fetch user comments
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal server error"
 */
// Specific static path "/me" must come before the generic "/:id"
router.get('/me', 
  authenticate, 
  asyncHandler(commentController.getMyComments.bind(commentController))
);

/**
 * @swagger
 * /api/comments/movie/{movieId}:
 *   get:
 *     summary: Get comments for a movie
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of comments per page
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order for comments
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               comments:
 *                 - id: "1"
 *                   content: "Great movie!"
 *                   userId: "user123"
 *                   movieId: "movie123"
 *                   createdAt: "2023-01-01T00:00:00Z"
 *               pagination:
 *                 page: 1
 *                 limit: 20
 *                 total: 100
 *                 pages: 5
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             example:
 *               error: "Movie not found"
 *       500:
 *         description: Failed to fetch comments
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal server error"
 */
// Specific path with prefix "/movie/:movieId" must come before the generic "/:id"
router.get('/movie/:movieId', 
  authenticate, 
  asyncHandler(commentController.getMovieComments.bind(commentController))
);

/**
 * @swagger
 * /api/comments/movie/{movieId}:
 *   post:
 *     summary: Create a comment for a movie
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: This is a great movie!
 *           example:
 *             content: "This movie has incredible cinematography and an amazing storyline!"
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Comment created successfully"
 *               comment:
 *                 id: "123"
 *                 content: "This is a great movie!"
 *                 userId: "user123"
 *                 movieId: "movie123"
 *                 createdAt: "2023-01-01T00:00:00Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               message: "Comment content is required"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: "Authentication required"
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Movie not found"
 *       500:
 *         description: Failed to create comment
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal server error"
 */
// NOTE: You might want to validate against `commentSchema` here instead of `updateCommentSchema`.
router.post('/movie/:movieId', 
  validate(commentSchema), 
  authenticate, 
  asyncHandler(commentController.createComment.bind(commentController))
);

/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: Get comment by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               id: "123"
 *               content: "This is a great movie!"
 *               userId: "user123"
 *               movieId: "movie123"
 *               createdAt: "2023-01-01T00:00:00Z"
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Comment not found"
 *       500:
 *         description: Failed to fetch comment
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal server error"
 */
router.get('/:id', 
  authenticate, 
  asyncHandler(commentController.getCommentById.bind(commentController))
);

/**
 * @swagger
 * /api/comments/{id}:
 *   patch:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *           example:
 *             content: "Updated comment: This movie is even better than I thought!"
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Comment updated successfully"
 *               comment:
 *                 id: "123"
 *                 content: "Updated comment content"
 *                 userId: "user123"
 *                 movieId: "movie123"
 *                 updatedAt: "2023-01-01T00:00:00Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               message: "Comment content is required"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             example:
 *               message: "Authentication required"
 *       404:
 *         description: Comment not found or no permission
 *         content:
 *           application/json:
 *             example:
 *               message: "Comment not found or you do not have permission to edit it"
 *       500:
 *         description: Failed to update comment
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal server error"
 */
router.put('/:id', 
  validate(updateCommentSchema), 
  authenticate, 
  asyncHandler(commentController.updateComment.bind(commentController))
);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Comment deleted successfully"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             example:
 *               message: "Authentication required"
 *       404:
 *         description: Comment not found or no permission
 *         content:
 *           application/json:
 *             example:
 *               message: "Comment not found or you do not have permission to delete it"
 *       500:
 *         description: Failed to delete comment
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal server error"
 */
router.delete('/:id', 
  authenticate, 
  asyncHandler(commentController.deleteComment.bind(commentController))
);


export default router;