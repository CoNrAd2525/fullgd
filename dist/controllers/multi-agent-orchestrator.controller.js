"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiAgentOrchestratorController = void 0;
const multi_agent_orchestrator_service_1 = require("../services/multi-agent-orchestrator.service");
const agent_service_1 = require("../services/agent.service");
const collaboration_service_1 = require("../services/collaboration.service");
const webhook_service_1 = require("../services/webhook.service");
const pipedream_service_1 = require("../services/pipedream.service");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const prisma = new client_1.PrismaClient();
class MultiAgentOrchestratorController {
    constructor(io) {
        // Create a specialized agent
        this.createSpecializedAgent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { name, framework, environment, permissions, integrations, triggers, timeout, capabilities, orchestrationRole } = req.body;
            // Validate required fields
            if (!name || !framework) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and framework are required'
                });
            }
            // Validate framework
            const supportedFrameworks = ['HyperAgent', 'Activepieces', 'CAI', 'SmolAgents', 'Agno'];
            if (!supportedFrameworks.includes(framework)) {
                return res.status(400).json({
                    success: false,
                    message: `Unsupported framework. Supported frameworks: ${supportedFrameworks.join(', ')}`
                });
            }
            const agentConfig = {
                name,
                framework,
                environment: environment || 'Production',
                permissions: permissions || 'user',
                integrations: integrations || [],
                triggers: triggers || [],
                timeout: timeout || '5s',
                capabilities: capabilities || [],
                orchestrationRole: orchestrationRole || 'executor'
            };
            const agent = await this.orchestratorService.createSpecializedAgent(userId, agentConfig);
            res.status(201).json({
                success: true,
                data: {
                    agent,
                    message: `${framework} agent created successfully and ready in ≤5s`
                }
            });
        });
        // Create the complete AgentFlow orchestration system
        this.createAgentFlowOrchestration = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const result = await this.orchestratorService.createAgentFlowOrchestration(userId);
            res.status(201).json({
                success: true,
                data: {
                    ...result,
                    message: 'Multi-agent orchestration system created successfully',
                    agentCount: result.agents.length,
                    readyStatus: 'All agents ready in ≤5s',
                    environment: 'Production',
                    domains: ['dplyfull.vercel.app', 'dplyfull-git-main-jonas-projects-ca14fe2e.vercel.app']
                }
            });
        });
        // Get orchestration status
        this.getOrchestrationStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { sessionId } = req.params;
            if (!sessionId) {
                return res.status(400).json({ success: false, message: 'Session ID is required' });
            }
            const status = await this.orchestratorService.getOrchestrationStatus(sessionId);
            res.status(200).json({
                success: true,
                data: status
            });
        });
        // Create agents using JSON template (as specified in the prompt)
        this.createAgentsFromTemplate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const { agents } = req.body;
            if (!agents || !Array.isArray(agents)) {
                return res.status(400).json({
                    success: false,
                    message: 'Agents array is required'
                });
            }
            const createdAgents = [];
            const errors = [];
            for (const agentTemplate of agents) {
                try {
                    // Map template format to our service format
                    const agentConfig = {
                        name: agentTemplate.name,
                        framework: agentTemplate.framework,
                        environment: agentTemplate.env || 'Production',
                        permissions: agentTemplate.permissions || 'user',
                        integrations: agentTemplate.integrations || [],
                        triggers: agentTemplate.triggers || [],
                        timeout: agentTemplate.timeout || '5s',
                        capabilities: agentTemplate.capabilities || [],
                        orchestrationRole: agentTemplate.orchestrationRole || 'executor'
                    };
                    const agent = await this.orchestratorService.createSpecializedAgent(userId, agentConfig);
                    createdAgents.push(agent);
                }
                catch (error) {
                    errors.push({
                        agentName: agentTemplate.name,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            res.status(201).json({
                success: true,
                data: {
                    createdAgents,
                    errors,
                    summary: {
                        total: agents.length,
                        created: createdAgents.length,
                        failed: errors.length
                    }
                }
            });
        });
        // Get available framework templates
        this.getFrameworkTemplates = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const templates = {
                HyperAgent: {
                    name: 'HyperAgent',
                    description: 'Full software lifecycle orchestration (plan, code, verify engineering tasks)',
                    role: 'Central orchestrator for collaborative agent workflows',
                    permissions: 'admin',
                    capabilities: ['orchestration', 'code_generation', 'task_coordination', 'verification'],
                    integrations: ['GitHub', 'GoogleDrive'],
                    workflowPatterns: ['plan_code_verify', 'collaborative_development', 'task_delegation']
                },
                Activepieces: {
                    name: 'Activepieces',
                    description: 'Scalable workflow automation (280+ MCP servers for distributed AI tasks)',
                    role: 'Workflow automation and deployment management',
                    permissions: 'admin',
                    capabilities: ['workflow_automation', 'deployment', 'monitoring', 'integration'],
                    integrations: ['Vercel', 'GitHub', 'GoogleDrive'],
                    workflowPatterns: ['trigger_action', 'data_pipeline', 'deployment_automation']
                },
                CAI: {
                    name: 'Cybersecurity AI (CAI)',
                    description: 'AI-driven penetration testing/vulnerability discovery',
                    role: 'Security monitoring and threat detection',
                    permissions: 'admin',
                    capabilities: ['security_analysis', 'vulnerability_scanning', 'threat_detection', 'reporting'],
                    integrations: ['Nmap', 'GitHub', 'DomainMonitoring'],
                    workflowPatterns: ['scan_analyze_report', 'continuous_monitoring', 'threat_response']
                },
                SmolAgents: {
                    name: 'SmolAgents',
                    description: 'Lightweight Python-based agent logic (Hugging Face integration)',
                    role: 'Real-time data processing and NLP analysis',
                    permissions: 'user',
                    capabilities: ['data_processing', 'nlp', 'real_time_analysis', 'timeline_conversion'],
                    integrations: ['HuggingFace', 'LlamaIndex', 'DataStreams'],
                    workflowPatterns: ['data_ingestion', 'nlp_processing', 'timeline_generation']
                },
                Agno: {
                    name: 'Agno',
                    description: 'Workflow automation + agent builder (developer-friendly)',
                    role: 'Workflow design and synthetic data generation',
                    permissions: 'admin',
                    capabilities: ['workflow_design', 'agent_creation', 'issue_management', 'data_synthesis'],
                    integrations: ['GitHub', 'GoogleDrive', 'CamelAI'],
                    workflowPatterns: ['issue_triage', 'agent_generation', 'workflow_design']
                }
            };
            res.status(200).json({
                success: true,
                data: {
                    templates,
                    supportedFrameworks: Object.keys(templates),
                    totalFrameworks: Object.keys(templates).length
                }
            });
        });
        // Get agent configuration template for a specific framework
        this.getAgentConfigTemplate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { framework } = req.params;
            if (!framework) {
                return res.status(400).json({ success: false, message: 'Framework parameter is required' });
            }
            const supportedFrameworks = ['HyperAgent', 'Activepieces', 'CAI', 'SmolAgents', 'Agno'];
            if (!supportedFrameworks.includes(framework)) {
                return res.status(400).json({
                    success: false,
                    message: `Unsupported framework. Supported frameworks: ${supportedFrameworks.join(', ')}`
                });
            }
            // Generate template based on framework
            const templates = {
                HyperAgent: {
                    name: 'HyperAgent_Orchestrator',
                    framework: 'HyperAgent',
                    env: 'Production',
                    permissions: 'admin',
                    integrations: [
                        { tool: 'GitHub', repo: 'CoNrAd2525' },
                        { tool: 'GoogleDrive', folder_id: '1Q5nSBetjdKi9wD5XBL-rn38fgh36YVlx' }
                    ],
                    triggers: ['code_commit', 'workflow_failure'],
                    timeout: '5s',
                    capabilities: ['orchestration', 'task_delegation'],
                    orchestrationRole: 'coordinator'
                },
                Activepieces: {
                    name: 'Activepieces_Automator',
                    framework: 'Activepieces',
                    env: 'Production',
                    permissions: 'admin',
                    integrations: [
                        { tool: 'Vercel', domains: ['dplyfull.vercel.app'] },
                        { tool: 'GitHub', commitHash: '8afeb2f' },
                        { tool: 'GoogleDrive', folder_id: '1Q5nSBetjdKi9wD5XBL-rn38fgh36YVlx' }
                    ],
                    triggers: ['domain_events', 'commit_triggers'],
                    timeout: '5s',
                    capabilities: ['workflow_automation', 'deployment'],
                    orchestrationRole: 'executor'
                },
                CAI: {
                    name: 'CAI_SecurityAgent',
                    framework: 'CAI',
                    env: 'Production',
                    permissions: 'admin',
                    integrations: [
                        { tool: 'Nmap', profiles: ['comprehensive'] },
                        { tool: 'GitHub', repo: 'CoNrAd2525' },
                        { tool: 'Domains', targets: ['dplyfull*.vercel.app'] }
                    ],
                    triggers: ['security_scan', 'vulnerability_detected'],
                    timeout: '5s',
                    capabilities: ['security_analysis', 'vulnerability_scanning'],
                    orchestrationRole: 'monitor'
                },
                SmolAgents: {
                    name: 'SmolAgents_Processor',
                    framework: 'SmolAgents',
                    env: 'Production',
                    permissions: 'user',
                    integrations: [
                        { tool: 'HuggingFace', models: ['llamaIndex'] },
                        { tool: 'DataStreams', source: 'dplyfull_ui' }
                    ],
                    triggers: ['data_received', 'nlp_request'],
                    timeout: '5s',
                    capabilities: ['data_processing', 'timeline_conversion'],
                    orchestrationRole: 'executor'
                },
                Agno: {
                    name: 'Agno_WorkflowBuilder',
                    framework: 'Agno',
                    env: 'Production',
                    permissions: 'admin',
                    integrations: [
                        { tool: 'GitHub', issueTriaging: true },
                        { tool: 'GoogleDrive', templateStorage: true },
                        { tool: 'CamelAI', roleSimulation: true }
                    ],
                    triggers: ['issue_created', 'workflow_request'],
                    timeout: '5s',
                    capabilities: ['workflow_design', 'synthetic_data_generation'],
                    orchestrationRole: 'validator'
                }
            };
            res.status(200).json({
                success: true,
                data: {
                    template: templates[framework],
                    framework,
                    description: `Configuration template for ${framework} agent`
                }
            });
        });
        // Health check for orchestration system
        this.healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            res.status(200).json({
                success: true,
                data: {
                    service: 'Multi-Agent Orchestrator',
                    status: 'healthy',
                    version: '1.0.0',
                    supportedFrameworks: ['HyperAgent', 'Activepieces', 'CAI', 'SmolAgents', 'Agno'],
                    features: [
                        'Specialized agent creation',
                        'Multi-agent orchestration',
                        'Workflow automation',
                        'Security monitoring',
                        'Real-time data processing',
                        'GitHub integration',
                        'Google Drive sync',
                        'Production environment support'
                    ],
                    readyTimeout: '5s',
                    environment: 'Production'
                }
            });
        });
        const agentService = new agent_service_1.AgentService(io);
        const webhookService = new webhook_service_1.WebhookService(io);
        const pipedreamService = new pipedream_service_1.PipedreamService(prisma);
        const collaborationService = new collaboration_service_1.CollaborationService(prisma, io, agentService, webhookService);
        this.orchestratorService = new multi_agent_orchestrator_service_1.MultiAgentOrchestratorService(prisma, io, agentService, collaborationService, webhookService, pipedreamService);
    }
}
exports.MultiAgentOrchestratorController = MultiAgentOrchestratorController;
