"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("../services/analytics.service");
const errorHandler_1 = require("../middleware/errorHandler");
const analyticsService = new analytics_service_1.AnalyticsService();
class AnalyticsController {
    constructor() {
        // Get platform overview
        this.getPlatformOverview = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            // Check if user is admin
            if (req.user?.role !== 'ADMIN') {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }
            const timeframe = req.query.timeframe || 'week';
            const overview = await analyticsService.getPlatformOverview(timeframe);
            res.status(200).json({ success: true, data: { overview } });
        });
        // Get user activity metrics
        this.getUserActivityMetrics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            // Check if user is admin or requesting their own metrics
            const targetUserId = req.params.userId || userId;
            if (targetUserId !== userId && req.user?.role !== 'ADMIN') {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }
            const timeframe = req.query.timeframe || 'week';
            const metrics = await analyticsService.getUserActivityMetrics(targetUserId, timeframe);
            res.status(200).json({ success: true, data: { metrics } });
        });
        // Get agent usage metrics
        this.getAgentUsageMetrics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const agentId = req.params.agentId;
            const timeframe = req.query.timeframe || 'week';
            const metrics = await analyticsService.getAgentUsageMetrics(agentId, userId, timeframe);
            res.status(200).json({ success: true, data: { metrics } });
        });
        // Get workflow performance metrics
        this.getWorkflowPerformanceMetrics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const workflowId = req.params.workflowId;
            const timeframe = req.query.timeframe || 'week';
            const metrics = await analyticsService.getWorkflowPerformanceMetrics(workflowId, userId, timeframe);
            res.status(200).json({ success: true, data: { metrics } });
        });
        // Get resource usage metrics
        this.getResourceUsageMetrics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            // Check if user is admin or requesting their own metrics
            const targetUserId = req.params.userId || userId;
            if (targetUserId !== userId && req.user?.role !== 'ADMIN') {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }
            const timeframe = req.query.timeframe || 'week';
            const resourceType = req.query.resourceType || 'all';
            const metrics = await analyticsService.getResourceUsageMetrics(targetUserId, timeframe, resourceType);
            res.status(200).json({ success: true, data: { metrics } });
        });
        // Get error metrics
        this.getErrorMetrics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            // Check if user is admin
            if (req.user?.role !== 'ADMIN') {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }
            const timeframe = req.query.timeframe || 'week';
            const metrics = await analyticsService.getErrorMetrics(timeframe);
            res.status(200).json({ success: true, data: { metrics } });
        });
        // Export analytics data
        this.exportAnalyticsData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            // Check if user is admin or exporting their own data
            const targetUserId = req.query.userId || userId;
            if (targetUserId !== userId && req.user?.role !== 'ADMIN') {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }
            const timeframe = req.query.timeframe || 'month';
            const format = req.query.format || 'json';
            const dataType = req.query.dataType || 'all';
            const data = await analyticsService.exportAnalyticsData(targetUserId, timeframe, format, dataType);
            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=analytics_${dataType}_${timeframe}.csv`);
                return res.status(200).send(data);
            }
            res.status(200).json({ success: true, data });
        });
    }
}
exports.AnalyticsController = AnalyticsController;
