// At the top:
import { Request, Response } from 'express';
import { User } from '../models/User'; // Adjust path as needed

type RequestWithUser = Request & { user?: User; file?: Express.Multer.File };

// In all method signatures, use RequestWithUser
// Example:
async function someMethod(req: RequestWithUser, res: Response) {
  const user = req.user;
  // ...
}

// Or, if you want to keep the existing signatures, cast as needed:
const user = (req as RequestWithUser).user;