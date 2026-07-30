import { Router, Request, Response } from 'express';
import { TorrentController } from '@/controllers/torrent.controller';
import { authenticate } from '@/shared/middleware/auth.middleware';
import { valid } from 'joi';
import { validate } from '@/shared/middleware/validation.middleware';
import { torrentSchema } from '@/shared/validation/schemas';

const router: Router = Router();
const torrentController = new TorrentController();

/**
 * @swagger
 * /api/torrent/health:
 *  get:
 *     summary: Torrent module health check
 *     tags: [Torrent]
 *     responses:
 *       200:
 *         description: Torrent module is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 module:
 *                   type: string
 *                   example: torrent
 *                 status:
 *                   type: string
 *                   example: OK
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({ module: 'torrent', status: 'OK' });
});


/**
 * @swagger
 * /api/torrent/stream:
 *   get:
 *     summary: Stream movie content
 *     tags: [Torrent]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID or download ID
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *           enum: [480p, 720p, 1080p, 4K]
 *           default: 1080p
 *         description: Streaming quality
 *       - in: query
 *         name: start
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Start position in bytes for range requests
 *       - in: query
 *         name: end
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: End position in bytes for range requests
 *     responses:
 *       200:
 *         description: Video stream
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *           video/x-matroska:
 *             schema:
 *               type: string
 *               format: binary
 *       206:
 *         description: Partial content (range request)
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *           video/x-matroska:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         description: Movie or stream not found
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to stream movie
 *         $ref: '#/components/schemas/Error'
 */
router.get('/stream', 
  torrentController.stream.bind(torrentController)
);

/**
 * @swagger
 * /api/torrent/downloadMovie:
 *   post:
 *     summary: Announce a movie torrent (start or register stream processing)
 *     tags: [Torrent]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movieId
 *             properties:
 *               movieId:
 *                 type: string
 *                 example: cuid123
 *               quality:
 *                 type: string
 *                 enum: [480p, 720p, 1080p, 4K]
 *                 default: 1080p
 *     responses:
 *       200:
 *         description: Torrent announced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     message:
 *                       type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     message:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     message:
 *                       type: string
 *       500:
 *         description: Failed to announce torrent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     message:
 *                       type: string
 */
router.post('/downloadMovie',
  validate(torrentSchema),
  torrentController.downloadMovie.bind(torrentController)
);

/**
 * @swagger
 * /api/torrent/subtitles/{movieId}/{language}.vtt:
 *   get:
 *     summary: Get subtitle file on demand (downloads and converts if missing)
 *     tags: [Torrent]
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: TMDB movie ID
 *       - in: path
 *         name: language
 *         required: true
 *         schema:
 *           type: string
 *         description: Language code (en, es, fr, de, ar)
 *     responses:
 *       200:
 *         description: Subtitle file in VTT format
 *       404:
 *         description: Subtitle not found
 */
router.get('/subtitles/:movieId/:language.vtt',
  torrentController.getSubtitle.bind(torrentController)
);


/**
 * @swagger
 * /api/torrent/stop-download:
 *   get:
 *     summary: Permanently stop torrent download but keep metadata for resuming later
 *     tags: [Torrent]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Torrent download stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Torrent download stopped successfully
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid movie ID
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized access
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/stop-download',
  torrentController.stopDownload.bind(torrentController)
);

export default router;
