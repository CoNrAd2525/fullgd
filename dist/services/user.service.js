"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
// User service
class UserService {
    // Create a new user
    async createUser(userData) {
        try {
            // Check if email already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email }
            });
            if (existingUser) {
                throw new errorHandler_1.ApiError(400, 'Email already in use');
            }
            // Hash password
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(userData.password, salt);
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
            return userWithoutPassword;
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error creating user:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to create user');
        }
    }
    // Get all users (admin only)
    async getAllUsers() {
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
            return users;
        }
        catch (error) {
            console.error('Error getting users:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to get users');
        }
    }
    // Get user by ID
    async getUserById(id) {
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
                throw new errorHandler_1.ApiError(404, 'User not found');
            }
            return user;
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error getting user:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to get user');
        }
    }
    // Update user
    async updateUser(id, userData) {
        try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id }
            });
            if (!existingUser) {
                throw new errorHandler_1.ApiError(404, 'User not found');
            }
            // Check if email is being changed and if it's already in use
            if (userData.email && userData.email !== existingUser.email) {
                const emailInUse = await prisma.user.findUnique({
                    where: { email: userData.email }
                });
                if (emailInUse) {
                    throw new errorHandler_1.ApiError(400, 'Email already in use');
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
            return updatedUser;
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error updating user:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to update user');
        }
    }
    // Delete user
    async deleteUser(id) {
        try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id }
            });
            if (!existingUser) {
                throw new errorHandler_1.ApiError(404, 'User not found');
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
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error deleting user:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to delete user');
        }
    }
    // Update user password
    async updatePassword(id, currentPassword, newPassword) {
        try {
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { id }
            });
            if (!user) {
                throw new errorHandler_1.ApiError(404, 'User not found');
            }
            // Verify current password
            const isPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                throw new errorHandler_1.ApiError(401, 'Current password is incorrect');
            }
            // Hash new password
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
            // Update password
            await prisma.user.update({
                where: { id },
                data: { password: hashedPassword }
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error updating password:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to update password');
        }
    }
    // Update user settings
    async updateSettings(id, settings) {
        try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id }
            });
            if (!existingUser) {
                throw new errorHandler_1.ApiError(404, 'User not found');
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
            return updatedUser;
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error updating settings:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to update settings');
        }
    }
    // Get user activity
    async getUserActivity(id, limit = 50, offset = 0) {
        try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id }
            });
            if (!existingUser) {
                throw new errorHandler_1.ApiError(404, 'User not found');
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
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error getting user activity:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to get user activity');
        }
    }
    // Update last login time
    async updateLastLogin(id) {
        try {
            await prisma.user.update({
                where: { id },
                data: { lastLoginAt: new Date() }
            });
        }
        catch (error) {
            console.error('Error updating last login:', error);
            // Don't throw error for this operation
        }
    }
    // Create API key for user
    async createApiKey(userId, name, expiresAt) {
        try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (!existingUser) {
                throw new errorHandler_1.ApiError(404, 'User not found');
            }
            // Generate API key
            const apiKey = this.generateApiKey();
            const hashedKey = await bcryptjs_1.default.hash(apiKey, 10);
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
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error creating API key:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to create API key');
        }
    }
    // Get API keys for user
    async getApiKeys(userId) {
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
        }
        catch (error) {
            console.error('Error getting API keys:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to get API keys');
        }
    }
    // Delete API key
    async deleteApiKey(userId, apiKeyId) {
        try {
            // Check if API key exists and belongs to user
            const apiKey = await prisma.apiKey.findFirst({
                where: {
                    id: apiKeyId,
                    userId
                }
            });
            if (!apiKey) {
                throw new errorHandler_1.ApiError(404, 'API key not found or you do not have permission to delete it');
            }
            // Delete API key
            await prisma.apiKey.delete({
                where: { id: apiKeyId }
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error deleting API key:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to delete API key');
        }
    }
    // Verify API key
    async verifyApiKey(apiKey) {
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
                const isMatch = await bcryptjs_1.default.compare(apiKey, key.key);
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
                    return key.user;
                }
            }
            return null;
        }
        catch (error) {
            console.error('Error verifying API key:', error);
            return null;
        }
    }
    // Generate API key
    generateApiKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const prefix = 'sk-';
        let result = prefix;
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}
exports.UserService = UserService;
