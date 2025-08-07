"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../utils/auth");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
const knowledgeController = new controllers_1.KnowledgeController();
// Get all knowledge bases
router.get('/', auth_1.authenticate, knowledgeController.getKnowledgeBases);
// Create a new knowledge base
router.post('/', auth_1.authenticate, knowledgeController.createKnowledgeBase);
// Get knowledge base by ID
router.get('/:id', auth_1.authenticate, knowledgeController.getKnowledgeBaseById);
// Update knowledge base
router.put('/:id', auth_1.authenticate, knowledgeController.updateKnowledgeBase);
// Delete knowledge base
router.delete('/:id', auth_1.authenticate, knowledgeController.deleteKnowledgeBase);
// Upload document to knowledge base
router.post('/:id/documents', auth_1.authenticate, knowledgeController.uploadDocument);
// Get all documents in a knowledge base
router.get('/:id/documents', auth_1.authenticate, knowledgeController.getDocuments);
// Delete document from knowledge base
router.delete('/:id/documents/:documentId', auth_1.authenticate, knowledgeController.deleteDocument);
// Search knowledge base
router.post('/:id/search', auth_1.authenticate, knowledgeController.searchKnowledgeBase);
// Sync knowledge base (refresh embeddings)
router.post('/:id/sync', auth_1.authenticate, knowledgeController.syncKnowledgeBase);
// Get knowledge base sync status
router.get('/:id/sync/:syncId', auth_1.authenticate, knowledgeController.getSyncStatus);
// Connect knowledge base to agent
router.post('/:id/connect/:agentId', auth_1.authenticate, knowledgeController.connectKnowledgeBaseToAgent);
// Disconnect knowledge base from agent
router.delete('/:id/disconnect/:agentId', auth_1.authenticate, knowledgeController.disconnectKnowledgeBaseFromAgent);
exports.default = router;
