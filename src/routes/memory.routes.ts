import { Router } from 'express';
import { authenticate } from '../utils/auth';
import { MemoryController } from '../controllers';

const router = Router();
const memoryController = new MemoryController();

// Get all memories
router.get('/', authenticate, memoryController.getMemories);

// Get memory by ID
router.get('/:id', authenticate, memoryController.getMemoryById);

// Create memory
router.post('/', authenticate, memoryController.createMemory);

// Update memory
router.put('/:id', authenticate, memoryController.updateMemory);

// Delete memory
router.delete('/:id', authenticate, memoryController.deleteMemory);

// Clear agent memories
router.delete('/agent/:agentId/clear', authenticate, memoryController.clearAgentMemories);

// Search memories
router.post('/search', authenticate, memoryController.searchMemories);

// Import memories
router.post('/import', authenticate, memoryController.importMemories);

// Export memories
router.get('/export/:agentId', authenticate, memoryController.exportMemories);

export default router;