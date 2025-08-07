"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminOrOwner = exports.requireAdmin = exports.authenticateApiKey = exports.authorizeRoles = exports.authenticateToken = void 0;
const auth_1 = require("../utils/auth");
// Re-export the authenticate function as authenticateToken for consistency
exports.authenticateToken = auth_1.authenticate;
// Re-export the authorize function
exports.authorizeRoles = auth_1.authorize;
// Additional middleware for API key authentication (if needed)
const authenticateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            res.status(401).json({
                success: false,
                message: 'API key is required'
            });
            return;
        }
        // Here you would validate the API key against your database
        // For now, we'll just check if it exists
        // In a real implementation, you'd query the ApiKey model
        // TODO: Implement proper API key validation
        // const validApiKey = await prisma.apiKey.findUnique({
        //   where: { key: apiKey, isActive: true },
        //   include: { user: true }
        // });
        // if (!validApiKey) {
        //   return res.status(401).json({ 
        //     success: false, 
        //     message: 'Invalid API key' 
        //   });
        // }
        // req.user = validApiKey.user;
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};
exports.authenticateApiKey = authenticateApiKey;
// Middleware to check if user is admin
exports.requireAdmin = (0, auth_1.authorize)(['admin']);
// Middleware to check if user is admin or the resource owner
const requireAdminOrOwner = (userIdField = 'userId') => {
    return (req, res, next) => {
        const user = req.user;
        const resourceUserId = req.params[userIdField] || req.body[userIdField];
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        if (user.role === 'admin' || user.id === resourceUserId) {
            next();
        }
        else {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges or resource ownership required.'
            });
        }
    };
};
exports.requireAdminOrOwner = requireAdminOrOwner;
