import { PrismaClient } from '@prisma/client';
import { ApiError } from '../middleware/errorHandler';
import axios from 'axios';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Webhook service
export class WebhookService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  // Create a new webhook
  async createWebhook(userId: string, webhookData: any): Promise<any> {
    try {
      // Validate webhook data
      if (!webhookData.name || !webhookData.targetUrl) {
        throw new ApiError(400, 'Webhook name and target URL are required');
      }

      // Generate a unique webhook ID and secret
      const webhookId = uuidv4();
      const webhookSecret = uuidv4();

      // Create webhook
      const webhook = await prisma.webhook.create({
        data: {
          id: webhookId,
          name: webhookData.name,
          description: webhookData.description || '',
          targetUrl: webhookData.targetUrl,
          secret: webhookSecret,
          events: webhookData.events || ['workflow.completed'],
          isActive: webhookData.isActive !== undefined ? webhookData.isActive : true,
          headers: webhookData.headers || {},
          userId
        }
      });

      return webhook;
    } catch (error) {
      console.error('Error creating webhook:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to create webhook');
    }
  }

  // Get all webhooks for a user
  async getWebhooks(userId: string): Promise<any[]> {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: { userId },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return webhooks;
    } catch (error) {
      console.error('Error getting webhooks:', error);
      throw new ApiError(500, 'Failed to get webhooks');
    }
  }

  // Get webhook by ID
  async getWebhookById(id: string, userId: string): Promise<any> {
    try {
      const webhook = await prisma.webhook.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!webhook) {
        throw new ApiError(404, 'Webhook not found');
      }

      return webhook;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting webhook:', error);
      throw new ApiError(500, 'Failed to get webhook');
    }
  }

  // Update webhook
  async updateWebhook(id: string, userId: string, webhookData: any): Promise<any> {
    try {
      // Check if webhook exists and belongs to user
      const existingWebhook = await prisma.webhook.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingWebhook) {
        throw new ApiError(404, 'Webhook not found or you do not have permission to update it');
      }

      // Update webhook
      const updatedWebhook = await prisma.webhook.update({
        where: { id },
        data: {
          name: webhookData.name,
          description: webhookData.description,
          targetUrl: webhookData.targetUrl,
          events: webhookData.events,
          isActive: webhookData.isActive,
          headers: webhookData.headers
        }
      });

      return updatedWebhook;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error updating webhook:', error);
      throw new ApiError(500, 'Failed to update webhook');
    }
  }

  // Delete webhook
  async deleteWebhook(id: string, userId: string): Promise<void> {
    try {
      // Check if webhook exists and belongs to user
      const existingWebhook = await prisma.webhook.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingWebhook) {
        throw new ApiError(404, 'Webhook not found or you do not have permission to delete it');
      }

      // Delete webhook
      await prisma.webhook.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error deleting webhook:', error);
      throw new ApiError(500, 'Failed to delete webhook');
    }
  }

  // Test webhook connection
  async testWebhook(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get webhook
      const webhook = await this.getWebhookById(id, userId);

      // Prepare test payload
      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook from Unified AI Agent Platform'
        }
      };

      // Send test webhook
      const result = await this.sendWebhook(webhook, testPayload);
      return result;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error testing webhook:', error);
      throw new ApiError(500, 'Failed to test webhook');
    }
  }

  // Send webhook notification
  async sendWebhook(webhook: any, payload: any): Promise<{ success: boolean; message: string }> {
    try {
      // Check if webhook is active
      if (!webhook.isActive) {
        return { success: false, message: 'Webhook is not active' };
      }

      // Add webhook ID and timestamp to payload
      const webhookPayload = {
        ...payload,
        webhook_id: webhook.id,
        timestamp: new Date().toISOString()
      };

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-ID': webhook.id,
        'X-Webhook-Signature': this.generateSignature(webhook.secret, webhookPayload),
        ...webhook.headers
      };

      // Send webhook request
      const response = await axios.post(webhook.targetUrl, webhookPayload, {
        headers,
        timeout: 10000 // 10 second timeout
      });

      return {
        success: response.status >= 200 && response.status < 300,
        message: `Webhook sent successfully with status ${response.status}`
      };
    } catch (error: any) {
      console.error('Error sending webhook:', error);
      return {
        success: false,
        message: `Failed to send webhook: ${error.message}`
      };
    }
  }

  // Generate webhook signature
  private generateSignature(secret: string, payload: any): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  // Trigger webhook for workflow events
  async triggerWorkflowWebhook(userId: string, workflowId: string, event: string, data: any): Promise<void> {
    try {
      // Find all active webhooks for this user that subscribe to this event
      const webhooks = await prisma.webhook.findMany({
        where: {
          userId,
          isActive: true,
          events: {
            has: event
          }
        }
      });

      // Send webhooks in parallel
      const webhookPromises = webhooks.map(webhook => {
        const payload = {
          event,
          workflowId,
          timestamp: new Date().toISOString(),
          data
        };

        return this.sendWebhook(webhook, payload);
      });

      // Wait for all webhooks to be sent
      await Promise.all(webhookPromises);
    } catch (error) {
      console.error('Error triggering workflow webhooks:', error);
      // Don't throw error to prevent workflow execution from failing
    }
  }

  // Trigger webhook for agent events
  async triggerAgentWebhook(userId: string, agentId: string, event: string, data: any): Promise<void> {
    try {
      // Find all active webhooks for this user that subscribe to this event
      const webhooks = await prisma.webhook.findMany({
        where: {
          userId,
          isActive: true,
          events: {
            has: event
          }
        }
      });

      // Send webhooks in parallel
      const webhookPromises = webhooks.map(webhook => {
        const payload = {
          event,
          agentId,
          timestamp: new Date().toISOString(),
          data
        };

        return this.sendWebhook(webhook, payload);
      });

      // Wait for all webhooks to be sent
      await Promise.all(webhookPromises);
    } catch (error) {
      console.error('Error triggering agent webhooks:', error);
      // Don't throw error to prevent agent execution from failing
    }
  }
}