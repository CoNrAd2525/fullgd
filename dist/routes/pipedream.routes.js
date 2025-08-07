"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPipedreamRoutes = createPipedreamRoutes;
const express_1 = require("express");
const pipedream_controller_1 = require("../controllers/pipedream.controller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
function createPipedreamRoutes(prisma) {
    const router = (0, express_1.Router)();
    const pipedreamController = new pipedream_controller_1.PipedreamController(prisma);
    // OAuth flow routes
    router.post('/oauth/initiate', auth_1.authenticateToken, [
        (0, express_validator_1.body)('scopes')
            .optional()
            .isArray()
            .withMessage('Scopes must be an array')
    ], validation_1.validateRequest, pipedreamController.initiateOAuth);
    router.get('/oauth/callback', pipedreamController.handleOAuthCallback);
    // Integration management routes
    router.get('/status', auth_1.authenticateToken, pipedreamController.getIntegrationStatus);
    router.post('/refresh-token', auth_1.authenticateToken, pipedreamController.refreshToken);
    router.delete('/disconnect', auth_1.authenticateToken, pipedreamController.disconnectIntegration);
    router.get('/test', auth_1.authenticateToken, pipedreamController.testIntegration);
    // Workflow trigger routes
    router.post('/workflows/:workflowId/trigger', auth_1.authenticateToken, [
        (0, express_validator_1.param)('workflowId')
            .notEmpty()
            .withMessage('Workflow ID is required'),
        (0, express_validator_1.body)('event')
            .optional()
            .isString()
            .withMessage('Event must be a string'),
        (0, express_validator_1.body)('data')
            .optional()
            .isObject()
            .withMessage('Data must be an object'),
        (0, express_validator_1.body)('sessionId')
            .optional()
            .isString()
            .withMessage('Session ID must be a string'),
        (0, express_validator_1.body)('agentId')
            .optional()
            .isString()
            .withMessage('Agent ID must be a string')
    ], validation_1.validateRequest, pipedreamController.triggerWorkflow);
    // Event sending routes
    router.post('/events/collaboration', auth_1.authenticateToken, [
        (0, express_validator_1.body)('event')
            .notEmpty()
            .isString()
            .withMessage('Event is required and must be a string'),
        (0, express_validator_1.body)('sessionId')
            .notEmpty()
            .isString()
            .withMessage('Session ID is required and must be a string'),
        (0, express_validator_1.body)('data')
            .optional()
            .isObject()
            .withMessage('Data must be an object')
    ], validation_1.validateRequest, pipedreamController.sendCollaborationEvent);
    router.post('/events/agent', auth_1.authenticateToken, [
        (0, express_validator_1.body)('event')
            .notEmpty()
            .isString()
            .withMessage('Event is required and must be a string'),
        (0, express_validator_1.body)('agentId')
            .notEmpty()
            .isString()
            .withMessage('Agent ID is required and must be a string'),
        (0, express_validator_1.body)('data')
            .optional()
            .isObject()
            .withMessage('Data must be an object')
    ], validation_1.validateRequest, pipedreamController.sendAgentEvent);
    return router;
}
