"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const webhook_service_1 = require("../services/webhook.service");
const errorHandler_1 = require("../middleware/errorHandler");
class WebhookController {
    constructor(io) {
        // Get all webhooks
        this.getWebhooks = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const webhooks = await this.webhookService.getWebhooks(userId);
            res.status(200).json({ success: true, data: { webhooks } });
        });
        // Get webhook by ID
        this.getWebhookById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const webhook = await this.webhookService.getWebhookById(id, userId);
            res.status(200).json({ success: true, data: { webhook } });
        });
        // Create webhook
        this.createWebhook = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const webhook = await this.webhookService.createWebhook(userId, req.body);
            res.status(201).json({ success: true, data: { webhook } });
        });
        // Update webhook
        this.updateWebhook = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const webhook = await this.webhookService.updateWebhook(id, userId, req.body);
            res.status(200).json({ success: true, data: { webhook } });
        });
        // Delete webhook
        this.deleteWebhook = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            await this.webhookService.deleteWebhook(id, userId);
            res.status(200).json({ success: true, message: 'Webhook deleted successfully' });
        });
        // Test webhook
        this.testWebhook = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const result = await this.webhookService.testWebhook(id, userId);
            res.status(200).json({ success: true, data: { result } });
        });
        // Receive webhook (for Pipedream integration)
        this.receiveWebhook = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
            }
            catch (error) {
                console.error('Error processing incoming webhook:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error processing webhook'
                });
            }
        });
        this.webhookService = new webhook_service_1.WebhookService(io);
    }
}
exports.WebhookController = WebhookController;
