"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.ApiError = void 0;
// Custom error class for API errors
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
// Error handler middleware
const errorHandler = (err, req, res, next) => {
    // Log error
    console.error('Error:', err);
    // Default error values
    let statusCode = 500;
    let message = 'Internal Server Error';
    let isOperational = false;
    // If it's our custom API error, use its values
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
    }
    else if (err.name === 'ValidationError') {
        // Handle validation errors (e.g., from Mongoose)
        statusCode = 400;
        message = err.message;
        isOperational = true;
    }
    else if (err.name === 'UnauthorizedError') {
        // Handle JWT authentication errors
        statusCode = 401;
        message = 'Unauthorized';
        isOperational = true;
    }
    // Send error response
    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            isOperational
        })
    });
    // If error is not operational (i.e., unexpected), we might want to do more
    if (!isOperational) {
        // In a production app, you might want to notify developers
        // or potentially restart the application if it's in an unstable state
        console.error('NON-OPERATIONAL ERROR:', err);
    }
};
exports.errorHandler = errorHandler;
// Async handler to catch errors in async route handlers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
