import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middleware/errorHandler';

const authService = new AuthService();

export class AuthController {
  // Register a new user
  register = asyncHandler(async (req: Request, res: Response) => {
    const { user, token } = await authService.register(req.body);
    res.status(201).json({ success: true, data: { user, token } });
  });

  // Login user
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    res.status(200).json({ success: true, data: { user, token } });
  });

  // Logout user
  logout = asyncHandler(async (req: Request, res: Response) => {
    // JWT tokens are stateless, so we don't need to do anything server-side
    // Client should remove the token from storage
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });

  // Refresh token
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { token } = await authService.refreshToken(userId);
    res.status(200).json({ success: true, data: { token } });
  });

  // Forgot password
  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json({ success: true, message: result.message });
  });

  // Reset password
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    res.status(200).json({ success: true, message: result.message });
  });

  // Get current user
  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await authService.getCurrentUser(userId);
    res.status(200).json({ success: true, data: { user } });
  });
}