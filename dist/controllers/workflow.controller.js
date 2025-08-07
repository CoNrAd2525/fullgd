"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const workflow_service_1 = require("../services/workflow.service");
const errorHandler_1 = require("../middleware/errorHandler");
const workflowService = new workflow_service_1.WorkflowService();
class WorkflowController {
    constructor() {
        // Get all workflows
        this.getWorkflows = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const workflows = await workflowService.getWorkflows(userId);
            res.status(200).json({ success: true, data: { workflows } });
        });
        // Get workflow by ID
        this.getWorkflowById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const workflow = await workflowService.getWorkflowById(id, userId);
            res.status(200).json({ success: true, data: { workflow } });
        });
        // Create workflow
        this.createWorkflow = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const workflow = await workflowService.createWorkflow(userId, req.body);
            res.status(201).json({ success: true, data: { workflow } });
        });
        // Update workflow
        this.updateWorkflow = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const workflow = await workflowService.updateWorkflow(id, userId, req.body);
            res.status(200).json({ success: true, data: { workflow } });
        });
        // Delete workflow
        this.deleteWorkflow = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            await workflowService.deleteWorkflow(id, userId);
            res.status(200).json({ success: true, message: 'Workflow deleted successfully' });
        });
        // Add agent to workflow
        this.addAgentToWorkflow = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const { agentId, position, config } = req.body;
            const workflow = await workflowService.addAgentToWorkflow(id, userId, agentId, position, config);
            res.status(200).json({ success: true, data: { workflow } });
        });
        // Remove agent from workflow
        this.removeAgentFromWorkflow = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id, agentId } = req.params;
            const workflow = await workflowService.removeAgentFromWorkflow(id, userId, agentId);
            res.status(200).json({ success: true, data: { workflow } });
        });
        // Update agent position in workflow
        this.updateAgentPosition = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id, agentId } = req.params;
            const { position } = req.body;
            const workflow = await workflowService.updateAgentPosition(id, userId, agentId, position);
            res.status(200).json({ success: true, data: { workflow } });
        });
        // Run workflow
        this.runWorkflow = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const { input } = req.body;
            const execution = await workflowService.runWorkflow(id, userId, input);
            res.status(200).json({ success: true, data: { execution } });
        });
        // Stop workflow execution
        this.stopWorkflow = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id, executionId } = req.params;
            await workflowService.stopWorkflow(id, executionId, userId);
            res.status(200).json({ success: true, message: 'Workflow execution stopped successfully' });
        });
        // Get workflow execution status
        this.getWorkflowExecutionStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id, executionId } = req.params;
            const status = await workflowService.getWorkflowExecutionStatus(id, executionId, userId);
            res.status(200).json({ success: true, data: { status } });
        });
        // Get workflow execution logs
        this.getWorkflowExecutionLogs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id, executionId } = req.params;
            const logs = await workflowService.getWorkflowExecutionLogs(id, executionId, userId);
            res.status(200).json({ success: true, data: { logs } });
        });
        // Clone workflow
        this.cloneWorkflow = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const { name } = req.body;
            const clonedWorkflow = await workflowService.cloneWorkflow(id, userId, name);
            res.status(201).json({ success: true, data: { workflow: clonedWorkflow } });
        });
        // Export workflow
        this.exportWorkflow = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { id } = req.params;
            const exportData = await workflowService.exportWorkflow(id, userId);
            res.status(200).json({ success: true, data: exportData });
        });
        // Import workflow
        this.importWorkflow = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const workflow = await workflowService.importWorkflow(userId, req.body);
            res.status(201).json({ success: true, data: { workflow } });
        });
    }
}
exports.WorkflowController = WorkflowController;
