import { Router} from 'express';
import { MovieController } from '../controllers/movie.controller';
import { CommentController } from '../controllers/comment.controller';
import { authenticate, optionalAuthenticate } from '../shared/middleware/auth.middleware';
import { validate, validateQuery } from '../shared/middleware/validation.middleware';
import { 
  ratingSchema,
  movieSearchSchema,
  movieLibrarySchema,
  paginationQuerySchema, 
  commentSchema,
  trendingMoviesSchema
} from '../shared/validation/schemas';
import { asyncHandler } from '@/shared/utils/async.handler';
import { movieFetchSchema } from '@/shared/validation/movie.validation';


const router: Router = Router();
const movieController = new MovieController();
const commentController = new CommentController();

/**
 * @swagger
 * /api/movies/health:
 *   get:
 *     summary: Movies module health check
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Movies module is healthy
 *         content:
 *           application/json:
 *             example:
 *               status: "ok"
 *       500:
 *         description: Health check failed
 *         content:
 *           application/json:
 *             example:
 *               error: "Health check failed"
 */
router.get('/health', 
  asyncHandler(movieController.healthCheck.bind(movieController))
);

/**
 * @swagger
 * /api/movies:
 *   get:
 *     summary: Get movies from external APIs (YTS + TMDB with torrent sources)
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Results retrieved successfully (includes torrents and trailer URLs)
 *         content:
 *           application/json:
 *             example:
 *               movies:
 *                 - id: "123"
 *                   title: "Inception"
 *                   sources:
 *                     - type: "torrent"
 *                       url: "magnet:?xt=..."
 *                   trailerUrl: "https://youtube.com/..."
 *               totalResults: 1
 *       500:
 *         description: Failed to get external movies
 *         content:
 *           application/json:
 *             example:
 *               error: "Failed to get external movies"
 */
router.get('/', 
  authenticate,
  validateQuery(movieFetchSchema),
  asyncHandler(movieController.getExternalMovies.bind(movieController))
);

/**
 * @swagger
 * /api/movies/search:
 *   get:
 *     summary: Search external movies
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Movie title
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: Release year
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Genre
 *       - in: query
 *         name: cast
 *         schema:
 *           type: string
 *         description: Cast member
 *       - in: query
 *         name: director
 *         schema:
 *           type: string
 *         description: Director
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             example:
 *               movies:
 *                 - id: "123"
 *                   title: "Inception"
 *               totalResults: 1
 *       500:
 *         description: Failed to search movies
 *         content:
 *           application/json:
 *             example:
 *               error: "Failed to search movies"
 */
router.get('/search', 
  authenticate, 
  validateQuery(movieSearchSchema),
  asyncHandler(movieController.searchExternalMovies.bind(movieController))
);

/**
 * @swagger
 * /api/movies/popular:
 *   get:
 *     summary: Get popular movies from external APIs (with torrent sources)
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Popular movies retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               movies:
 *                 - id: "123"
 *                   title: "Inception"
 *                   sources:
 *                     - type: "torrent"
 *                       url: "magnet:?xt=..."
 *               totalResults: 1
 *       500:
 *         description: Failed to fetch popular movies
 *         content:
 *           application/json:
 *             example:
 *               error: "Failed to fetch popular movies"
 */
router.get('/popular', 
  authenticate, 
  validateQuery(paginationQuerySchema),
  asyncHandler(movieController.getExternalPopularMovies.bind(movieController))
);

/**
 * @swagger
 * /api/movies/top-rated:
 *   get:
 *     summary: Get top rated movies from external APIs (with torrent sources)
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Top rated movies retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               movies:
 *                 - id: "123"
 *                   title: "Inception"
 *                   sources:
 *                     - type: "torrent"
 *                       url: "magnet:?xt=..."
 *               totalResults: 1
 *       500:
 *         description: Failed to fetch top rated movies
 *         content:
 *           application/json:
 *             example:
 *               error: "Failed to fetch top rated movies"
 */
router.get('/top-rated', 
  authenticate, 
  validateQuery(paginationQuerySchema),
  asyncHandler(movieController.getExternalTopRatedMovies.bind(movieController))
);

/**
 * @swagger
 * /api/movies/trending:
 *   get:
 *     summary: Get trending movies from external APIs (with torrent sources)
 *     tags: [Movies]
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
 *           maximum: 50
 *           default: 20
 *         description: Number of movies per page
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: string
 *           enum: [day, week]
 *           default: week
 *         description: Time window for trending movies
 *     responses:
 *       200:
 *         description: Trending movies retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               movies:
 *                 - id: "123"
 *                   title: "Inception"
 *                   sources:
 *                     - type: "torrent"
 *                       url: "magnet:?xt=..."
 *               totalResults: 1
 *       500:
 *         description: Failed to fetch trending movies
 *         content:
 *           application/json:
 *             example:
 *               error: "Failed to fetch trending movies"
 */
router.get('/trending', 
  optionalAuthenticate,
  validateQuery(trendingMoviesSchema),
  asyncHandler(movieController.getExternalTrendingMovies.bind(movieController))
);

