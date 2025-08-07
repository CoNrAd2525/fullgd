"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const user_service_1 = require("./user.service");
const prisma = new client_1.PrismaClient();
const userService = new user_service_1.UserService();
// Auth service
class AuthService {
    // Register a new user
    async register(userData) {
        try {
            // Create user
            const user = await userService.createUser(userData);
            // Generate token
            const token = this.generateToken(user.id);
            // Log activity
            await this.logActivity(user.id, 'auth', 'register', 'User registered');
            return { user, token };
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error registering user:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to register user');
        }
    }
    // Login user
    async login(email, password) {
        try {
            // Find user by email
            const user = await prisma.user.findUnique({
                where: { email }
            });
            if (!user) {
                throw new errorHandler_1.ApiError(401, 'Invalid credentials');
            }
            // Verify password
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                throw new errorHandler_1.ApiError(401, 'Invalid credentials');
            }
            // Generate token
            const token = this.generateToken(user.id);
            // Update last login time
            await userService.updateLastLogin(user.id);
            // Log activity
            await this.logActivity(user.id, 'auth', 'login', 'User logged in');
            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;
            return { user: userWithoutPassword, token };
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error logging in:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to login');
        }
    }
    // Refresh token
    async refreshToken(userId) {
        try {
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new errorHandler_1.ApiError(404, 'User not found');
            }
            // Generate new token
            const token = this.generateToken(userId);
            return { token };
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error refreshing token:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to refresh token');
        }
    }
    // Forgot password
    async forgotPassword(email) {
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
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
            // Hash token
            const hashedToken = crypto_1.default
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
        }
        catch (error) {
            console.error('Error processing forgot password:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to process forgot password request');
        }
    }
    // Reset password
    async resetPassword(token, newPassword) {
        try {
            // Hash token
            const hashedToken = crypto_1.default
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
                throw new errorHandler_1.ApiError(400, 'Invalid or expired reset token');
            }
            // Hash new password
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
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
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error resetting password:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to reset password');
        }
    }
    // Get current user
    async getCurrentUser(userId) {
        try {
            return await userService.getUserById(userId);
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            console.error('Error getting current user:', error);
            throw new errorHandler_1.ApiError(500, 'Failed to get current user');
        }
    }
    // Generate JWT token
    generateToken(userId) {
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
        return jsonwebtoken_1.default.sign({ id: userId }, secret, { expiresIn });
    }
    // Log user activity
    async logActivity(userId, category, action, description) {
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
        }
        catch (error) {
            console.error('Error logging activity:', error);
            // Don't throw error for logging activity
        }
    }
}
exports.AuthService = AuthService;
