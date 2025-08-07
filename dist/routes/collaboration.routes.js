"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCollaborationRoutes = createCollaborationRoutes;
const express_1 = require("express");
const collaboration_controller_1 = require("../controllers/collaboration.controller");
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
function createCollaborationRoutes(prisma, io, agentService, webhookService) {
    const collaborationController = new collaboration_controller_1.CollaborationController(prisma, io, agentService, webhookService);
    // Apply authentication middleware to all routes
    router.use(auth_1.authenticateToken);
    /**
     * @swagger
     * /api/collaboration/sessions:
     *   post:
     *     summary: Create a new collaboration session
     *     tags: [Collaboration]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - agentIds
     *             properties:
     *               name:
     *                 type: string
     *                 description: Name of the collaboration session
     *               description:
     *                 type: string
     *                 description: Description of the collaboration session
     *               agentIds:
     *                 type: array
     *                 items:
     *                   type: string
     *                 description: Array of agent IDs to include in the session
     *               config:
     *                 type: object
     *                 description: Session configuration
     *     responses:
     *       201:
     *         description: Collaboration session created successfully
     *       400:
     *         description: Invalid request data
     *       401:
     *         description: Unauthorized
     */
    router.post('/sessions', collaborationController.createSession);
    /**
     * @swagger
     * /api/collaboration/sessions/{sessionId}:
     *   get:
     *     summary: Get collaboration session details
     *     tags: [Collaboration]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: sessionId
     *         required: true
     *         schema:
     *           type: string
     *         description: Collaboration session ID
     *     responses:
     *       200:
     *         description: Collaboration session details
     *       404:
     *         description: Session not found
     *       401:
     *         description: Unauthorized
     */
    router.get('/sessions/:sessionId', collaborationController.getSession);
    /**
     * @swagger
     * /api/collaboration/sessions/{sessionId}/messages:
     *   post:
     *     summary: Send message between agents
     *     tags: [Collaboration]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: sessionId
     *         required: true
     *         schema:
     *           type: string
     *         description: Collaboration session ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - fromAgentId
     *               - content
     *               - messageType
     *             properties:
     *               fromAgentId:
     *                 type: string
     *                 description: ID of the sending agent
     *               toAgentId:
     *                 type: string
     *                 description: ID of the receiving agent (optional for broadcast)
     *               content:
     *                 type: string
     *                 description: Message content
     *               messageType:
     *                 type: string
     *                 enum: [text, task, result, question, approval_request]
     *                 description: Type of message
     *               metadata:
     *                 type: object
     *                 description: Additional message metadata
     *     responses:
     *       201:
     *         description: Message sent successfully
     *       400:
     *         description: Invalid request data
     *       401:
     *         description: Unauthorized
     */
    router.post('/sessions/:sessionId/messages', collaborationController.sendMessage);
    /**
     * @swagger
     * /api/collaboration/sessions/{sessionId}/messages:
     *   get:
     *     summary: Get session messages
     *     tags: [Collaboration]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: sessionId
     *         required: true
     *         schema:
     *           type: string
     *         description: Collaboration session ID
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *         description: Number of messages per page
     *     responses:
     *       200:
     *         description: Session messages
     *       404:
     *         description: Session not found
     *       401:
     *         description: Unauthorized
     */
    router.get('/sessions/:sessionId/messages', collaborationController.getSessionMessages);
    /**
     * @swagger
     * /api/collaboration/sessions/{sessionId}/tasks:
     *   post:
     *     summary: Assign task to an agent
     *     tags: [Collaboration]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: sessionId
     *         required: true
     *         schema:
     *           type: string
     *         description: Collaboration session ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - fromAgentId
     *               - toAgentId
     *               - title
     *               - description
     *             properties:
     *               fromAgentId:
     *                 type: string
     *                 description: ID of the assigning agent
     *               toAgentId:
     *                 type: string
     *                 description: ID of the agent receiving the task
     *               title:
     *                 type: string
     *                 description: Task title
     *               description:
     *                 type: string
     *                 description: Task description
     *               priority:
     *                 type: string
     *                 enum: [low, medium, high, urgent]
     *                 default: medium
     *                 description: Task priority
     *               dueDate:
     *                 type: string
     *                 format: date-time
     *                 description: Task due date
     *               requirements:
     *                 type: object
     *                 description: Task requirements
     *     responses:
     *       201:
     *         description: Task assigned successfully
     *       400:
     *         description: Invalid request data
     *       401:
     *         description: Unauthorized
     */
    router.post('/sessions/:sessionId/tasks', collaborationController.assignTask);
    /**
     * @swagger
     * /api/collaboration/sessions/{sessionId}/tasks:
     *   get:
     *     summary: Get session tasks
     *     tags: [Collaboration]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: sessionId
     *         required: true
     *         schema:
     *           type: string
     *         description: Collaboration session ID
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [assigned, in_progress, completed, failed, cancelled]
     *         description: Filter tasks by status
     *     responses:
     *       200:
     *         description: Session tasks
     *       404:
     *         description: Session not found
     *       401:
     *         description: Unauthorized
     */
    router.get('/sessions/:sessionId/tasks', collaborationController.getSessionTasks);
    /**
     * @swagger
     * /api/collaboration/tasks/{taskId}/status:
     *   put:
     *     summary: Update task status
     *     tags: [Collaboration]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: taskId
     *         required: true
     *         schema:
     *           type: string
     *         description: Task ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - status
     *             properties:
     *               status:
     *                 type: string
     *                 enum: [assigned, in_progress, completed, failed, cancelled]
     *                 description: New task status
     *               result:
     *                 type: object
     *                 description: Task result (for completed tasks)
     *     responses:
     *       200:
     *         description: Task status updated successfully
     *       400:
     *         description: Invalid request data
     *       401:
     *         description: Unauthorized
     */
    router.put('/tasks/:taskId/status', collaborationController.updateTaskStatus);
    /**
     * @swagger
     * /api/collaboration/sessions/{sessionId}/approvals:
     *   post:
     *     summary: Request human approval
     *     tags: [Collaboration]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: sessionId
     *         required: true
     *         schema:
     *           type: string
     *         description: Collaboration session ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - agentId
     *               - title
     *               - description
     *             properties:
     *               agentId:
     *                 type: string
     *                 description: ID of the requesting agent
     *               title:
     *                 type: string
     *                 description: Approval request title
     *               description:
     *                 type: string
     *                 description: Approval request description
     *               data:
     *                 type: object
     *                 description: Additional data for approval
     *     responses:
     *       201:
     *         description: Approval requested successfully
     *       400:
     *         description: Invalid request data
     *       401:
     *         description: Unauthorized
     */
    router.post('/sessions/:sessionId/approvals', collaborationController.requestApproval);
    /**
     * @swagger
     * /api/collaboration/approvals/{approvalId}/respond:
     *   post:
     *     summary: Handle approval response
     *     tags: [Collaboration]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: approvalId
     *         required: true
     *         schema:
     *           type: string
     *         description: Approval ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - approved
     *             properties:
     *               approved:
     *                 type: boolean
     *                 description: Whether the request is approved
     *               feedback:
     *                 type: string
     *                 description: Optional feedback
     *     responses:
     *       200:
     *         description: Approval response handled successfully
     *       400:
     *         description: Invalid request data
     *       401:
     *         description: Unauthorized
     */
    router.post('/approvals/:approvalId/respond', collaborationController.handleApprovalResponse);
    return router;
}
exports.default = router;
