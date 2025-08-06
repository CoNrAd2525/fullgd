import { Request, Response, NextFunction } from 'express';
import { ToolService } from '../services/tool.service';
import { asyncHandler } from '../middleware/errorHandler';

const toolService = new ToolService();

export class ToolController {
  // Get all tools
  getTools = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const tools = await toolService.getTools(userId);
    res.status(200).json({ success: true, data: { tools } });
  });

  // Get tool by ID
  getToolById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const tool = await toolService.getToolById(id, userId);
    res.status(200).json({ success: true, data: { tool } });
  });

  // Create tool
  createTool = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const tool = await toolService.createTool(userId, req.body);
    res.status(201).json({ success: true, data: { tool } });
  });

  // Update tool
  updateTool = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const tool = await toolService.updateTool(id, userId, req.body);
    res.status(200).json({ success: true, data: { tool } });
  });

  // Delete tool
  deleteTool = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    await toolService.deleteTool(id, userId);
    res.status(200).json({ success: true, message: 'Tool deleted successfully' });
  });

  // Test tool connection
  testConnection = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const result = await toolService.testConnection(id, userId);
    res.status(200).json({ success: true, data: { result } });
  });

  // Get tool schema
  getToolSchema = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const schema = await toolService.getToolSchema(id, userId);
    res.status(200).json({ success: true, data: { schema } });
  });

  // Execute tool
  executeTool = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { params } = req.body;
    const result = await toolService.executeTool(id, userId, params);
    res.status(200).json({ success: true, data: { result } });
  });

  // Connect tool to agent
  connectToolToAgent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, agentId } = req.params;
    await toolService.connectToolToAgent(id, agentId, userId);
    res.status(200).json({ success: true, message: 'Tool connected to agent successfully' });
  });

  // Disconnect tool from agent
  disconnectToolFromAgent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, agentId } = req.params;
    await toolService.disconnectToolFromAgent(id, agentId, userId);
    res.status(200).json({ success: true, message: 'Tool disconnected from agent successfully' });
  });

  // Get tool categories
  getToolCategories = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await toolService.getToolCategories();
    res.status(200).json({ success: true, data: { categories } });
  });

  // Import tool from marketplace
  importToolFromMarketplace = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { marketplaceId } = req.params;
    const tool = await toolService.importToolFromMarketplace(userId, marketplaceId);
    res.status(201).json({ success: true, data: { tool } });
  });
}