/**
 * @swagger
 * /api/movies/my-library:
 *   get:
 *     summary: Get user's movie library
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: watchlist
 *         schema:
 *           type: boolean
 *         description: Filter by watchlist status
 *       - in: query
 *         name: watched
 *         schema:
 *           type: boolean
 *         description: Filter by watched status
 *       - in: query
 *         name: favorite
 *         schema:
 *           type: boolean
 *         description: Filter by favorite status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of movies to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of movies to skip
 *     responses:
 *       200:
 *         description: User movie library retrieved successfully
 *       401:
 *         description: User authentication required
 *       500:
 *         description: Failed to get user movie library
 */
router.get('/my-library', 
  authenticate, 
  asyncHandler(movieController.getUserLibrary.bind(movieController))
);

/**
 * @swagger
 * /api/movies/my-favorites:
 *   get:
 *     summary: Get user's favorite movies
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User's favorite movies retrieved successfully
 *       401:
 *         description: User authentication required
 *       500:
 *         description: Failed to get user's favorite movies
 */
router.get('/my-favorites', 
  authenticate, 
  asyncHandler(movieController.getFavorites.bind(movieController))
);

/**
 * @swagger
 * /api/movies/{id}:
 *   get:
 *     summary: Get detailed movie information from external APIs (includes torrents, magnet links, trailers)
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: tmdbId
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB movie ID
 *     responses:
 *       200:
 *         description: Movie details retrieved successfully with streaming sources
 *         content:
 *           application/json:
 *             example:
 *               id: "123"
 *               title: "Inception"
 *               sources:
 *                 - type: "torrent"
 *                   url: "magnet:?xt=..."
 *               trailerUrl: "https://youtube.com/..."
 *       400:
 *         description: Invalid TMDB ID
 *         content:
 *           application/json:
 *             example:
 *               error: "Invalid TMDB ID"
 *       500:
 *         description: Failed to fetch movie details
 *         content:
 *           application/json:
 *             example:
 *               error: "Failed to fetch movie details"
 */
router.get('/:id', 
  authenticate, 
  asyncHandler(movieController.getExternalMovieDetails.bind(movieController))
);

/**
 * @swagger
 * /api/movies/{movieId}/add-to-library:
 *   post:
 *     summary: Add movie to user's library (imports from external if movieId is TMDB ID)
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID (database ID) or TMDB ID (will auto-import)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               watched:
 *                 type: boolean
 *                 default: false
 *               favorite:
 *                 type: boolean
 *                 default: false
 *               watchlist:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Movie added to library successfully
 *       401:
 *         description: User authentication required
 *       404:
 *         description: Movie not found
 *       500:
 *         description: Failed to add movie to library
 */
router.post('/:movieId/add-to-library', 
  validate(movieLibrarySchema),
  authenticate, 
  asyncHandler(movieController.addMovieToLibrary.bind(movieController))
);

/**
 * @swagger
 * /api/movies/{movieId}/remove-from-library:
 *   delete:
 *     summary: Remove movie from user's library
 *     tags: [Movies]
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
 *     responses:
 *       200:
 *         description: Movie removed from library successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *       401:
 *         description: User authentication required
 *         content:
 *           application/json:
 *             example:
 *               error: "Authentication required"
 *       500:
 *         description: Failed to remove movie from library
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal server error"
 */
router.delete('/:movieId/remove-from-library', 
  authenticate, 
  asyncHandler(movieController.removeFromLibrary.bind(movieController))
);

/**
 * @swagger
 * /api/movies/{movieId}/add-to-favorites:
 *   post:
 *     summary: Add movie to user's library (imports from external if movieId is TMDB ID)
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID (database ID) or TMDB ID (will auto-import)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               watched:
 *                 type: boolean
 *                 default: false
 *               favorite:
 *                 type: boolean
 *                 default: false
 *               watchlist:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Movie added to library successfully
 *       401:
 *         description: User authentication required
 *       404:
 *         description: Movie not found
 *       500:
 *         description: Failed to add movie to library
 */
router.post('/:movieId/add-to-favorites',
  authenticate, 
  asyncHandler(movieController.addMovieToFavorites.bind(movieController))
);

/**
 * @swagger
 * /api/movies/{movieId}/remove-from-favorites:
 *   delete:
 *     summary: Remove movie from user's library
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Movie removed from library successfully
 *       401:
 *         description: User authentication required
 *       500:
 *         description: Failed to remove movie from library
 */
router.delete('/:movieId/remove-from-favorites',
  authenticate,
  asyncHandler(movieController.deleteFromFavorites.bind(movieController))
);

/**
 * @swagger
 * /api/movies/{id}/rate:
 *   post:
 *     summary: Rate a movie
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *           example:
 *             rating: 8.5
 *     responses:
 *       200:
 *         description: Movie rated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *       400:
 *         description: Invalid rating
 *         content:
 *           application/json:
 *             example:
 *               error: "Invalid rating"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             example:
 *               error: "Authentication required"
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             example:
 *               error: "Movie not found"
 *       500:
 *         description: Failed to rate movie
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal server error"
 */
