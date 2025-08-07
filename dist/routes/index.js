"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = void 0;
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const agent_routes_1 = __importDefault(require("./agent.routes"));
const workflow_routes_1 = __importDefault(require("./workflow.routes"));
const tool_routes_1 = __importDefault(require("./tool.routes"));
const memory_routes_1 = __importDefault(require("./memory.routes"));
const knowledge_routes_1 = __importDefault(require("./knowledge.routes"));
const analytics_routes_1 = __importDefault(require("./analytics.routes"));
const webhook_routes_1 = __importDefault(require("./webhook.routes"));
const collaboration_routes_1 = require("./collaboration.routes");
const pipedream_routes_1 = require("./pipedream.routes");
const multi_agent_orchestrator_routes_1 = require("./multi-agent-orchestrator.routes");
// Setup all routes
const setupRoutes = (app, io, prisma, agentService, webhookService) => {
    // API version prefix
    const apiPrefix = '/api/v1';
    // Register routes
    app.use(`${apiPrefix}/auth`, auth_routes_1.default);
    app.use(`${apiPrefix}/users`, user_routes_1.default);
    app.use(`${apiPrefix}/agents`, agent_routes_1.default);
    app.use(`${apiPrefix}/workflows`, workflow_routes_1.default);
    app.use(`${apiPrefix}/tools`, tool_routes_1.default);
    app.use(`${apiPrefix}/memory`, memory_routes_1.default);
    app.use(`${apiPrefix}/knowledge`, knowledge_routes_1.default);
    app.use(`${apiPrefix}/analytics`, analytics_routes_1.default);
    app.use(`${apiPrefix}/webhooks`, (0, webhook_routes_1.default)(io));
    app.use(`${apiPrefix}/collaboration`, (0, collaboration_routes_1.createCollaborationRoutes)(prisma, io, agentService, webhookService));
    app.use(`${apiPrefix}/integrations/pipedream`, (0, pipedream_routes_1.createPipedreamRoutes)(prisma));
    app.use(`${apiPrefix}/orchestrator`, (0, multi_agent_orchestrator_routes_1.createMultiAgentOrchestratorRoutes)(io));
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'success',
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    });
    // API documentation endpoint
    app.get('/api-docs', (req, res) => {
        res.redirect('/api/docs');
    });
    // Handle 404 routes
    app.use('*', (req, res) => {
        res.status(404).json({
            status: 'error',
            message: `Route not found: ${req.originalUrl}`
        });
    });
};
exports.setupRoutes = setupRoutes;
