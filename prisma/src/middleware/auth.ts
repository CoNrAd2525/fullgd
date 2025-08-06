import { Request, Response, NextFunction } from 'express';

// Add this interface
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

// Update your middleware to use the new interface
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // ... existing authentication logic
  next();
};