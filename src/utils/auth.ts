import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';

// User interface
interface UserPayload {
  id: string;
  email: string;
  role: string;
}

// Generate JWT token
export const generateToken = (user: UserPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } as jwt.SignOptions
  );
};

// Verify JWT token
export const verifyToken = async (token: string): Promise<UserPayload | null> => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const decoded = jwt.verify(token, secret) as UserPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

// Authentication middleware
export const authenticate = async (
  req: Request & { user?: UserPayload },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    if (!decoded) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const authorize = (roles: string | string[]) => {
  return (req: Request & { user?: UserPayload }, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, 'Authentication required'));
      return;
    }

    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    if (!roleArray.includes(req.user.role)) {
      next(new ApiError(403, 'Not authorized to access this resource'));
      return;
    }

    next();
  };
};