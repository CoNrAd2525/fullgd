import { Router } from 'express';
import { authenticate } from '../utils/auth';
import { ToolController } from '../controllers';

const router = Router();
const toolController = new ToolController();

// Get all tools
router.get('/', authenticate, toolController.getTools);

// Create a new tool
router.post('/', authenticate, toolController.createTool);

// Get tool by ID
router.get('/:id', authenticate, toolController.getToolById);

// Update tool
router.put('/:id', authenticate, toolController.updateTool);

// Delete tool
router.delete('/:id', authenticate, toolController.deleteTool);

// Test tool connection
router.post('/:id/test-connection', authenticate, toolController.testConnection);

// Get tool schema
router.get('/:id/schema', authenticate, toolController.getToolSchema);

// Execute tool
router.post('/:id/execute', authenticate, toolController.executeTool);

// Connect tool to agent
router.post('/:id/connect/:agentId', authenticate, toolController.connectToolToAgent);

// Disconnect tool from agent
router.delete('/:id/disconnect/:agentId', authenticate, toolController.disconnectToolFromAgent);

// Get tool categories
router.get('/categories', authenticate, toolController.getToolCategories);

// Import tool from marketplace
router.post('/import/marketplace/:marketplaceId', authenticate, toolController.importToolFromMarketplace);

export default router;