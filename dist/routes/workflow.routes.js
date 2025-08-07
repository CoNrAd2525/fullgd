"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../utils/auth");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
const workflowController = new controllers_1.WorkflowController();
// Get all workflows
router.get('/', auth_1.authenticate, workflowController.getWorkflows);
// Get workflow by ID
router.get('/:id', auth_1.authenticate, workflowController.getWorkflowById);
// Create workflow
router.post('/', auth_1.authenticate, workflowController.createWorkflow);
// Update workflow
router.put('/:id', auth_1.authenticate, workflowController.updateWorkflow);
// Delete workflow
router.delete('/:id', auth_1.authenticate, workflowController.deleteWorkflow);
// Run workflow
router.post('/:id/run', auth_1.authenticate, workflowController.runWorkflow);
// Get workflow execution status
router.get('/:id/executions/:executionId/status', auth_1.authenticate, workflowController.getWorkflowExecutionStatus);
// Get workflow execution logs
router.get('/:id/executions/:executionId/logs', auth_1.authenticate, workflowController.getWorkflowExecutionLogs);
// Stop workflow execution
router.post('/:id/executions/:executionId/stop', auth_1.authenticate, workflowController.stopWorkflow);
// Clone workflow
router.post('/:id/clone', auth_1.authenticate, workflowController.cloneWorkflow);
// Export workflow
router.get('/:id/export', auth_1.authenticate, workflowController.exportWorkflow);
// Import workflow
router.post('/import', auth_1.authenticate, workflowController.importWorkflow);
// Add agent to workflow
router.post('/:id/agents', auth_1.authenticate, workflowController.addAgentToWorkflow);
// Remove agent from workflow
router.delete('/:id/agents/:agentId', auth_1.authenticate, workflowController.removeAgentFromWorkflow);
// Update agent position in workflow
router.put('/:id/agents/:agentId/position', auth_1.authenticate, workflowController.updateAgentPosition);
exports.default = router;
