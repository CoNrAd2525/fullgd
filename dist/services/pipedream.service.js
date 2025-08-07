"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipedreamService = void 0;
const axios_1 = __importDefault(require("axios"));
class PipedreamService {
    constructor(prisma) {
        this.prisma = prisma;
        this.config = {
            clientId: process.env.PIPEDREAM_CLIENT_ID || '',
            clientSecret: process.env.PIPEDREAM_CLIENT_SECRET || '',
            baseUrl: process.env.PIPEDREAM_BASE_URL || '',
            redirectUri: process.env.PIPEDREAM_REDIRECT_URI || `${process.env.API_URL}/api/v1/integrations/pipedream/callback`
        };
        this.apiClient = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'AgentFlow-MultiAgent-Platform/1.0'
            }
        });
    }
    // Generate OAuth authorization URL
    generateAuthUrl(userId, scopes = ['agents:read', 'workflows:read', 'collaboration:read']) {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            response_type: 'code',
            scope: scopes.join(' '),
            state: userId // Use userId as state for security
        });
        return `${this.config.baseUrl}/oauth/authorize?${params.toString()}`;
    }
    // Exchange authorization code for access token
    async exchangeCodeForToken(code, userId) {
        try {
            const response = await this.apiClient.post('/oauth/token', {
                grant_type: 'authorization_code',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                code,
                redirect_uri: this.config.redirectUri
            });
            const tokenData = response.data;
            // Store tokens securely (you might want to encrypt these)
            await this.storeUserTokens(userId, tokenData);
            return tokenData;
        }
        catch (error) {
            console.error('Error exchanging code for token:', error);
            throw new Error('Failed to exchange authorization code for access token');
        }
    }
    // Refresh access token
    async refreshAccessToken(userId) {
        try {
            const userTokens = await this.getUserTokens(userId);
            if (!userTokens?.refresh_token) {
                throw new Error('No refresh token available');
            }
            const response = await this.apiClient.post('/oauth/token', {
                grant_type: 'refresh_token',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                refresh_token: userTokens.refresh_token
            });
            const tokenData = response.data;
            await this.storeUserTokens(userId, tokenData);
            return tokenData;
        }
        catch (error) {
            console.error('Error refreshing access token:', error);
            throw new Error('Failed to refresh access token');
        }
    }
    // Trigger Pipedream workflow
    async triggerWorkflow(workflowId, data, userId) {
        try {
            const accessToken = await this.getValidAccessToken(userId);
            const response = await this.apiClient.post(`/workflows/${workflowId}/trigger`, data, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error triggering Pipedream workflow:', error);
            throw new Error('Failed to trigger Pipedream workflow');
        }
    }
    // Send collaboration event to Pipedream
    async sendCollaborationEvent(event, sessionId, data, userId) {
        try {
            const triggerData = {
                event: `collaboration.${event}`,
                data,
                timestamp: new Date().toISOString(),
                sessionId,
                userId
            };
            // You can configure specific workflow IDs for different events
            const workflowId = this.getWorkflowIdForEvent(event);
            if (workflowId) {
                await this.triggerWorkflow(workflowId, triggerData, userId);
            }
        }
        catch (error) {
            console.error('Error sending collaboration event to Pipedream:', error);
            // Don't throw here to avoid breaking the main flow
        }
    }
    // Send agent event to Pipedream
    async sendAgentEvent(event, agentId, data, userId) {
        try {
            const triggerData = {
                event: `agent.${event}`,
                data,
                timestamp: new Date().toISOString(),
                agentId,
                userId
            };
            const workflowId = this.getWorkflowIdForEvent(`agent.${event}`);
            if (workflowId) {
                await this.triggerWorkflow(workflowId, triggerData, userId);
            }
        }
        catch (error) {
            console.error('Error sending agent event to Pipedream:', error);
        }
    }
    // Get user's API data from Pipedream
    async getUserData(userId) {
        try {
            const accessToken = await this.getValidAccessToken(userId);
            const response = await this.apiClient.get('/user', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error getting user data from Pipedream:', error);
            throw new Error('Failed to get user data from Pipedream');
        }
    }
    // Check if user has valid Pipedream integration
    async hasValidIntegration(userId) {
        try {
            const tokens = await this.getUserTokens(userId);
            return !!(tokens?.access_token);
        }
        catch (error) {
            return false;
        }
    }
    // Revoke user's access tokens
    async revokeAccess(userId) {
        try {
            const tokens = await this.getUserTokens(userId);
            if (tokens?.access_token) {
                // Revoke token on Pipedream side
                await this.apiClient.post('/oauth/revoke', {
                    token: tokens.access_token,
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret
                });
            }
            // Remove tokens from database
            await this.removeUserTokens(userId);
        }
        catch (error) {
            console.error('Error revoking Pipedream access:', error);
            throw new Error('Failed to revoke Pipedream access');
        }
    }
    // Private helper methods
    async getValidAccessToken(userId) {
        const tokens = await this.getUserTokens(userId);
        if (!tokens) {
            throw new Error('No Pipedream integration found for user');
        }
        // Check if token is expired (assuming expires_in is in seconds)
        const expiresAt = new Date(tokens.created_at.getTime() + (tokens.expires_in * 1000));
        const now = new Date();
        if (now >= expiresAt) {
            // Token is expired, refresh it
            const newTokens = await this.refreshAccessToken(userId);
            return newTokens.access_token;
        }
        return tokens.access_token;
    }
    async storeUserTokens(userId, tokenData) {
        // Store in user settings or create a separate integration table
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                settings: {
                    ...await this.getUserSettings(userId),
                    pipedream: {
                        access_token: tokenData.access_token,
                        refresh_token: tokenData.refresh_token,
                        token_type: tokenData.token_type,
                        expires_in: tokenData.expires_in,
                        scope: tokenData.scope,
                        created_at: new Date()
                    }
                }
            }
        });
    }
    async getUserTokens(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { settings: true }
        });
        return user?.settings?.pipedream || null;
    }
    async removeUserTokens(userId) {
        const settings = await this.getUserSettings(userId);
        delete settings.pipedream;
        await this.prisma.user.update({
            where: { id: userId },
            data: { settings }
        });
    }
    async getUserSettings(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { settings: true }
        });
        return user?.settings || {};
    }
    getWorkflowIdForEvent(event) {
        // Map events to workflow IDs - these should be configurable
        const eventWorkflowMap = {
            'collaboration.session_created': process.env.PIPEDREAM_WORKFLOW_COLLABORATION_SESSION || '',
            'collaboration.message_sent': process.env.PIPEDREAM_WORKFLOW_COLLABORATION_MESSAGE || '',
            'collaboration.task_assigned': process.env.PIPEDREAM_WORKFLOW_COLLABORATION_TASK || '',
            'collaboration.approval_requested': process.env.PIPEDREAM_WORKFLOW_COLLABORATION_APPROVAL || '',
            'agent.execution_completed': process.env.PIPEDREAM_WORKFLOW_AGENT_EXECUTION || '',
            'agent.error': process.env.PIPEDREAM_WORKFLOW_AGENT_ERROR || '',
            'workflow.completed': process.env.PIPEDREAM_WORKFLOW_WORKFLOW_COMPLETED || ''
        };
        return eventWorkflowMap[event] || null;
    }
}
exports.PipedreamService = PipedreamService;
