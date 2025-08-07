"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../utils/auth");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
const authController = new controllers_1.AuthController();
// Register a new user
router.post('/register', authController.register);
// Login user
router.post('/login', authController.login);
// Logout user
router.post('/logout', auth_1.authenticate, authController.logout);
// Refresh token
router.post('/refresh-token', authController.refreshToken);
// Forgot password
router.post('/forgot-password', authController.forgotPassword);
// Reset password
router.post('/reset-password/:token', authController.resetPassword);
// Get current user
router.get('/me', auth_1.authenticate, authController.getCurrentUser);
exports.default = router;
