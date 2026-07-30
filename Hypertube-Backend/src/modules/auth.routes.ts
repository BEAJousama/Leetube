import { Router, Request, Response } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { validate, validateQuery, validateParams, validateCookies } from '@/shared/middleware/validation.middleware';
import { authenticate } from '@/shared/middleware/auth.middleware';
import { oauthRateLimit } from '@/shared/middleware/oauth-rate-limit';
import { registerSchema, loginSchema, changePasswordSchema, refreshTokenSchema, 
        verifyEmailSchema, emailSchema, forgotPasswordSchema, resetPasswordSchema,
        tokenParamSchema, deviceIdParamSchema
      } from '@/shared/validation/schemas';
import { asyncHandler } from '@/shared/utils/async.handler';

const router: Router = Router();
const authController = new AuthController();

/**
 * @swagger
 * /api/auth/health:
 *   get:
 *     summary: Auth module health check
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Auth module is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 module:
 *                   type: string
 *                   example: auth
 *                 status:
 *                   type: string
 *                   example: OK
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({ module: 'auth', status: 'OK' });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: Password@123
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: User registered successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         $ref: '#/components/schemas/Error'
 */
router.post('/register',
  validate(registerSchema),
  asyncHandler(authController.register.bind(authController))
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrUsername
 *               - password
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *                 description: User's email address or username
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials
 *         $ref: '#/components/schemas/Error'
 */
router.post('/login',
  validate(loginSchema),
  asyncHandler(authController.login.bind(authController))
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logout successful
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.post('/logout',
  asyncHandler(authController.logout.bind(authController))
);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify user email with token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid or expired token
 *         $ref: '#/components/schemas/Error'
 */
router.get('/verify-email', 
  validateQuery(verifyEmailSchema), 
  asyncHandler(authController.verifyEmail.bind(authController))
);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification email sent successfully
 *       404:
 *         description: User not found or email already verified
 *         $ref: '#/components/schemas/Error'
 */
router.post('/resend-verification',
  validate(emailSchema), 
  asyncHandler(authController.resendVerificationEmail.bind(authController))
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid refresh token
 *         $ref: '#/components/schemas/Error'
 */
router.post('/refresh',
  validateCookies(refreshTokenSchema),
  asyncHandler(authController.refresh.bind(authController))
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
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
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: oldpassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: Password changed successfully
 *       400:
 *         description: Invalid current password or validation error
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.post('/change-password',
  validate(changePasswordSchema),
  authenticate,
  asyncHandler(authController.changePassword.bind(authController))
);

/**
 * @swagger
 *  /api/auth/forgot-password:
 *  post:
 *    summary: Initiate password reset process
 *    tags: [Auth]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *            properties:
 *              email:
 *                type: string
 *                format: email
 *                example: user@example.com
 *              type: string
 *              format: email
 *              example: user@example.com
 *  responses:
 *    200:
 *      description: Password reset email sent if user exists
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: If an account with that email exists, a password reset link has been sent.
 *  400:
 *    description: Validation error
 *    $ref: '#/components/schemas/Error'
 *  500:
 *    description: Failed to send email
 *    $ref: '#/components/schemas/Error'
 */
router.post('/forgot-password',
  validate(forgotPasswordSchema), 
  asyncHandler(authController.forgotPassword.bind(authController))
);


/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Reset user password using token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: Password reset successfully
 *       400:
 *         description: Invalid or expired token, or validation error
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to reset password
 *         $ref: '#/components/schemas/Error'
 */
router.post('/reset-password/:token', 
  validateParams(tokenParamSchema),
  validate(resetPasswordSchema), 
  asyncHandler(authController.resetPassword.bind(authController))
);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google',
  oauthRateLimit,
  asyncHandler(authController.googleAuth.bind(authController))
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for security
 *     responses:
 *       302:
 *         description: Redirect to frontend with tokens
 *       400:
 *         description: OAuth error
 *         $ref: '#/components/schemas/Error'
 */
router.get('/google/callback',
  asyncHandler(authController.googleCallback.bind(authController))
);

/**
 * @swagger
 * /api/auth/42:
 *   get:
 *     summary: Initiate 42 School OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to 42 School OAuth
 */
router.get('/42',
  oauthRateLimit,
  asyncHandler(authController.auth42.bind(authController))
);

/**
 * @swagger
 * /api/auth/42/callback:
 *   get:
 *     summary: 42 School OAuth callback
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from 42 School
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for security
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Error parameter if OAuth failed
 *     responses:
 *       302:
 *         description: Redirect to frontend with tokens or error
 *         headers:
 *           Location:
 *             description: Frontend URL with authentication result
 *             schema:
 *               type: string
 *               example: http://localhost:3001/auth/success?token=...&user=...&provider=42
 *       400:
 *         description: OAuth error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Authorization code not provided
 *                 details:
 *                   type: string
 *                   example: access_denied
 */
router.get('/42/callback',
  asyncHandler(authController.auth42Callback.bind(authController))
);

/**
 * @swagger
 * /api/auth/oauth-data:
 *   get:
 *     summary: Get OAuth data from HTTP-only cookies
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OAuth data retrieved successfully
 *       404:
 *         description: OAuth data not found
 */
router.get('/oauth-data',
  asyncHandler(authController.getOAuthData.bind(authController))
);

/**
 * @swagger
 * /api/auth/devices:
 *  get:
 *     summary: Get user's active devices
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active devices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 devices:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RefreshToken'
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/schemas/Error'
 */
router.get('/devices',
  authenticate,
  asyncHandler(authController.getActiveDevices.bind(authController))
);

/**
 * @swagger
 * /api/auth/devices/{deviceId}:
 *  delete:
 *    summary: Revoke refresh token for specific device
 *    tags: [Auth]
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: deviceId
 *        required: true
 *        schema:
 *          type: string
 *        description: Device/token ID to revoke
 *    responses:
 *      200:
 *        description: Device logged out successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: Device logged out successfully
 *      401:
 *        description: Unauthorized
 *        $ref: '#/components/schemas/Error'
 *      404:
 *        description: Device not found
 *        $ref: '#/components/schemas/Error'
 */
router.delete('/devices/logout-all',
  authenticate,
  asyncHandler(authController.logoutAll.bind(authController))
);

/**
 * @swagger
 * /api/auth/devices/{deviceId}:
 *  delete:
 *    summary: Revoke refresh token for specific device
 *    tags: [Auth]
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *     - in: path
 *       name: deviceId
 *       required: true
 *       schema:
 *         type: string
 *    description: Device/token ID to revoke
 *    responses:
 *      200:
 *        description: Device logged out successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: Device logged out successfully
 *      401:
 *        description: Unauthorized
 *        $ref: '#/components/schemas/Error'
 *      404:
 *        description: Device not found
 *        $ref: '#/components/schemas/Error'
 */

router.delete('/devices/:deviceId',
  authenticate,
  validateParams(deviceIdParamSchema),
  asyncHandler(authController.revokeDevice.bind(authController))
);

export default router;
