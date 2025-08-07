"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("../middleware/errorHandler");
// Generate JWT token
const generateToken = (user) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
};
exports.generateToken = generateToken;
// Verify JWT token
const verifyToken = async (token) => {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        return decoded;
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
// Authentication middleware
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.ApiError(401, 'Authentication required');
        }
        const token = authHeader.split(' ')[1];
        const decoded = await (0, exports.verifyToken)(token);
        if (!decoded) {
            throw new errorHandler_1.ApiError(401, 'Invalid or expired token');
        }
        // Attach user to request
        req.user = decoded;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
// Role-based authorization middleware
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            next(new errorHandler_1.ApiError(401, 'Authentication required'));
            return;
        }
        const roleArray = Array.isArray(roles) ? roles : [roles];
        if (!roleArray.includes(req.user.role)) {
            next(new errorHandler_1.ApiError(403, 'Not authorized to access this resource'));
            return;
        }
        next();
    };
};
exports.authorize = authorize;
