import { Router } from 'express';
import { authenticate, authorize } from '../utils/auth';
import { UserController } from '../controllers';

const router = Router();
const userController = new UserController();

// Get all users (admin only)
router.get('/', authenticate, authorize(['ADMIN']), userController.getAllUsers);

// Get user by ID
router.get('/:id', authenticate, userController.getUserById);

// Update user
router.put('/:id', authenticate, userController.updateUser);

// Delete user
router.delete('/:id', authenticate, userController.deleteUser);

// Update user password
router.put('/:id/password', authenticate, userController.updatePassword);

// Get user activity
router.get('/:id/activity', authenticate, userController.getUserActivity);

// Update user settings
router.put('/:id/settings', authenticate, userController.updateSettings);

// API Key management
// Create API key
router.post('/:id/api-keys', authenticate, userController.createApiKey);

// Get API keys
router.get('/:id/api-keys', authenticate, userController.getApiKeys);

// Delete API key
router.delete('/:id/api-keys/:keyId', authenticate, userController.deleteApiKey);

export default router;