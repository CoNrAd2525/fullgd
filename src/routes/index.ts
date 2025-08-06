import { Express } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import agentRoutes from './agent.routes';
import workflowRoutes from './workflow.routes';
import toolRoutes from './tool.routes';
import memoryRoutes from './memory.routes';
import knowledgeRoutes from './knowledge.routes';
import analyticsRoutes from './analytics.routes';
import setupWebhookRoutes from './webhook.routes';
import { createCollaborationRoutes } from './collaboration.routes';
import { createPipedreamRoutes } from './pipedream.routes';
import { createMultiAgentOrchestratorRoutes } from './multi-agent-orchestrator.routes';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AgentService } from '../services/agent.service';
import { WebhookService } from '../services/webhook.service';

// Setup all routes
export const setupRoutes = (app: Express, io: Server, prisma: PrismaClient, agentService: AgentService, webhookService: WebhookService): void => {
  // API version prefix
  const apiPrefix = '/api/v1';

  // Register routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/agents`, agentRoutes);
  app.use(`${apiPrefix}/workflows`, workflowRoutes);
  app.use(`${apiPrefix}/tools`, toolRoutes);
  app.use(`${apiPrefix}/memory`, memoryRoutes);
  app.use(`${apiPrefix}/knowledge`, knowledgeRoutes);
  app.use(`${apiPrefix}/analytics`, analyticsRoutes);
  app.use(`${apiPrefix}/webhooks`, setupWebhookRoutes(io));
  app.use(`${apiPrefix}/collaboration`, createCollaborationRoutes(prisma, io, agentService, webhookService));
  app.use(`${apiPrefix}/integrations/pipedream`, createPipedreamRoutes(prisma));
  app.use(`${apiPrefix}/orchestrator`, createMultiAgentOrchestratorRoutes(io));

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