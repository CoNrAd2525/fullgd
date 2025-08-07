"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const errorHandler_1 = require("../middleware/errorHandler");
const userService = new user_service_1.UserService();
class UserController {
    constructor() {
        // Get all users (admin only)
        this.getAllUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const users = await userService.getAllUsers();
            res.status(200).json({ success: true, data: { users } });
        });
        // Get user by ID
        this.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const user = await userService.getUserById(id);
            res.status(200).json({ success: true, data: { user } });
        });
        // Update user
        this.updateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const user = await userService.updateUser(id, req.body);
            res.status(200).json({ success: true, data: { user } });
        });
        // Delete user
        this.deleteUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            await userService.deleteUser(id);
            res.status(200).json({ success: true, message: 'User deleted successfully' });
        });
        // Update user password
        this.updatePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { currentPassword, newPassword } = req.body;
            await userService.updatePassword(id, currentPassword, newPassword);
            res.status(200).json({ success: true, message: 'Password updated successfully' });
        });
        // Update user settings
        this.updateSettings = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const user = await userService.updateSettings(id, req.body);
            res.status(200).json({ success: true, data: { user } });
        });
        // Get user activity
        this.getUserActivity = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const activity = await userService.getUserActivity(id, limit, offset);
            res.status(200).json({ success: true, data: { activity } });
        });
        // Create API key
        this.createApiKey = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { name, expiresAt } = req.body;
            const apiKey = await userService.createApiKey(id, name, expiresAt ? new Date(expiresAt) : undefined);
            res.status(201).json({ success: true, data: { apiKey } });
        });
        // Get API keys
        this.getApiKeys = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const apiKeys = await userService.getApiKeys(id);
            res.status(200).json({ success: true, data: { apiKeys } });
        });
        // Delete API key
        this.deleteApiKey = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id, keyId } = req.params;
            await userService.deleteApiKey(id, keyId);
            res.status(200).json({ success: true, message: 'API key deleted successfully' });
        });
    }
}
exports.UserController = UserController;
