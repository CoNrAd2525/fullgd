import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PipedreamService } from '../services/pipedream.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class PipedreamController {
  private prisma: PrismaClient;
  private pipedreamService: PipedreamService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.pipedreamService = new PipedreamService(prisma);
  }

  // Initiate OAuth flow
  initiateOAuth = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { scopes } = req.body;

      const authUrl = this.pipedreamService.generateAuthUrl(userId, scopes);

      res.json({
        success: true,
        data: {
          authUrl,
          message: 'Redirect user to this URL to complete OAuth authorization'
        }
      });
    } catch (error) {
      console.error('Error initiating Pipedream OAuth:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate OAuth flow'
      });
    }
  };

  // Handle OAuth callback
  handleOAuthCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.status(400).json({
          success: false,
          error: `OAuth error: ${error}`
        });
      }

      if (!code || !state) {
        return res.status(400).json({
          success: false,
          error: 'Missing authorization code or state parameter'
        });
      }

      const userId = state as string;
      const authCode = code as string;

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Exchange code for tokens
      const tokenData = await this.pipedreamService.exchangeCodeForToken(authCode, userId);

      // Redirect to success page or return success response
      res.json({
        success: true,
        data: {
          message: 'Pipedream integration successfully connected',
          tokenType: tokenData.token_type,
          scope: tokenData.scope,
          expiresIn: tokenData.expires_in
        }
      });
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete OAuth authorization'
      });
    }
  };

  // Get integration status
  getIntegrationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const hasIntegration = await this.pipedreamService.hasValidIntegration(userId);

      if (hasIntegration) {
        try {
          const userData = await this.pipedreamService.getUserData(userId);
          res.json({
            success: true,
            data: {
              connected: true,
              userData,
              message: 'Pipedream integration is active'
            }
          });
        } catch (error) {
          // Token might be expired or invalid
          res.json({
            success: true,
            data: {
              connected: false,
              message: 'Pipedream integration exists but may need re-authorization'
            }
          });
        }
      } else {
        res.json({
          success: true,
          data: {
            connected: false,
            message: 'No Pipedream integration found'
          }
        });
      }
    } catch (error) {
      console.error('Error checking integration status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check integration status'
      });
    }
  };

  // Trigger a workflow
  triggerWorkflow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { workflowId } = req.params;
      const { event, data, sessionId, agentId } = req.body;

      if (!workflowId) {
        return res.status(400).json({
          success: false,
          error: 'Workflow ID is required'
        });
      }

      const triggerData = {
        event: event || 'manual_trigger',
        data: data || {},
        timestamp: new Date().toISOString(),
        sessionId,
        agentId,
        userId
      };

      const result = await this.pipedreamService.triggerWorkflow(workflowId, triggerData, userId);

      res.json({
        success: true,
        data: {
          result,
          message: 'Workflow triggered successfully'
        }
      });
    } catch (error) {
      console.error('Error triggering workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger workflow'
      });
    }
  };

  // Send collaboration event
  sendCollaborationEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { event, sessionId, data } = req.body;

      if (!event || !sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Event and sessionId are required'
        });
      }

      await this.pipedreamService.sendCollaborationEvent(event, sessionId, data, userId);

      res.json({
        success: true,
        data: {
          message: 'Collaboration event sent to Pipedream'
        }
      });
    } catch (error) {
      console.error('Error sending collaboration event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send collaboration event'
      });
    }
  };

  // Send agent event
  sendAgentEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { event, agentId, data } = req.body;

      if (!event || !agentId) {
        return res.status(400).json({
          success: false,
          error: 'Event and agentId are required'
        });
      }

      await this.pipedreamService.sendAgentEvent(event, agentId, data, userId);

      res.json({
        success: true,
        data: {
          message: 'Agent event sent to Pipedream'
        }
      });
    } catch (error) {
      console.error('Error sending agent event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send agent event'
      });
    }
  };

  // Refresh access token
  refreshToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const tokenData = await this.pipedreamService.refreshAccessToken(userId);

      res.json({
        success: true,
        data: {
          message: 'Access token refreshed successfully',
          tokenType: tokenData.token_type,
          expiresIn: tokenData.expires_in
        }
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh access token'
      });
    }
  };

  // Disconnect integration
  disconnectIntegration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      await this.pipedreamService.revokeAccess(userId);

      res.json({
        success: true,
        data: {
          message: 'Pipedream integration disconnected successfully'
        }
      });
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect integration'
      });
    }
  };

  // Test integration
  testIntegration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      // Try to get user data to test the integration
      const userData = await this.pipedreamService.getUserData(userId);

      res.json({
        success: true,
        data: {
          message: 'Pipedream integration is working correctly',
          userData
        }
      });
    } catch (error) {
      console.error('Error testing integration:', error);
      res.status(500).json({
        success: false,
        error: 'Integration test failed. Please check your connection.'
      });
    }
  };
}