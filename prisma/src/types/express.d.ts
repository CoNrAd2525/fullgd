import { User } from '../models/User'; // Adjust path as needed

declare global {
  namespace Express {
    interface Request {
      user?: User;
      file?: Express.Multer.File;
    }
  }
}