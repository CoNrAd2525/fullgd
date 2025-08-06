import { Request, Response, NextFunction } from 'express';
import { WorkflowService } from '../services/workflow.service';
import { asyncHandler } from '../middleware/errorHandler';

const workflowService = new WorkflowService();

export class WorkflowController {
  // Get all workflows
  getWorkflows = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const workflows = await workflowService.getWorkflows(userId);
    res.status(200).json({ success: true, data: { workflows } });
  });

  // Get workflow by ID
  getWorkflowById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const workflow = await workflowService.getWorkflowById(id, userId);
    res.status(200).json({ success: true, data: { workflow } });
  });

  // Create workflow
  createWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const workflow = await workflowService.createWorkflow(userId, req.body);
    res.status(201).json({ success: true, data: { workflow } });
  });

  // Update workflow
  updateWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const workflow = await workflowService.updateWorkflow(id, userId, req.body);
    res.status(200).json({ success: true, data: { workflow } });
  });

  // Delete workflow
  deleteWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    await workflowService.deleteWorkflow(id, userId);
    res.status(200).json({ success: true, message: 'Workflow deleted successfully' });
  });

  // Add agent to workflow
  addAgentToWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { agentId, position, config } = req.body;
    const workflow = await workflowService.addAgentToWorkflow(id, userId, agentId, position, config);
    res.status(200).json({ success: true, data: { workflow } });
  });

  // Remove agent from workflow
  removeAgentFromWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, agentId } = req.params;
    const workflow = await workflowService.removeAgentFromWorkflow(id, userId, agentId);
    res.status(200).json({ success: true, data: { workflow } });
  });

  // Update agent position in workflow
  updateAgentPosition = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, agentId } = req.params;
    const { position } = req.body;
    const workflow = await workflowService.updateAgentPosition(id, userId, agentId, position);
    res.status(200).json({ success: true, data: { workflow } });
  });

  // Run workflow
  runWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { input } = req.body;
    const execution = await workflowService.runWorkflow(id, userId, input);
    res.status(200).json({ success: true, data: { execution } });
  });

  // Stop workflow execution
  stopWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, executionId } = req.params;
    await workflowService.stopWorkflow(id, executionId, userId);
    res.status(200).json({ success: true, message: 'Workflow execution stopped successfully' });
  });

  // Get workflow execution status
  getWorkflowExecutionStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, executionId } = req.params;
    const status = await workflowService.getWorkflowExecutionStatus(id, executionId, userId);
    res.status(200).json({ success: true, data: { status } });
  });

  // Get workflow execution logs
  getWorkflowExecutionLogs = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, executionId } = req.params;
    const logs = await workflowService.getWorkflowExecutionLogs(id, executionId, userId);
    res.status(200).json({ success: true, data: { logs } });
  });

  // Clone workflow
  cloneWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name } = req.body;
    const clonedWorkflow = await workflowService.cloneWorkflow(id, userId, name);
    res.status(201).json({ success: true, data: { workflow: clonedWorkflow } });
  });

  // Export workflow
  exportWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const exportData = await workflowService.exportWorkflow(id, userId);
    res.status(200).json({ success: true, data: exportData });
  });

  // Import workflow
  importWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const workflow = await workflowService.importWorkflow(userId, req.body);
    res.status(201).json({ success: true, data: { workflow } });
  });
}