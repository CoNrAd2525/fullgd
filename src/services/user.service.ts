import { PrismaClient, User } from '@prisma/client';
import { ApiError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// User service
export class UserService {
  // Create a new user
  async createUser(userData: any): Promise<User> {
    try {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new ApiError(400, 'Email already in use');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role || 'user',
          settings: userData.settings || {}
        }
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error creating user:', error);
      throw new ApiError(500, 'Failed to create user');
    }
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          settings: true,
          lastLoginAt: true
        }
      });

      return users as User[];
    } catch (error) {
      console.error('Error getting users:', error);
      throw new ApiError(500, 'Failed to get users');
    }
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          settings: true,
          lastLoginAt: true
        }
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      return user as User;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting user:', error);
      throw new ApiError(500, 'Failed to get user');
    }
  }

  // Update user
  async updateUser(id: string, userData: any): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        throw new ApiError(404, 'User not found');
      }

      // Check if email is being changed and if it's already in use
      if (userData.email && userData.email !== existingUser.email) {
        const emailInUse = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (emailInUse) {
          throw new ApiError(400, 'Email already in use');
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          settings: userData.settings
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          settings: true,
          lastLoginAt: true
        }
      });

      return updatedUser as User;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error updating user:', error);
      throw new ApiError(500, 'Failed to update user');
    }
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        throw new ApiError(404, 'User not found');
      }

      // Delete user's API keys
      await prisma.apiKey.deleteMany({
        where: { userId: id }
      });

      // Delete user's agents
      await prisma.agent.deleteMany({
        where: { userId: id }
      });

      // Delete user's workflows
      await prisma.workflow.deleteMany({
        where: { userId: id }
      });

      // Delete user's tools
      await prisma.tool.deleteMany({
        where: { userId: id }
      });

      // Delete user's knowledge bases
      await prisma.knowledgeBase.deleteMany({
        where: { userId: id }
      });

      // Delete user's activities
      await prisma.activity.deleteMany({
        where: { userId: id }
      });

      // Delete user
      await prisma.user.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error deleting user:', error);
      throw new ApiError(500, 'Failed to delete user');
    }
  }

  // Update user password
  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new ApiError(401, 'Current password is incorrect');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword }
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error updating password:', error);
      throw new ApiError(500, 'Failed to update password');
    }
  }

  // Update user settings
  async updateSettings(id: string, settings: any): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        throw new ApiError(404, 'User not found');
      }

      // Update settings
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          settings: {
            ...existingUser.settings,
            ...settings
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          settings: true,
          lastLoginAt: true
        }
      });

      return updatedUser as User;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error updating settings:', error);
      throw new ApiError(500, 'Failed to update settings');
    }
  }

  // Get user activity
  async getUserActivity(id: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        throw new ApiError(404, 'User not found');
      }

      // Get activity
      const activity = await prisma.activity.findMany({
        where: { userId: id },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      });

      return activity;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting user activity:', error);
      throw new ApiError(500, 'Failed to get user activity');
    }
  }

  // Update last login time
  async updateLastLogin(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { lastLoginAt: new Date() }
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error for this operation
    }
  }

  // Create API key for user
  async createApiKey(userId: string, name: string, expiresAt?: Date): Promise<any> {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new ApiError(404, 'User not found');
      }

      // Generate API key
      const apiKey = this.generateApiKey();
      const hashedKey = await bcrypt.hash(apiKey, 10);

      // Create API key record
      const apiKeyRecord = await prisma.apiKey.create({
        data: {
          name,
          key: hashedKey,
          userId,
          expiresAt
        }
      });

      return {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        key: apiKey, // Return the unhashed key only once
        createdAt: apiKeyRecord.createdAt,
        expiresAt: apiKeyRecord.expiresAt
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error creating API key:', error);
      throw new ApiError(500, 'Failed to create API key');
    }
  }

  // Get API keys for user
  async getApiKeys(userId: string): Promise<any[]> {
    try {
      const apiKeys = await prisma.apiKey.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          createdAt: true,
          expiresAt: true,
          lastUsedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return apiKeys;
    } catch (error) {
      console.error('Error getting API keys:', error);
      throw new ApiError(500, 'Failed to get API keys');
    }
  }

  // Delete API key
  async deleteApiKey(userId: string, apiKeyId: string): Promise<void> {
    try {
      // Check if API key exists and belongs to user
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: apiKeyId,
          userId
        }
      });

      if (!apiKey) {
        throw new ApiError(404, 'API key not found or you do not have permission to delete it');
      }

      // Delete API key
      await prisma.apiKey.delete({
        where: { id: apiKeyId }
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error deleting API key:', error);
      throw new ApiError(500, 'Failed to delete API key');
    }
  }

  // Verify API key
  async verifyApiKey(apiKey: string): Promise<User | null> {
    try {
      // Find all API keys
      const apiKeys = await prisma.apiKey.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              settings: true
            }
          }
        }
      });

      // Check each API key
      for (const key of apiKeys) {
        const isMatch = await bcrypt.compare(apiKey, key.key);
        if (isMatch) {
          // Check if key is expired
          if (key.expiresAt && key.expiresAt < new Date()) {
            return null;
          }

          // Update last used timestamp
          await prisma.apiKey.update({
            where: { id: key.id },
            data: { lastUsedAt: new Date() }
          });

          return key.user as User;
        }
      }

      return null;
    } catch (error) {
      console.error('Error verifying API key:', error);
      return null;
    }
  }

  // Generate API key
  private generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const prefix = 'sk-';
    let result = prefix;
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}