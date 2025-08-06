import { PrismaClient, User } from '@prisma/client';
import { ApiError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserService } from './user.service';

const prisma = new PrismaClient();
const userService = new UserService();

// Auth service
export class AuthService {
  // Register a new user
  async register(userData: any): Promise<{ user: User; token: string }> {
    try {
      // Create user
      const user = await userService.createUser(userData);

      // Generate token
      const token = this.generateToken(user.id);

      // Log activity
      await this.logActivity(user.id, 'auth', 'register', 'User registered');

      return { user, token };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error registering user:', error);
      throw new ApiError(500, 'Failed to register user');
    }
  }

  // Login user
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new ApiError(401, 'Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid credentials');
      }

      // Generate token
      const token = this.generateToken(user.id);

      // Update last login time
      await userService.updateLastLogin(user.id);

      // Log activity
      await this.logActivity(user.id, 'auth', 'login', 'User logged in');

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return { user: userWithoutPassword as User, token };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error logging in:', error);
      throw new ApiError(500, 'Failed to login');
    }
  }

  // Refresh token
  async refreshToken(userId: string): Promise<{ token: string }> {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Generate new token
      const token = this.generateToken(userId);

      return { token };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error refreshing token:', error);
      throw new ApiError(500, 'Failed to refresh token');
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal that the email doesn't exist
        return { message: 'If your email is registered, you will receive a password reset link' };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Hash token
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Save token to user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry
        }
      });

      // In a real application, send email with reset link
      // For this implementation, we'll just return the token
      console.log(`Reset token for ${email}: ${resetToken}`);

      // Log activity
      await this.logActivity(user.id, 'auth', 'forgot_password', 'Password reset requested');

      return { message: 'If your email is registered, you will receive a password reset link' };
    } catch (error) {
      console.error('Error processing forgot password:', error);
      throw new ApiError(500, 'Failed to process forgot password request');
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      // Hash token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with token
      const user = await prisma.user.findFirst({
        where: {
          resetToken: hashedToken,
          resetTokenExpiry: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new ApiError(400, 'Invalid or expired reset token');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        }
      });

      // Log activity
      await this.logActivity(user.id, 'auth', 'reset_password', 'Password reset completed');

      return { message: 'Password reset successful' };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error resetting password:', error);
      throw new ApiError(500, 'Failed to reset password');
    }
  }

  // Get current user
  async getCurrentUser(userId: string): Promise<User> {
    try {
      return await userService.getUserById(userId);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting current user:', error);
      throw new ApiError(500, 'Failed to get current user');
    }
  }

  // Generate JWT token
  private generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign({ id: userId }, secret, { expiresIn });
  }

  // Log user activity
  private async logActivity(userId: string, category: string, action: string, description: string): Promise<void> {
    try {
      await prisma.activity.create({
        data: {
          userId,
          category,
          action,
          description,
          metadata: {}
        }
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error for logging activity
    }
  }
}