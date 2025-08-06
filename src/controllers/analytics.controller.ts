import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { asyncHandler } from '../middleware/errorHandler';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  // Get platform overview
  getPlatformOverview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const timeframe = req.query.timeframe as string || 'week';
    const overview = await analyticsService.getPlatformOverview(timeframe);
    res.status(200).json({ success: true, data: { overview } });
  });

  // Get user activity metrics
  getUserActivityMetrics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if user is admin or requesting their own metrics
    const targetUserId = req.params.userId || userId;
    if (targetUserId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const timeframe = req.query.timeframe as string || 'week';
    const metrics = await analyticsService.getUserActivityMetrics(targetUserId, timeframe);
    res.status(200).json({ success: true, data: { metrics } });
  });

  // Get agent usage metrics
  getAgentUsageMetrics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const agentId = req.params.agentId;
    const timeframe = req.query.timeframe as string || 'week';
    const metrics = await analyticsService.getAgentUsageMetrics(agentId, userId, timeframe);
    res.status(200).json({ success: true, data: { metrics } });
  });

  // Get workflow performance metrics
  getWorkflowPerformanceMetrics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const workflowId = req.params.workflowId;
    const timeframe = req.query.timeframe as string || 'week';
    const metrics = await analyticsService.getWorkflowPerformanceMetrics(workflowId, userId, timeframe);
    res.status(200).json({ success: true, data: { metrics } });
  });

  // Get resource usage metrics
  getResourceUsageMetrics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if user is admin or requesting their own metrics
    const targetUserId = req.params.userId || userId;
    if (targetUserId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const timeframe = req.query.timeframe as string || 'week';
    const resourceType = req.query.resourceType as string || 'all';
    const metrics = await analyticsService.getResourceUsageMetrics(targetUserId, timeframe, resourceType);
    res.status(200).json({ success: true, data: { metrics } });
  });

  // Get error metrics
  getErrorMetrics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const timeframe = req.query.timeframe as string || 'week';
    const metrics = await analyticsService.getErrorMetrics(timeframe);
    res.status(200).json({ success: true, data: { metrics } });
  });

  // Export analytics data
  exportAnalyticsData = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if user is admin or exporting their own data
    const targetUserId = req.query.userId as string || userId;
    if (targetUserId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const timeframe = req.query.timeframe as string || 'month';
    const format = req.query.format as string || 'json';
    const dataType = req.query.dataType as string || 'all';
    
    const data = await analyticsService.exportAnalyticsData(targetUserId, timeframe, format, dataType);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics_${dataType}_${timeframe}.csv`);
      return res.status(200).send(data);
    }
    
    res.status(200).json({ success: true, data });
  });
}