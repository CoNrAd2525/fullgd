import { Router } from 'express';
import { MultiAgentOrchestratorController } from '../controllers/multi-agent-orchestrator.controller';
import { authenticateToken } from '../middleware/auth';
import { Server } from 'socket.io';

export const createMultiAgentOrchestratorRoutes = (io: Server): Router => {
  const router = Router();
  const controller = new MultiAgentOrchestratorController(io);

  // Apply authentication middleware to all routes
  router.use(authenticateToken);

  /**
   * @swagger
   * /api/orchestrator/health:
   *   get:
   *     summary: Health check for multi-agent orchestrator
   *     tags: [Multi-Agent Orchestrator]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Service health status
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     service:
   *                       type: string
   *                     status:
   *                       type: string
   *                     supportedFrameworks:
   *                       type: array
   *                       items:
   *                         type: string
   */
  router.get('/health', controller.healthCheck);

  /**
   * @swagger
   * /api/orchestrator/frameworks:
   *   get:
   *     summary: Get available framework templates
   *     tags: [Multi-Agent Orchestrator]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Available framework templates
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     templates:
   *                       type: object
   *                     supportedFrameworks:
   *                       type: array
   *                       items:
   *                         type: string
   */
  router.get('/frameworks', controller.getFrameworkTemplates);

  /**
   * @swagger
   * /api/orchestrator/frameworks/{framework}/template:
   *   get:
   *     summary: Get configuration template for specific framework
   *     tags: [Multi-Agent Orchestrator]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: framework
   *         required: true
   *         schema:
   *           type: string
   *           enum: [HyperAgent, Activepieces, CAI, SmolAgents, Agno]
   *         description: Framework name
   *     responses:
   *       200:
   *         description: Framework configuration template
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     template:
   *                       type: object
   *                     framework:
   *                       type: string
   */
  router.get('/frameworks/:framework/template', controller.getAgentConfigTemplate);

  /**
   * @swagger
   * /api/orchestrator/agents/specialized:
   *   post:
   *     summary: Create a specialized agent
   *     tags: [Multi-Agent Orchestrator]
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
   *               - framework
   *             properties:
   *               name:
   *                 type: string
   *                 description: Agent name
   *               framework:
   *                 type: string
   *                 enum: [HyperAgent, Activepieces, CAI, SmolAgents, Agno]
   *                 description: Agent framework
   *               environment:
   *                 type: string
   *                 enum: [Development, Production]
   *                 default: Production
   *               permissions:
   *                 type: string
   *                 enum: [admin, user, readonly]
   *                 default: user
   *               integrations:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     tool:
   *                       type: string
   *                     config:
   *                       type: object
   *               triggers:
   *                 type: array
   *                 items:
   *                   type: string
   *               timeout:
   *                 type: string
   *                 default: "5s"
   *               capabilities:
   *                 type: array
   *                 items:
   *                   type: string
   *               orchestrationRole:
   *                 type: string
   *                 enum: [coordinator, executor, monitor, validator]
   *                 default: executor
   *     responses:
   *       201:
   *         description: Specialized agent created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     agent:
   *                       $ref: '#/components/schemas/Agent'
   *                     message:
   *                       type: string
   */
  router.post('/agents/specialized', controller.createSpecializedAgent);

  /**
   * @swagger
   * /api/orchestrator/agents/template:
   *   post:
   *     summary: Create agents from JSON template
   *     tags: [Multi-Agent Orchestrator]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - agents
   *             properties:
   *               agents:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - name
   *                     - framework
   *                   properties:
   *                     name:
   *                       type: string
   *                     framework:
   *                       type: string
   *                       enum: [HyperAgent, Activepieces, CAI, SmolAgents, Agno]
   *                     env:
   *                       type: string
   *                       enum: [Development, Production]
   *                     permissions:
   *                       type: string
   *                       enum: [admin, user, readonly]
   *                     integrations:
   *                       type: array
   *                       items:
   *                         type: object
   *                     triggers:
   *                       type: array
   *                       items:
   *                         type: string
   *                     timeout:
   *                       type: string
   *                     capabilities:
   *                       type: array
   *                       items:
   *                         type: string
   *                     orchestrationRole:
   *                       type: string
   *           example:
   *             agents:
   *               - name: "HyperAgent_Orchestrator"
   *                 framework: "HyperAgent"
   *                 env: "Production"
   *                 permissions: "admin"
   *                 integrations:
   *                   - tool: "GitHub"
   *                     repo: "CoNrAd2525"
   *                   - tool: "GoogleDrive"
   *                     folder_id: "1Q5nSBetjdKi9wD5XBL-rn38fgh36YVlx"
   *                 triggers: ["code_commit", "workflow_failure"]
   *                 timeout: "5s"
   *     responses:
   *       201:
   *         description: Agents created from template
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     createdAgents:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Agent'
   *                     errors:
   *                       type: array
   *                       items:
   *                         type: object
   *                     summary:
   *                       type: object
   *                       properties:
   *                         total:
   *                           type: number
   *                         created:
   *                           type: number
   *                         failed:
   *                           type: number
   */
  router.post('/agents/template', controller.createAgentsFromTemplate);

  /**
   * @swagger
   * /api/orchestrator/orchestration:
   *   post:
   *     summary: Create complete AgentFlow orchestration system
   *     tags: [Multi-Agent Orchestrator]
   *     security:
   *       - bearerAuth: []
   *     description: |
   *       Creates the complete multi-agent orchestration system with all 5 specialized agents:
   *       - HyperAgent (Orchestrator)
   *       - Activepieces (Workflow Automation)
   *       - CAI (Cybersecurity)
   *       - SmolAgents (Data Processing)
   *       - Agno (Workflow Builder)
   *       
   *       All agents will be ready in ≤5s and configured for Production environment.
   *     responses:
   *       201:
   *         description: Complete orchestration system created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     sessionId:
   *                       type: string
   *                       description: Collaboration session ID
   *                     agents:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Agent'
   *                     orchestrationPlan:
   *                       type: object
   *                       description: Execution plan for the orchestration
   *                     message:
   *                       type: string
   *                     agentCount:
   *                       type: number
   *                     readyStatus:
   *                       type: string
   *                     environment:
   *                       type: string
   *                     domains:
   *                       type: array
   *                       items:
   *                         type: string
   */
  router.post('/orchestration', controller.createAgentFlowOrchestration);

  /**
   * @swagger
   * /api/orchestrator/orchestration/{sessionId}/status:
   *   get:
   *     summary: Get orchestration status
   *     tags: [Multi-Agent Orchestrator]
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
   *         description: Orchestration status
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     sessionId:
   *                       type: string
   *                     status:
   *                       type: string
   *                     agents:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           name:
   *                             type: string
   *                           framework:
   *                             type: string
   *                           status:
   *                             type: string
   *                           role:
   *                             type: string
   *                     activePhase:
   *                       type: string
   *                     completedTasks:
   *                       type: number
   *                     totalTasks:
   *                       type: number
   */
  router.get('/orchestration/:sessionId/status', controller.getOrchestrationStatus);

  return router;
};

export default createMultiAgentOrchestratorRoutes;