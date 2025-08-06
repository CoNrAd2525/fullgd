import { Request, Response } from 'express';
import { User } from '../models/User';

type RequestWithUser = Request & { user?: User };

class AnalyticsController {
  getAgentAnalytics = async (req: RequestWithUser, res: Response) => { /* ... */ }
  getWorkflowAnalytics = async (req: RequestWithUser, res: Response) => { /* ... */ }
  getUserAnalytics = async (req: RequestWithUser, res: Response) => { /* ... */ }
}