import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateToken } from "server/src/shared/middleware/auth";

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *                 minLength: 1
 *                 maxLength: 100
 *               lastName:
 *                 type: string
 *                 example: Doe
 *                 minLength: 1
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *                   example:
 *                     status: 200
 *                     success: true
 *                     message: Account created successfully
 *                     data:
 *                       user:
 *                         id: "uuid-string"
 *                         firstName: "John"
 *                         lastName: "Doe"
 *                         email: "john@example.com"
 *                         role: "customer"
 *                         tier: "free"
 *                         profileComplete: false
 *                         profileData: null
 *                         createdAt: "2024-01-01T00:00:00Z"
 *                         updatedAt: "2024-01-01T00:00:00Z"
 *                       tokens:
 *                         accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                         refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/signup", (req, res) => authController.signup(req, res));

router.post("/verify-email", (req, res) =>
	authController.verifyEmail(req, res),
);

router.post("/resend-verification-otp", (req, res) =>
	authController.resendVerificationOtp(req, res),
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get access tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *                   example:
 *                     status: 200
 *                     success: true
 *                     message: Login successful
 *                     data:
 *                       id: "uuid-string"
 *                       firstName: "John"
 *                       lastName: "Doe"
 *                       email: "john@example.com"
 *                       emailVerified: false
 *                       provider: "manual"
 *                       providerId: null
 *                       avatar: null
 *                       role: "customer"
 *                       tier: "free"
 *                       isActive: true
 *                       profileComplete: true
 *                       profileData:
 *                         id: "uuid-string"
 *                         userId: "uuid-string"
 *                         gender: "male"
 *                         birthday: "1990-01-15T00:00:00Z"
 *                         diagnosisDate: "2020-05-10T00:00:00Z"
 *                         weight: "70"
 *                         height: "175"
 *                         diabetesType: "type2"
 *                         createdAt: "2024-01-01T00:00:00Z"
 *                         updatedAt: "2024-01-01T00:00:00Z"
 *                       createdAt: "2024-01-01T00:00:00Z"
 *                       updatedAt: "2024-01-01T00:00:00Z"
 *                       tokens:
 *                         accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                         refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             examples:
 *               customer:
 *                 summary: Customer user
 *                 value:
 *                   status: 200
 *                   success: true
 *                   message: Profile retrieved successfully
 *                   data:
 *                     id: "uuid-string"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     email: "john@example.com"
 *                     emailVerified: false
 *                     provider: "manual"
 *                     providerId: null
 *                     avatar: null
 *                     role: "customer"
 *                     tier: "free"
 *                     isActive: true
 *                     profileComplete: true
 *                     profileData:
 *                       id: "uuid-string"
 *                       userId: "uuid-string"
 *                       gender: "male"
 *                       birthday: "1990-01-15T00:00:00Z"
 *                       diagnosisDate: "2020-05-10T00:00:00Z"
 *                       weight: "70"
 *                       height: "175"
 *                       diabetesType: "type2"
 *                       createdAt: "2024-01-01T00:00:00Z"
 *                       updatedAt: "2024-01-01T00:00:00Z"
 *                     createdAt: "2024-01-01T00:00:00Z"
 *                     updatedAt: "2024-01-01T00:00:00Z"
 *                     tokens:
 *                       accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               physician:
 *                 summary: Physician user
 *                 value:
 *                   status: 200
 *                   success: true
 *                   message: Profile retrieved successfully
 *                   data:
 *                     id: "uuid-string"
 *                     firstName: "Alice"
 *                     lastName: "Smith"
 *                     email: "alice@example.com"
 *                     emailVerified: true
 *                     provider: "manual"
 *                     providerId: null
 *                     avatar: null
 *                     role: "physician"
 *                     tier: "paid"
 *                     isActive: true
 *                     profileComplete: true
 *                     profileData:
 *                       id: "uuid-string"
 *                       userId: "uuid-string"
 *                       specialtyId: "uuid-string"
 *                       specialty: "Endocrinology"
 *                       practiceStartDate: "2010-05-01T00:00:00Z"
 *                       consultationFee: "100"
 *                       imageUrl: "https://example.com/physician.jpg"
 *                       createdAt: "2024-01-01T00:00:00Z"
 *                       updatedAt: "2024-01-01T00:00:00Z"
 *                     createdAt: "2024-01-01T00:00:00Z"
 *                     updatedAt: "2024-01-01T00:00:00Z"
 *                     tokens:
 *                       accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               incomplete:
 *                 summary: Profile incomplete (profileData is null)
 *                 value:
 *                   status: 200
 *                   success: true
 *                   message: Profile retrieved successfully
 *                   data:
 *                     id: "uuid-string"
 *                     firstName: "Joe"
 *                     lastName: "Bloggs"
 *                     email: "joe@example.com"
 *                     emailVerified: false
 *                     provider: "manual"
 *                     providerId: null
 *                     avatar: null
 *                     role: "customer"
 *                     tier: "free"
 *                     isActive: true
 *                     profileComplete: false
 *                     profileData: null
 *                     createdAt: "2024-01-01T00:00:00Z"
 *                     updatedAt: "2024-01-01T00:00:00Z"
 *                     tokens:
 *                       accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", (req, res) => authController.login(req, res));

/**
 * @swagger
 * /api/auth/verify-2fa:
 *   post:
 *     summary: Verify two-factor authentication code during login
 *     tags: [Authentication]
 *     description: Verifies the 2FA code after initial login credentials are validated
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               token:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "123456"
 *                 description: 6-digit TOTP code from authenticator app or backup code
 *     responses:
 *       200:
 *         description: 2FA verified successfully, login complete
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Unauthorized - invalid verification code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/verify-2fa", (req, res) =>
	authController.verify2FALogin(req, res),
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Authentication]
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
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TokenPair'
 *       401:
 *         description: Unauthorized - invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/refresh", (req, res) => authController.refreshTokens(req, res));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and invalidate refresh token
 *     tags: [Authentication]
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
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/logout", (req, res) => authController.logout(req, res));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset token
 *     tags: [Authentication]
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
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/forgot-password", (req, res, next) =>
	authController.forgotPassword(req, res, next),
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: reset-token-from-email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewSecurePass123!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - invalid token or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Reset token not found or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/reset-password", (req, res) =>
	authController.resetPassword(req, res),
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: OldSecurePass123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewSecurePass123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - invalid old password or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/change-password", authenticateToken, (req, res) =>
	authController.changeUserPassword(req, res),
);

export { router as authRoutes };
