"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const errorHandler_1 = require("../middleware/errorHandler");
const authService = new auth_service_1.AuthService();
class AuthController {
    constructor() {
        // Register a new user
        this.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { user, token } = await authService.register(req.body);
            res.status(201).json({ success: true, data: { user, token } });
        });
        // Login user
        this.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { email, password } = req.body;
            const { user, token } = await authService.login(email, password);
            res.status(200).json({ success: true, data: { user, token } });
        });
        // Logout user
        this.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            // JWT tokens are stateless, so we don't need to do anything server-side
            // Client should remove the token from storage
            res.status(200).json({ success: true, message: 'Logged out successfully' });
        });
        // Refresh token
        this.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { token } = await authService.refreshToken(userId);
            res.status(200).json({ success: true, data: { token } });
        });
        // Forgot password
        this.forgotPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { email } = req.body;
            const result = await authService.forgotPassword(email);
            res.status(200).json({ success: true, message: result.message });
        });
        // Reset password
        this.resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { token, password } = req.body;
            const result = await authService.resetPassword(token, password);
            res.status(200).json({ success: true, message: result.message });
        });
        // Get current user
        this.getCurrentUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const user = await authService.getCurrentUser(userId);
            res.status(200).json({ success: true, data: { user } });
        });
    }
}
exports.AuthController = AuthController;
