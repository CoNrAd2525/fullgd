"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolController = void 0;
const tool_service_1 = require("../services/tool.service");
const errorHandler_1 = require("../middleware/errorHandler");
const toolService = new tool_service_1.ToolService();
class ToolController {
    constructor() {
        // Get all tools
        this.getTools = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const tools = await toolService.getTools(userId);
            res.status(200).json({ success: true, data: { tools } });
        });
        // Get tool by ID
        this.getToolById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const tool = await toolService.getToolById(id, userId);
            res.status(200).json({ success: true, data: { tool } });
        });
        // Create tool
        this.createTool = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const tool = await toolService.createTool(userId, req.body);
            res.status(201).json({ success: true, data: { tool } });
        });
        // Update tool
        this.updateTool = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const tool = await toolService.updateTool(id, userId, req.body);
            res.status(200).json({ success: true, data: { tool } });
        });
        // Delete tool
        this.deleteTool = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            await toolService.deleteTool(id, userId);
            res.status(200).json({ success: true, message: 'Tool deleted successfully' });
        });
        // Test tool connection
        this.testConnection = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const result = await toolService.testConnection(id, userId);
            res.status(200).json({ success: true, data: { result } });
        });
        // Get tool schema
        this.getToolSchema = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const schema = await toolService.getToolSchema(id, userId);
            res.status(200).json({ success: true, data: { schema } });
        });
        // Execute tool
        this.executeTool = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const { params } = req.body;
            const result = await toolService.executeTool(id, userId, params);
            res.status(200).json({ success: true, data: { result } });
        });
        // Connect tool to agent
        this.connectToolToAgent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id, agentId } = req.params;
            await toolService.connectToolToAgent(id, agentId, userId);
            res.status(200).json({ success: true, message: 'Tool connected to agent successfully' });
        });
        // Disconnect tool from agent
        this.disconnectToolFromAgent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id, agentId } = req.params;
            await toolService.disconnectToolFromAgent(id, agentId, userId);
            res.status(200).json({ success: true, message: 'Tool disconnected from agent successfully' });
        });
        // Get tool categories
        this.getToolCategories = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
            const categories = await toolService.getToolCategories();
            res.status(200).json({ success: true, data: { categories } });
        });
        // Import tool from marketplace
        this.importToolFromMarketplace = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { marketplaceId } = req.params;
            const tool = await toolService.importToolFromMarketplace(userId, marketplaceId);
            res.status(201).json({ success: true, data: { tool } });
        });
    }
}
exports.ToolController = ToolController;
