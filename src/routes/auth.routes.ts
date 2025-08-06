import { Router } from 'express';
import { authenticate } from '../utils/auth';
import { AuthController } from '../controllers';

const router = Router();
const authController = new AuthController();

// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Logout user
router.post('/logout', authenticate, authController.logout);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password/:token', authController.resetPassword);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

export default router;