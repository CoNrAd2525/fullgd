"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../utils/auth");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
const userController = new controllers_1.UserController();
// Get all users (admin only)
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(['ADMIN']), userController.getAllUsers);
// Get user by ID
router.get('/:id', auth_1.authenticate, userController.getUserById);
// Update user
router.put('/:id', auth_1.authenticate, userController.updateUser);
// Delete user
router.delete('/:id', auth_1.authenticate, userController.deleteUser);
// Update user password
router.put('/:id/password', auth_1.authenticate, userController.updatePassword);
// Get user activity
router.get('/:id/activity', auth_1.authenticate, userController.getUserActivity);
// Update user settings
router.put('/:id/settings', auth_1.authenticate, userController.updateSettings);
// API Key management
// Create API key
router.post('/:id/api-keys', auth_1.authenticate, userController.createApiKey);
// Get API keys
router.get('/:id/api-keys', auth_1.authenticate, userController.getApiKeys);
// Delete API key
router.delete('/:id/api-keys/:keyId', auth_1.authenticate, userController.deleteApiKey);
exports.default = router;
