import { Router } from 'express';
import { authenticate } from '../utils/auth';
import { AgentController } from '../controllers';

const router = Router();
const agentController = new AgentController();

// Get all agents
router.get('/', authenticate, agentController.getAgents);

// Get agent by ID
router.get('/:id', authenticate, agentController.getAgentById);

// Create agent
router.post('/', authenticate, agentController.createAgent);

// Update agent
router.put('/:id', authenticate, agentController.updateAgent);

// Delete agent
router.delete('/:id', authenticate, agentController.deleteAgent);

// Run agent
router.post('/:id/run', authenticate, agentController.runAgent);

// Stop agent execution
router.post('/:id/executions/:executionId/stop', authenticate, agentController.stopAgent);

// Get agent execution status
router.get('/:id/executions/:executionId/status', authenticate, agentController.getAgentExecutionStatus);

// Get agent execution logs
router.get('/:id/executions/:executionId/logs', authenticate, agentController.getAgentExecutionLogs);

// Clone agent
router.post('/:id/clone', authenticate, agentController.cloneAgent);

// Export agent
router.get('/:id/export', authenticate, agentController.exportAgent);

// Import agent
router.post('/import', authenticate, agentController.importAgent);

export default router;