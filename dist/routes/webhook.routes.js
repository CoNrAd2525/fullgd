"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebhookRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../utils/auth");
const webhook_controller_1 = require("../controllers/webhook.controller");
const setupWebhookRoutes = (io) => {
    const router = (0, express_1.Router)();
    const webhookController = new webhook_controller_1.WebhookController(io);
    // Get all webhooks
    router.get('/', auth_1.authenticate, webhookController.getWebhooks);
    // Create a new webhook
    router.post('/', auth_1.authenticate, webhookController.createWebhook);
    // Get webhook by ID
    router.get('/:id', auth_1.authenticate, webhookController.getWebhookById);
    // Update webhook
    router.put('/:id', auth_1.authenticate, webhookController.updateWebhook);
    // Delete webhook
    router.delete('/:id', auth_1.authenticate, webhookController.deleteWebhook);
    // Test webhook
    router.post('/:id/test', auth_1.authenticate, webhookController.testWebhook);
    // Receive webhook (for Pipedream integration)
    // This endpoint is public and doesn't require authentication
    router.post('/receive', webhookController.receiveWebhook);
    return router;
};
exports.setupWebhookRoutes = setupWebhookRoutes;
exports.default = exports.setupWebhookRoutes;
