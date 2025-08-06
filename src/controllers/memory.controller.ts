import { Request, Response, NextFunction } from 'express';
import { MemoryService } from '../services/memory.service';
import { asyncHandler } from '../middleware/errorHandler';

const memoryService = new MemoryService();

export class MemoryController {
  // Get all memories
  getMemories = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const agentId = req.query.agentId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const memories = await memoryService.getMemories(userId, agentId, limit, offset);
    res.status(200).json({ success: true, data: { memories } });
  });

  // Get memory by ID
  getMemoryById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const memory = await memoryService.getMemoryById(id, userId);
    res.status(200).json({ success: true, data: { memory } });
  });

  // Create memory
  createMemory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const memory = await memoryService.createMemory(userId, req.body);
    res.status(201).json({ success: true, data: { memory } });
  });

  // Update memory
  updateMemory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const memory = await memoryService.updateMemory(id, userId, req.body);
    res.status(200).json({ success: true, data: { memory } });
  });

  // Delete memory
  deleteMemory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    await memoryService.deleteMemory(id, userId);
    res.status(200).json({ success: true, message: 'Memory deleted successfully' });
  });

  // Clear agent memories
  clearAgentMemories = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { agentId } = req.params;
    await memoryService.clearAgentMemories(agentId, userId);
    res.status(200).json({ success: true, message: 'Agent memories cleared successfully' });
  });

  // Search memories
  searchMemories = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { query, agentId } = req.body;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const memories = await memoryService.searchMemories(userId, query, agentId, limit);
    res.status(200).json({ success: true, data: { memories } });
  });

  // Import memories
  importMemories = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { agentId, memories } = req.body;
    const result = await memoryService.importMemories(userId, agentId, memories);
    res.status(201).json({ success: true, data: { result } });
  });

  // Export memories
  exportMemories = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { agentId } = req.params;
    const memories = await memoryService.exportMemories(agentId, userId);
    res.status(200).json({ success: true, data: { memories } });
  });
}