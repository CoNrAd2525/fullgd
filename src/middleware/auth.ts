import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../utils/auth';

// Re-export the authenticate function as authenticateToken for consistency
export const authenticateToken = authenticate;

// Re-export the authorize function
export const authorizeRoles = authorize;

// Additional middleware for API key authentication (if needed)
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
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
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Middleware to check if user is admin
export const requireAdmin = authorize(['admin']);

// Middleware to check if user is admin or the resource owner
export const requireAdminOrOwner = (userIdField: string = 'userId') => {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
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
    } else {
      res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges or resource ownership required.' 
      });
    }
  };
};