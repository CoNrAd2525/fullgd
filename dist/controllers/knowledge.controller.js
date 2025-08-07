"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeController = void 0;
const knowledge_service_1 = require("../services/knowledge.service");
const errorHandler_1 = require("../middleware/errorHandler");
const knowledgeService = new knowledge_service_1.KnowledgeService();
class KnowledgeController {
    constructor() {
        // Get all knowledge bases
        this.getKnowledgeBases = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const knowledgeBases = await knowledgeService.getKnowledgeBases(userId);
            res.status(200).json({ success: true, data: { knowledgeBases } });
        });
        // Get knowledge base by ID
        this.getKnowledgeBaseById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const knowledgeBase = await knowledgeService.getKnowledgeBaseById(id, userId);
            res.status(200).json({ success: true, data: { knowledgeBase } });
        });
        // Create knowledge base
        this.createKnowledgeBase = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const knowledgeBase = await knowledgeService.createKnowledgeBase(userId, req.body);
            res.status(201).json({ success: true, data: { knowledgeBase } });
        });
        // Update knowledge base
        this.updateKnowledgeBase = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const knowledgeBase = await knowledgeService.updateKnowledgeBase(id, userId, req.body);
            res.status(200).json({ success: true, data: { knowledgeBase } });
        });
        // Delete knowledge base
        this.deleteKnowledgeBase = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            await knowledgeService.deleteKnowledgeBase(id, userId);
            res.status(200).json({ success: true, message: 'Knowledge base deleted successfully' });
        });
        // Upload document to knowledge base
        this.uploadDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        this.deleteDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id, documentId } = req.params;
            await knowledgeService.deleteDocument(id, documentId, userId);
            res.status(200).json({ success: true, message: 'Document deleted successfully' });
        });
        // Get documents in knowledge base
        this.getDocuments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const documents = await knowledgeService.getDocuments(id, userId);
            res.status(200).json({ success: true, data: { documents } });
        });
        // Search knowledge base
        this.searchKnowledgeBase = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const { query } = req.body;
            const limit = parseInt(req.query.limit) || 10;
            const results = await knowledgeService.searchKnowledgeBase(id, userId, query, limit);
            res.status(200).json({ success: true, data: { results } });
        });
        // Sync knowledge base
        this.syncKnowledgeBase = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const result = await knowledgeService.syncKnowledgeBase(id, userId);
            res.status(200).json({ success: true, data: { result } });
        });
        // Connect knowledge base to agent
        this.connectKnowledgeBaseToAgent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id, agentId } = req.params;
            await knowledgeService.connectKnowledgeBaseToAgent(id, agentId, userId);
            res.status(200).json({ success: true, message: 'Knowledge base connected to agent successfully' });
        });
        // Disconnect knowledge base from agent
        this.disconnectKnowledgeBaseFromAgent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id, agentId } = req.params;
            await knowledgeService.disconnectKnowledgeBaseFromAgent(id, agentId, userId);
            res.status(200).json({ success: true, message: 'Knowledge base disconnected from agent successfully' });
        });
    }
}
exports.KnowledgeController = KnowledgeController;
