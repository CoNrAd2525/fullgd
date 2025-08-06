import { Router } from 'express';
import { authenticate } from '../utils/auth';
import { WebhookController } from '../controllers/webhook.controller';
import { Server } from 'socket.io';

export const setupWebhookRoutes = (io: Server): Router => {
  const router = Router();
  const webhookController = new WebhookController(io);

  // Get all webhooks
  router.get('/', authenticate, webhookController.getWebhooks);

  // Create a new webhook
  router.post('/', authenticate, webhookController.createWebhook);

  // Get webhook by ID
  router.get('/:id', authenticate, webhookController.getWebhookById);

  // Update webhook
  router.put('/:id', authenticate, webhookController.updateWebhook);

  // Delete webhook
  router.delete('/:id', authenticate, webhookController.deleteWebhook);

  // Test webhook
  router.post('/:id/test', authenticate, webhookController.testWebhook);

  // Receive webhook (for Pipedream integration)
  // This endpoint is public and doesn't require authentication
  router.post('/receive', webhookController.receiveWebhook);

  return router;
};

export default setupWebhookRoutes;