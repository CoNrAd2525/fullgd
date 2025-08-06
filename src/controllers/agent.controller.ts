import { Request, Response, NextFunction } from 'express';
import { AgentService } from '../services/agent.service';
import { asyncHandler } from '../middleware/errorHandler';

const agentService = new AgentService();

export class AgentController {
  // Get all agents
  getAgents = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const agents = await agentService.getAgents(userId);
    res.status(200).json({ success: true, data: { agents } });
  });

  // Get agent by ID
  getAgentById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const agent = await agentService.getAgentById(id, userId);
    res.status(200).json({ success: true, data: { agent } });
  });

  // Create agent
  createAgent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const agent = await agentService.createAgent(userId, req.body);
    res.status(201).json({ success: true, data: { agent } });
  });

  // Update agent
  updateAgent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const agent = await agentService.updateAgent(id, userId, req.body);
    res.status(200).json({ success: true, data: { agent } });
  });

  // Delete agent
  deleteAgent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    await agentService.deleteAgent(id, userId);
    res.status(200).json({ success: true, message: 'Agent deleted successfully' });
  });

  // Run agent
  runAgent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { input } = req.body;
    const execution = await agentService.runAgent(id, userId, input);
    res.status(200).json({ success: true, data: { execution } });
  });

  // Stop agent execution
  stopAgent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, executionId } = req.params;
    await agentService.stopAgent(id, executionId, userId);
    res.status(200).json({ success: true, message: 'Agent execution stopped successfully' });
  });

  // Get agent execution status
  getAgentExecutionStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, executionId } = req.params;
    const status = await agentService.getAgentExecutionStatus(id, executionId, userId);
    res.status(200).json({ success: true, data: { status } });
  });

  // Get agent execution logs
  getAgentExecutionLogs = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, executionId } = req.params;
    const logs = await agentService.getAgentExecutionLogs(id, executionId, userId);
    res.status(200).json({ success: true, data: { logs } });
  });

  // Clone agent
  cloneAgent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name } = req.body;
    const clonedAgent = await agentService.cloneAgent(id, userId, name);
    res.status(201).json({ success: true, data: { agent: clonedAgent } });
  });

  // Export agent
  exportAgent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const exportData = await agentService.exportAgent(id, userId);
    res.status(200).json({ success: true, data: exportData });
  });

  // Import agent
  importAgent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const agent = await agentService.importAgent(userId, req.body);
    res.status(201).json({ success: true, data: { agent } });
  });
}