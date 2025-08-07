"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationController = void 0;
const collaboration_service_1 = require("../services/collaboration.service");
class CollaborationController {
    constructor(prisma, io, agentService, webhookService) {
        // Create a new collaboration session
        this.createSession = async (req, res) => {
            try {
                const { name, description, agentIds, config } = req.body;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                if (!name || !agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
                    return res.status(400).json({
                        error: 'Name and at least one agent ID are required'
                    });
                }
                const session = await this.collaborationService.createCollaborationSession({
                    name,
                    description,
                    userId,
                    agentIds,
                    config
                });
                res.status(201).json({
                    success: true,
                    data: session
                });
            }
            catch (error) {
                console.error('Error creating collaboration session:', error);
                res.status(500).json({
                    error: 'Failed to create collaboration session',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        // Get collaboration session details
        this.getSession = async (req, res) => {
            try {
                const { sessionId } = req.params;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                const session = await this.collaborationService.getCollaborationSession(sessionId);
                if (!session) {
                    return res.status(404).json({ error: 'Collaboration session not found' });
                }
                // Check if user owns the session
                if (session.userId !== userId) {
                    return res.status(403).json({ error: 'Access denied' });
                }
                res.json({
                    success: true,
                    data: session
                });
            }
            catch (error) {
                console.error('Error getting collaboration session:', error);
                res.status(500).json({
                    error: 'Failed to get collaboration session',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        // Send message between agents
        this.sendMessage = async (req, res) => {
            try {
                const { sessionId } = req.params;
                const { fromAgentId, toAgentId, content, messageType, metadata } = req.body;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                if (!fromAgentId || !content || !messageType) {
                    return res.status(400).json({
                        error: 'From agent ID, content, and message type are required'
                    });
                }
                const message = await this.collaborationService.sendMessage({
                    sessionId,
                    fromAgentId,
                    toAgentId,
                    content,
                    messageType,
                    metadata
                });
                res.status(201).json({
                    success: true,
                    data: message
                });
            }
            catch (error) {
                console.error('Error sending message:', error);
                res.status(500).json({
                    error: 'Failed to send message',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        // Assign task to an agent
        this.assignTask = async (req, res) => {
            try {
                const { sessionId } = req.params;
                const { fromAgentId, toAgentId, title, description, priority, dueDate, requirements } = req.body;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                if (!fromAgentId || !toAgentId || !title || !description) {
                    return res.status(400).json({
                        error: 'From agent ID, to agent ID, title, and description are required'
                    });
                }
                const task = await this.collaborationService.assignTask({
                    sessionId,
                    fromAgentId,
                    toAgentId,
                    title,
                    description,
                    priority: priority || 'medium',
                    dueDate: dueDate ? new Date(dueDate) : undefined,
                    requirements
                });
                res.status(201).json({
                    success: true,
                    data: task
                });
            }
            catch (error) {
                console.error('Error assigning task:', error);
                res.status(500).json({
                    error: 'Failed to assign task',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        // Update task status
        this.updateTaskStatus = async (req, res) => {
            try {
                const { taskId } = req.params;
                const { status, result } = req.body;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                if (!status) {
                    return res.status(400).json({ error: 'Status is required' });
                }
                const validStatuses = ['assigned', 'in_progress', 'completed', 'failed', 'cancelled'];
                if (!validStatuses.includes(status)) {
                    return res.status(400).json({
                        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                    });
                }
                const task = await this.collaborationService.updateTaskStatus(taskId, status, result);
                res.json({
                    success: true,
                    data: task
                });
            }
            catch (error) {
                console.error('Error updating task status:', error);
                res.status(500).json({
                    error: 'Failed to update task status',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        // Request human approval
        this.requestApproval = async (req, res) => {
            try {
                const { sessionId } = req.params;
                const { agentId, title, description, data } = req.body;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                if (!agentId || !title || !description) {
                    return res.status(400).json({
                        error: 'Agent ID, title, and description are required'
                    });
                }
                const approval = await this.collaborationService.requestApproval(sessionId, agentId, title, description, data || {});
                res.status(201).json({
                    success: true,
                    data: approval
                });
            }
            catch (error) {
                console.error('Error requesting approval:', error);
                res.status(500).json({
                    error: 'Failed to request approval',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        // Handle approval response
        this.handleApprovalResponse = async (req, res) => {
            try {
                const { approvalId } = req.params;
                const { approved, feedback } = req.body;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                if (typeof approved !== 'boolean') {
                    return res.status(400).json({ error: 'Approved field must be a boolean' });
                }
                const approval = await this.collaborationService.handleApprovalResponse(approvalId, userId, approved, feedback);
                res.json({
                    success: true,
                    data: approval
                });
            }
            catch (error) {
                console.error('Error handling approval response:', error);
                res.status(500).json({
                    error: 'Failed to handle approval response',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        // Get session messages
        this.getSessionMessages = async (req, res) => {
            try {
                const { sessionId } = req.params;
                const { page = 1, limit = 50 } = req.query;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                const session = await this.collaborationService.getCollaborationSession(sessionId);
                if (!session || session.userId !== userId) {
                    return res.status(404).json({ error: 'Session not found or access denied' });
                }
                const pageNum = parseInt(page);
                const limitNum = parseInt(limit);
                const skip = (pageNum - 1) * limitNum;
                const messages = session.messages.slice(skip, skip + limitNum);
                res.json({
                    success: true,
                    data: {
                        messages,
                        pagination: {
                            page: pageNum,
                            limit: limitNum,
                            total: session.messages.length,
                            totalPages: Math.ceil(session.messages.length / limitNum)
                        }
                    }
                });
            }
            catch (error) {
                console.error('Error getting session messages:', error);
                res.status(500).json({
                    error: 'Failed to get session messages',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        // Get session tasks
        this.getSessionTasks = async (req, res) => {
            try {
                const { sessionId } = req.params;
                const { status } = req.query;
                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                const session = await this.collaborationService.getCollaborationSession(sessionId);
                if (!session || session.userId !== userId) {
                    return res.status(404).json({ error: 'Session not found or access denied' });
                }
                let tasks = session.tasks;
                if (status) {
                    tasks = tasks.filter(task => task.status === status);
                }
                res.json({
                    success: true,
                    data: tasks
                });
            }
            catch (error) {
                console.error('Error getting session tasks:', error);
                res.status(500).json({
                    error: 'Failed to get session tasks',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        };
        this.collaborationService = new collaboration_service_1.CollaborationService(prisma, io, agentService, webhookService);
    }
}
exports.CollaborationController = CollaborationController;
