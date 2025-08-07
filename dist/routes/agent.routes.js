"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../utils/auth");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
const agentController = new controllers_1.AgentController();
// Get all agents
router.get('/', auth_1.authenticate, agentController.getAgents);
// Get agent by ID
router.get('/:id', auth_1.authenticate, agentController.getAgentById);
// Create agent
router.post('/', auth_1.authenticate, agentController.createAgent);
// Update agent
router.put('/:id', auth_1.authenticate, agentController.updateAgent);
// Delete agent
router.delete('/:id', auth_1.authenticate, agentController.deleteAgent);
// Run agent
router.post('/:id/run', auth_1.authenticate, agentController.runAgent);
// Stop agent execution
router.post('/:id/executions/:executionId/stop', auth_1.authenticate, agentController.stopAgent);
// Get agent execution status
router.get('/:id/executions/:executionId/status', auth_1.authenticate, agentController.getAgentExecutionStatus);
// Get agent execution logs
router.get('/:id/executions/:executionId/logs', auth_1.authenticate, agentController.getAgentExecutionLogs);
// Clone agent
router.post('/:id/clone', auth_1.authenticate, agentController.cloneAgent);
// Export agent
router.get('/:id/export', auth_1.authenticate, agentController.exportAgent);
// Import agent
router.post('/import', auth_1.authenticate, agentController.importAgent);
exports.default = router;
