import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { asyncHandler } from '../middleware/errorHandler';

const userService = new UserService();

export class UserController {
  // Get all users (admin only)
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await userService.getAllUsers();
    res.status(200).json({ success: true, data: { users } });
  });

  // Get user by ID
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    res.status(200).json({ success: true, data: { user } });
  });

  // Update user
  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
    res.status(200).json({ success: true, data: { user } });
  });

  // Delete user
  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  });

  // Update user password
  updatePassword = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    await userService.updatePassword(id, currentPassword, newPassword);
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  });

  // Update user settings
  updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.updateSettings(id, req.body);
    res.status(200).json({ success: true, data: { user } });
  });

  // Get user activity
  getUserActivity = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const activity = await userService.getUserActivity(id, limit, offset);
    res.status(200).json({ success: true, data: { activity } });
  });

  // Create API key
  createApiKey = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, expiresAt } = req.body;
    const apiKey = await userService.createApiKey(id, name, expiresAt ? new Date(expiresAt) : undefined);
    res.status(201).json({ success: true, data: { apiKey } });
  });

  // Get API keys
  getApiKeys = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const apiKeys = await userService.getApiKeys(id);
    res.status(200).json({ success: true, data: { apiKeys } });
  });

  // Delete API key
  deleteApiKey = asyncHandler(async (req: Request, res: Response) => {
    const { id, keyId } = req.params;
    await userService.deleteApiKey(id, keyId);
    res.status(200).json({ success: true, message: 'API key deleted successfully' });
  });
}