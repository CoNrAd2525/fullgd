import { Request, Response, NextFunction } from 'express';
import { KnowledgeService } from '../services/knowledge.service';
import { asyncHandler } from '../middleware/errorHandler';

const knowledgeService = new KnowledgeService();

export class KnowledgeController {
  // Get all knowledge bases
  getKnowledgeBases = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const knowledgeBases = await knowledgeService.getKnowledgeBases(userId);
    res.status(200).json({ success: true, data: { knowledgeBases } });
  });

  // Get knowledge base by ID
  getKnowledgeBaseById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const knowledgeBase = await knowledgeService.getKnowledgeBaseById(id, userId);
    res.status(200).json({ success: true, data: { knowledgeBase } });
  });

  // Create knowledge base
  createKnowledgeBase = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const knowledgeBase = await knowledgeService.createKnowledgeBase(userId, req.body);
    res.status(201).json({ success: true, data: { knowledgeBase } });
  });

  // Update knowledge base
  updateKnowledgeBase = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const knowledgeBase = await knowledgeService.updateKnowledgeBase(id, userId, req.body);
    res.status(200).json({ success: true, data: { knowledgeBase } });
  });

  // Delete knowledge base
  deleteKnowledgeBase = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    await knowledgeService.deleteKnowledgeBase(id, userId);
    res.status(200).json({ success: true, message: 'Knowledge base deleted successfully' });
  });

  // Upload document to knowledge base
  uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    // Assuming file upload middleware has been applied
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const document = await knowledgeService.uploadDocument(id, userId, file);
    res.status(201).json({ success: true, data: { document } });
  });

  // Delete document from knowledge base
  deleteDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, documentId } = req.params;
    await knowledgeService.deleteDocument(id, documentId, userId);
    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  });

  // Get documents in knowledge base
  getDocuments = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const documents = await knowledgeService.getDocuments(id, userId);
    res.status(200).json({ success: true, data: { documents } });
  });

  // Search knowledge base
  searchKnowledgeBase = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { query } = req.body;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const results = await knowledgeService.searchKnowledgeBase(id, userId, query, limit);
    res.status(200).json({ success: true, data: { results } });
  });

  // Sync knowledge base
  syncKnowledgeBase = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.params;
    const result = await knowledgeService.syncKnowledgeBase(id, userId);
    res.status(200).json({ success: true, data: { result } });
  });

  // Connect knowledge base to agent
  connectKnowledgeBaseToAgent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, agentId } = req.params;
    await knowledgeService.connectKnowledgeBaseToAgent(id, agentId, userId);
    res.status(200).json({ success: true, message: 'Knowledge base connected to agent successfully' });
  });

  // Disconnect knowledge base from agent
  disconnectKnowledgeBaseFromAgent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id, agentId } = req.params;
    await knowledgeService.disconnectKnowledgeBaseFromAgent(id, agentId, userId);
    res.status(200).json({ success: true, message: 'Knowledge base disconnected from agent successfully' });
  });
}