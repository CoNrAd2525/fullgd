"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const routes_1 = require("./routes");
const socket_1 = require("./socket");
const swagger_1 = require("./docs/swagger");
const agent_service_1 = require("./services/agent.service");
const webhook_service_1 = require("./services/webhook.service");
// Load environment variables
dotenv_1.default.config();
// Initialize Prisma client
const prisma = new client_1.PrismaClient();
// Create Express app
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});
// Initialize services
const agentService = new agent_service_1.AgentService(prisma, io);
const webhookService = new webhook_service_1.WebhookService(prisma);
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files
app.use(express_1.default.static('public'));
// Simple route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Unified AI Agent Platform API is running' });
});
// Socket connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
// Setup socket handlers
(0, socket_1.setupSocketHandlers)(io);
// Setup Swagger documentation
(0, swagger_1.setupSwagger)(app);
// Setup routes
(0, routes_1.setupRoutes)(app, io, prisma, agentService, webhookService);
// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Metrics endpoint
app.get('/metrics', (req, res) => {
    res.json({
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform
    });
});