router.post('/:id/rate', 
  validate(ratingSchema),
  authenticate,
  asyncHandler(movieController.rateMovie.bind(movieController))
);

/**
 * @swagger
 * /api/movies/{id}/ratings:
 *   get:
 *     summary: Get movie ratings
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Movie ratings retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               ratings:
 *                 - userId: "u1"
 *                   rating: 8.5
 *               averageRating: 8.5
 *       500:
 *         description: Failed to fetch movie ratings
 *         content:
 *           application/json:
 *             example:
 *               error: "Failed to fetch movie ratings"
 */
router.get('/:id/ratings',
  authenticate,
  asyncHandler(movieController.getMovieRatings.bind(movieController))
);

/**
 * @swagger
 * /api/movies/{id}/ratings/me:
 *   get:
 *     summary: Get user's rating for a movie
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: User rating retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               userId: "u1"
 *               rating: 8.5
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             example:
 *               error: "Authentication required"
 *       404:
 *         description: No rating found
 *         content:
 *           application/json:
 *             example:
 *               error: "No rating found"
 *       500:
 *         description: Failed to fetch user rating
 *         content:
 *           application/json:
 *             example:
 *               error: "Failed to fetch user rating"
 */
router.get('/:id/ratings/me', 
  authenticate, 
  asyncHandler(movieController.getUserMovieRating.bind(movieController))
);

/**
 * @swagger
 * /api/movies/{id}/clear-rating:
 *   post:
 *     summary: Clear user's rating for a movie
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: User rating cleared successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             example:
 *               error: "Authentication required"
 *       404:
 *         description: No rating found to clear
 *         content:
 *           application/json:
 *             example:
 *               error: "No rating found to clear"
 *       500:
 *         description: Failed to clear user rating
 *         content:
 *           application/json:
 *             example:
 *               error: "Failed to clear user rating"
 */
router.post('/:id/clear-rating',
  authenticate,
  asyncHandler(movieController.clearRating.bind(movieController))
);

/**
 * @swagger
 * /api/movies/{id}:
 *   get:
 *     summary: Get a movie by ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Movie ID
 *         schema:
 *           type: string
 *         example: "1029575"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Movie details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "1029575"
 *                 title:
 *                   type: string
 *                   example: "The Family Plan"
 *                 description:
 *                   type: string
 *                   example: "Dan Morgan is many things: a devoted husband, a loving father..."
 *                 averageRating:
 *                   type: number
 *                   example: 8.5
 *                   description: Average rating from all users (1-10)
 *                 totalRatings:
 *                   type: integer
 *                   example: 42
 *                   description: Total number of ratings
 *                 userRating:
 *                   type: number
 *                   example: 9
 *                   description: Current user's rating (only when authenticated)
 *                 inLibrary:
 *                   type: boolean
 *                   example: true
 *                   description: Whether movie is in user's library (only when authenticated)
 *                 inFavorite:
 *                   type: boolean
 *                   example: false
 *                   description: Whether movie is in user's favorites (only when authenticated)
 *                 isWatched:
 *                   type: boolean
 *                   example: true
 *                   description: Whether user has watched the movie (only when authenticated)
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Movie not found"
 *       500:
 *         description: Failed to retrieve movie
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal server error"
 */
router.get('/:id', 
  authenticate, 
  asyncHandler(movieController.getMovieById.bind(movieController))
);

/**
 * @swagger
 * /api/movies/{movieId}/comments:
 *   post:
 *     summary: Add a comment to a movie
 *     tags: [Movies, Comments]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         description: Movie ID (TMDB ID)
 *         schema:
 *           type: string
 *         example: "550"
 *     security:
 *       - bearerAuth: []
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
 *                 description: Comment content
 *                 example: "This movie is amazing! The plot twist is incredible."
 *     responses:
 *       201:
 *         description: Comment created successfully (movie imported if needed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment created successfully"
 *                 comment:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             examples:
 *               emptyContent:
 *                 summary: Empty comment content
 *                 value:
 *                   message: "Comment content is required"
 *               tooLong:
 *                 summary: Comment too long
 *                 value:
 *                   message: "Comment content must be less than 1000 characters"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             example:
 *               message: "Authentication required"
 *       404:
 *         description: Movie not found and could not be imported
 *         content:
 *           application/json:
 *             example:
 *               message: "Movie with ID 550 does not exist and could not be imported from external API."
 *       500:
 *         description: Failed to create comment
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal server error"
 */
router.post('/:movieId/comments',
  validate(commentSchema),
  authenticate,
  asyncHandler(commentController.createComment.bind(commentController))
);

/**
 * @swagger
 * /api/movies/{movieId}/comments:
 *   get:
 *     summary: Get comments for a movie
 *     tags: [Movies, Comments]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         description: Movie ID
 *         schema:
 *           type: string
 *         example: "550"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of comments per page
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (newest first by default)
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Movie not found"
 */
router.get('/:movieId/comments',
  authenticate,
  asyncHandler(commentController.getMovieComments.bind(commentController))
);

export default router;
