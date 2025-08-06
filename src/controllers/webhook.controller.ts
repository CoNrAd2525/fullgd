import { Request, Response, NextFunction } from 'express';
import { WebhookService } from '../services/webhook.service';
import { asyncHandler } from '../middleware/errorHandler';
import { Server } from 'socket.io';

export class WebhookController {
  private webhookService: WebhookService;

  constructor(io: Server) {
    this.webhookService = new WebhookService(io);
  }

  // Get all webhooks
  getWebhooks = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const webhooks = await this.webhookService.getWebhooks(userId);
    res.status(200).json({ success: true, data: { webhooks } });
  });

  // Get webhook by ID
  getWebhookById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const webhook = await this.webhookService.getWebhookById(id, userId);
    res.status(200).json({ success: true, data: { webhook } });
  });

  // Create webhook
  createWebhook = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const webhook = await this.webhookService.createWebhook(userId, req.body);
    res.status(201).json({ success: true, data: { webhook } });
  });

  // Update webhook
  updateWebhook = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const webhook = await this.webhookService.updateWebhook(id, userId, req.body);
    res.status(200).json({ success: true, data: { webhook } });
  });

  // Delete webhook
  deleteWebhook = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    await this.webhookService.deleteWebhook(id, userId);
    res.status(200).json({ success: true, message: 'Webhook deleted successfully' });
  });

  // Test webhook
  testWebhook = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const result = await this.webhookService.testWebhook(id, userId);
    res.status(200).json({ success: true, data: { result } });
  });

  // Receive webhook (for Pipedream integration)
  receiveWebhook = asyncHandler(async (req: Request, res: Response) => {
    // This endpoint is for receiving webhooks from external services like Pipedream
    // It should be publicly accessible without authentication
    
    const { workflowId, agentId, event, data } = req.body;
    
    // Validate the request
    if (!event || (!workflowId && !agentId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid webhook payload. Required fields: event and either workflowId or agentId' 
      });
    }
    
    // Process the webhook based on the event type
    try {
      // Here you would typically process the webhook data
      // For example, you might want to trigger a workflow or update an agent
      
      // For now, we'll just acknowledge receipt
      res.status(200).json({ 
        success: true, 
        message: 'Webhook received successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing incoming webhook:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error processing webhook' 
      });
    }
  });
}