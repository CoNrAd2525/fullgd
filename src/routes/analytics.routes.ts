import { Router } from 'express';
import { authenticate, authorize } from '../utils/auth';
import { AnalyticsController } from '../controllers';

const router = Router();
const analyticsController = new AnalyticsController();

// Get platform overview metrics
router.get(
  '/overview',
  authenticate,
  authorize('ADMIN'),
  analyticsController.getPlatformOverview
);

// Get user activity metrics
router.get(
  '/users/activity',
  authenticate,
  authorize('ADMIN'),
  analyticsController.getUserActivityMetrics
);

// Get agent usage metrics
router.get(
  '/agents/usage',
  authenticate,
  analyticsController.getAgentUsageMetrics
);

// Get workflow performance metrics
router.get(
  '/workflows/performance',
  authenticate,
  analyticsController.getWorkflowPerformanceMetrics
);

// Get resource usage metrics
router.get(
  '/resources/usage',
  authenticate,
  authorize('ADMIN'),
  analyticsController.getResourceUsageMetrics
);

// Get error metrics
router.get(
  '/errors',
  authenticate,
  authorize('ADMIN'),
  analyticsController.getErrorMetrics
);

// Get specific agent analytics
router.get(
  '/agents/:agentId',
  authenticate,
  analyticsController.getAgentAnalytics
);

// Get specific workflow analytics
router.get(
  '/workflows/:workflowId',
  authenticate,
  analyticsController.getWorkflowAnalytics
);

// Get user-specific analytics
router.get(
  '/users/:userId',
  authenticate,
  analyticsController.getUserAnalytics
);

// Export analytics data
router.get(
  '/export',
  authenticate,
  authorize('ADMIN'),
  analyticsController.exportAnalyticsData
);

export default router;