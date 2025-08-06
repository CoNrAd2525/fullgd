import { Request, Response } from 'express';
import { User } from '../models/User';

type RequestWithUser = Request & { user?: User; file?: Express.Multer.File };

// Use RequestWithUser in all handlers