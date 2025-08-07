"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../utils/auth");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
const memoryController = new controllers_1.MemoryController();
// Get all memories
router.get('/', auth_1.authenticate, memoryController.getMemories);
// Get memory by ID
router.get('/:id', auth_1.authenticate, memoryController.getMemoryById);
// Create memory
router.post('/', auth_1.authenticate, memoryController.createMemory);
// Update memory
router.put('/:id', auth_1.authenticate, memoryController.updateMemory);
// Delete memory
router.delete('/:id', auth_1.authenticate, memoryController.deleteMemory);
// Clear agent memories
router.delete('/agent/:agentId/clear', auth_1.authenticate, memoryController.clearAgentMemories);
// Search memories
router.post('/search', auth_1.authenticate, memoryController.searchMemories);
// Import memories
router.post('/import', auth_1.authenticate, memoryController.importMemories);
// Export memories
router.get('/export/:agentId', auth_1.authenticate, memoryController.exportMemories);
exports.default = router;
