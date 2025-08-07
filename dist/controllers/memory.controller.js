"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryController = void 0;
const memory_service_1 = require("../services/memory.service");
const errorHandler_1 = require("../middleware/errorHandler");
const memoryService = new memory_service_1.MemoryService();
class MemoryController {
    constructor() {
        // Get all memories
        this.getMemories = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const agentId = req.query.agentId;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const memories = await memoryService.getMemories(userId, agentId, limit, offset);
            res.status(200).json({ success: true, data: { memories } });
        });
        // Get memory by ID
        this.getMemoryById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const memory = await memoryService.getMemoryById(id, userId);
            res.status(200).json({ success: true, data: { memory } });
        });
        // Create memory
        this.createMemory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const memory = await memoryService.createMemory(userId, req.body);
            res.status(201).json({ success: true, data: { memory } });
        });
        // Update memory
        this.updateMemory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const memory = await memoryService.updateMemory(id, userId, req.body);
            res.status(200).json({ success: true, data: { memory } });
        });
        // Delete memory
        this.deleteMemory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            await memoryService.deleteMemory(id, userId);
            res.status(200).json({ success: true, message: 'Memory deleted successfully' });
        });
        // Clear agent memories
        this.clearAgentMemories = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { agentId } = req.params;
            await memoryService.clearAgentMemories(agentId, userId);
            res.status(200).json({ success: true, message: 'Agent memories cleared successfully' });
        });
        // Search memories
        this.searchMemories = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { query, agentId } = req.body;
            const limit = parseInt(req.query.limit) || 10;
            const memories = await memoryService.searchMemories(userId, query, agentId, limit);
            res.status(200).json({ success: true, data: { memories } });
        });
        // Import memories
        this.importMemories = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { agentId, memories } = req.body;
            const result = await memoryService.importMemories(userId, agentId, memories);
            res.status(201).json({ success: true, data: { result } });
        });
        // Export memories
        this.exportMemories = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { agentId } = req.params;
            const memories = await memoryService.exportMemories(agentId, userId);
            res.status(200).json({ success: true, data: { memories } });
        });
    }
}
exports.MemoryController = MemoryController;
