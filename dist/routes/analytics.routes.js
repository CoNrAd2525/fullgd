"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../utils/auth");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
const analyticsController = new controllers_1.AnalyticsController();
// Get platform overview metrics
router.get('/overview', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), analyticsController.getPlatformOverview);
// Get user activity metrics
router.get('/users/activity', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), analyticsController.getUserActivityMetrics);
// Get agent usage metrics
router.get('/agents/usage', auth_1.authenticate, analyticsController.getAgentUsageMetrics);
// Get workflow performance metrics
router.get('/workflows/performance', auth_1.authenticate, analyticsController.getWorkflowPerformanceMetrics);
// Get resource usage metrics
router.get('/resources/usage', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), analyticsController.getResourceUsageMetrics);
// Get error metrics
router.get('/errors', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), analyticsController.getErrorMetrics);
// Get specific agent analytics
router.get('/agents/:agentId', auth_1.authenticate, analyticsController.getAgentAnalytics);
// Get specific workflow analytics
router.get('/workflows/:workflowId', auth_1.authenticate, analyticsController.getWorkflowAnalytics);
// Get user-specific analytics
router.get('/users/:userId', auth_1.authenticate, analyticsController.getUserAnalytics);
// Export analytics data
router.get('/export', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), analyticsController.exportAnalyticsData);
exports.default = router;
