import { Router } from 'express';
import { authenticate } from '../utils/auth';
import { KnowledgeController } from '../controllers';

const router = Router();
const knowledgeController = new KnowledgeController();

// Get all knowledge bases
router.get('/', authenticate, knowledgeController.getKnowledgeBases);

// Create a new knowledge base
router.post('/', authenticate, knowledgeController.createKnowledgeBase);

// Get knowledge base by ID
router.get('/:id', authenticate, knowledgeController.getKnowledgeBaseById);

// Update knowledge base
router.put('/:id', authenticate, knowledgeController.updateKnowledgeBase);

// Delete knowledge base
router.delete('/:id', authenticate, knowledgeController.deleteKnowledgeBase);

// Upload document to knowledge base
router.post('/:id/documents', authenticate, knowledgeController.uploadDocument);

// Get all documents in a knowledge base
router.get('/:id/documents', authenticate, knowledgeController.getDocuments);

// Delete document from knowledge base
router.delete('/:id/documents/:documentId', authenticate, knowledgeController.deleteDocument);

// Search knowledge base
router.post('/:id/search', authenticate, knowledgeController.searchKnowledgeBase);

// Sync knowledge base (refresh embeddings)
router.post('/:id/sync', authenticate, knowledgeController.syncKnowledgeBase);

// Get knowledge base sync status
router.get('/:id/sync/:syncId', authenticate, knowledgeController.getSyncStatus);

// Connect knowledge base to agent
router.post('/:id/connect/:agentId', authenticate, knowledgeController.connectKnowledgeBaseToAgent);

// Disconnect knowledge base from agent
router.delete('/:id/disconnect/:agentId', authenticate, knowledgeController.disconnectKnowledgeBaseFromAgent);

export default router;