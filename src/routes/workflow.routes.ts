import { Router } from 'express';
import { authenticate } from '../utils/auth';
import { WorkflowController } from '../controllers';

const router = Router();
const workflowController = new WorkflowController();

// Get all workflows
router.get('/', authenticate, workflowController.getWorkflows);

// Get workflow by ID
router.get('/:id', authenticate, workflowController.getWorkflowById);

// Create workflow
router.post('/', authenticate, workflowController.createWorkflow);

// Update workflow
router.put('/:id', authenticate, workflowController.updateWorkflow);

// Delete workflow
router.delete('/:id', authenticate, workflowController.deleteWorkflow);

// Run workflow
router.post('/:id/run', authenticate, workflowController.runWorkflow);

// Get workflow execution status
router.get('/:id/executions/:executionId/status', authenticate, workflowController.getWorkflowExecutionStatus);

// Get workflow execution logs
router.get('/:id/executions/:executionId/logs', authenticate, workflowController.getWorkflowExecutionLogs);

// Stop workflow execution
router.post('/:id/executions/:executionId/stop', authenticate, workflowController.stopWorkflow);

// Clone workflow
router.post('/:id/clone', authenticate, workflowController.cloneWorkflow);

// Export workflow
router.get('/:id/export', authenticate, workflowController.exportWorkflow);

// Import workflow
router.post('/import', authenticate, workflowController.importWorkflow);

// Add agent to workflow
router.post('/:id/agents', authenticate, workflowController.addAgentToWorkflow);

// Remove agent from workflow
router.delete('/:id/agents/:agentId', authenticate, workflowController.removeAgentFromWorkflow);

// Update agent position in workflow
router.put('/:id/agents/:agentId/position', authenticate, workflowController.updateAgentPosition);

export default router;