"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentController = void 0;
const agent_service_1 = require("../services/agent.service");
const errorHandler_1 = require("../middleware/errorHandler");
const agentService = new agent_service_1.AgentService();
class AgentController {
    constructor() {
        // Get all agents
        this.getAgents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const agents = await agentService.getAgents(userId);
            res.status(200).json({ success: true, data: { agents } });
        });
        // Get agent by ID
        this.getAgentById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const agent = await agentService.getAgentById(id, userId);
            res.status(200).json({ success: true, data: { agent } });
        });
        // Create agent
        this.createAgent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const agent = await agentService.createAgent(userId, req.body);
            res.status(201).json({ success: true, data: { agent } });
        });
        // Update agent
        this.updateAgent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const agent = await agentService.updateAgent(id, userId, req.body);
            res.status(200).json({ success: true, data: { agent } });
        });
        // Delete agent
        this.deleteAgent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            await agentService.deleteAgent(id, userId);
            res.status(200).json({ success: true, message: 'Agent deleted successfully' });
        });
        // Run agent
        this.runAgent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const { input } = req.body;
            const execution = await agentService.runAgent(id, userId, input);
            res.status(200).json({ success: true, data: { execution } });
        });
        // Stop agent execution
        this.stopAgent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id, executionId } = req.params;
            await agentService.stopAgent(id, executionId, userId);
            res.status(200).json({ success: true, message: 'Agent execution stopped successfully' });
        });
        // Get agent execution status
        this.getAgentExecutionStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id, executionId } = req.params;
            const status = await agentService.getAgentExecutionStatus(id, executionId, userId);
            res.status(200).json({ success: true, data: { status } });
        });
        // Get agent execution logs
        this.getAgentExecutionLogs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id, executionId } = req.params;
            const logs = await agentService.getAgentExecutionLogs(id, executionId, userId);
            res.status(200).json({ success: true, data: { logs } });
        });
        // Clone agent
        this.cloneAgent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const { name } = req.body;
            const clonedAgent = await agentService.cloneAgent(id, userId, name);
            res.status(201).json({ success: true, data: { agent: clonedAgent } });
        });
        // Export agent
        this.exportAgent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const exportData = await agentService.exportAgent(id, userId);
            res.status(200).json({ success: true, data: exportData });
        });
        // Import agent
        this.importAgent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const agent = await agentService.importAgent(userId, req.body);
            res.status(201).json({ success: true, data: { agent } });
        });
    }
}
exports.AgentController = AgentController;
