import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { setupRoutes } from './routes';
import { setupSocketHandlers } from './socket';
import { setupSwagger } from './docs/swagger';
import { AgentService } from './services/agent.service';
import { WebhookService } from './services/webhook.service';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Initialize services
const agentService = new AgentService(prisma, io);
const webhookService = new WebhookService(prisma);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

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
setupSocketHandlers(io);

// Setup Swagger documentation
setupSwagger(app);

// Setup routes
setupRoutes(app, io, prisma, agentService, webhookService);

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