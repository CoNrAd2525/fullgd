"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../utils/auth");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
const toolController = new controllers_1.ToolController();
// Get all tools
router.get('/', auth_1.authenticate, toolController.getTools);
// Create a new tool
router.post('/', auth_1.authenticate, toolController.createTool);
// Get tool by ID
router.get('/:id', auth_1.authenticate, toolController.getToolById);
// Update tool
router.put('/:id', auth_1.authenticate, toolController.updateTool);
// Delete tool
router.delete('/:id', auth_1.authenticate, toolController.deleteTool);
// Test tool connection
router.post('/:id/test-connection', auth_1.authenticate, toolController.testConnection);
// Get tool schema
router.get('/:id/schema', auth_1.authenticate, toolController.getToolSchema);
// Execute tool
router.post('/:id/execute', auth_1.authenticate, toolController.executeTool);
// Connect tool to agent
router.post('/:id/connect/:agentId', auth_1.authenticate, toolController.connectToolToAgent);
// Disconnect tool from agent
router.delete('/:id/disconnect/:agentId', auth_1.authenticate, toolController.disconnectToolFromAgent);
// Get tool categories
router.get('/categories', auth_1.authenticate, toolController.getToolCategories);
// Import tool from marketplace
router.post('/import/marketplace/:marketplaceId', auth_1.authenticate, toolController.importToolFromMarketplace);
exports.default = router;
