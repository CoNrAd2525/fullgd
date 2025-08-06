import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PipedreamController } from '../controllers/pipedream.controller';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

export function createPipedreamRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const pipedreamController = new PipedreamController(prisma);

  // OAuth flow routes
  router.post('/oauth/initiate',
    authenticateToken,
    [
      body('scopes')
        .optional()
        .isArray()
        .withMessage('Scopes must be an array')
    ],
    validateRequest,
    pipedreamController.initiateOAuth
  );

  router.get('/oauth/callback',
    pipedreamController.handleOAuthCallback
  );

  // Integration management routes
  router.get('/status',
    authenticateToken,
    pipedreamController.getIntegrationStatus
  );

  router.post('/refresh-token',
    authenticateToken,
    pipedreamController.refreshToken
  );

  router.delete('/disconnect',
    authenticateToken,
    pipedreamController.disconnectIntegration
  );

  router.get('/test',
    authenticateToken,
    pipedreamController.testIntegration
  );

  // Workflow trigger routes
  router.post('/workflows/:workflowId/trigger',
    authenticateToken,
    [
      param('workflowId')
        .notEmpty()
        .withMessage('Workflow ID is required'),
      body('event')
        .optional()
        .isString()
        .withMessage('Event must be a string'),
      body('data')
        .optional()
        .isObject()
        .withMessage('Data must be an object'),
      body('sessionId')
        .optional()
        .isString()
        .withMessage('Session ID must be a string'),
      body('agentId')
        .optional()
        .isString()
        .withMessage('Agent ID must be a string')
    ],
    validateRequest,
    pipedreamController.triggerWorkflow
  );

  // Event sending routes
  router.post('/events/collaboration',
    authenticateToken,
    [
      body('event')
        .notEmpty()
        .isString()
        .withMessage('Event is required and must be a string'),
      body('sessionId')
        .notEmpty()
        .isString()
        .withMessage('Session ID is required and must be a string'),
      body('data')
        .optional()
        .isObject()
        .withMessage('Data must be an object')
    ],
    validateRequest,
    pipedreamController.sendCollaborationEvent
  );

  router.post('/events/agent',
    authenticateToken,
    [
      body('event')
        .notEmpty()
        .isString()
        .withMessage('Event is required and must be a string'),
      body('agentId')
        .notEmpty()
        .isString()
        .withMessage('Agent ID is required and must be a string'),
      body('data')
        .optional()
        .isObject()
        .withMessage('Data must be an object')
    ],
    validateRequest,
    pipedreamController.sendAgentEvent
  );

  return router;
}