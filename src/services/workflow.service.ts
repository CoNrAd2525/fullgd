import { PrismaClient, Workflow, WorkflowExecution } from '@prisma/client';
import { ApiError } from '../middleware/errorHandler';
import { Server } from 'socket.io';
import { emitWorkflowUpdate, emitWorkflowComplete, emitWorkflowError } from '../socket';
import { AgentService } from './agent.service';
import { WebhookService } from './webhook.service';

const prisma = new PrismaClient();

// Workflow service
export class WorkflowService {
  private io: Server;
  private agentService: AgentService;
  private webhookService: WebhookService;

  constructor(io: Server) {
    this.io = io;
    this.agentService = new AgentService(io);
    this.webhookService = new WebhookService(io);
  }

  // Create a new workflow
  async createWorkflow(userId: string, workflowData: any): Promise<Workflow> {
    try {
      const workflow = await prisma.workflow.create({
        data: {
          name: workflowData.name,
          description: workflowData.description,
          config: workflowData.config,
          isPublic: workflowData.isPublic || false,
          userId
        }
      });

      return workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw new ApiError(500, 'Failed to create workflow');
    }
  }

  // Get all workflows for a user
  async getWorkflows(userId: string): Promise<Workflow[]> {
    try {
      const workflows = await prisma.workflow.findMany({
        where: {
          OR: [
            { userId },
            { isPublic: true }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return workflows;
    } catch (error) {
      console.error('Error getting workflows:', error);
      throw new ApiError(500, 'Failed to get workflows');
    }
  }

  // Get workflow by ID
  async getWorkflowById(id: string, userId: string): Promise<Workflow> {
    try {
      const workflow = await prisma.workflow.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { isPublic: true }
          ]
        },
        include: {
          agents: {
            include: {
              agent: true
            },
            orderBy: {
              position: 'asc'
            }
          }
        }
      });

      if (!workflow) {
        throw new ApiError(404, 'Workflow not found');
      }

      return workflow;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting workflow:', error);
      throw new ApiError(500, 'Failed to get workflow');
    }
  }

  // Update workflow
  async updateWorkflow(id: string, userId: string, workflowData: any): Promise<Workflow> {
    try {
      // Check if workflow exists and belongs to user
      const existingWorkflow = await prisma.workflow.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingWorkflow) {
        throw new ApiError(404, 'Workflow not found or you do not have permission to update it');
      }

      const updatedWorkflow = await prisma.workflow.update({
        where: { id },
        data: {
          name: workflowData.name,
          description: workflowData.description,
          config: workflowData.config,
          isPublic: workflowData.isPublic
        }
      });

      return updatedWorkflow;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error updating workflow:', error);
      throw new ApiError(500, 'Failed to update workflow');
    }
  }

  // Delete workflow
  async deleteWorkflow(id: string, userId: string): Promise<void> {
    try {
      // Check if workflow exists and belongs to user
      const existingWorkflow = await prisma.workflow.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingWorkflow) {
        throw new ApiError(404, 'Workflow not found or you do not have permission to delete it');
      }

      await prisma.workflow.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error deleting workflow:', error);
      throw new ApiError(500, 'Failed to delete workflow');
    }
  }

  // Add agent to workflow
  async addAgentToWorkflow(workflowId: string, agentId: string, userId: string, position: number, config?: any): Promise<any> {
    try {
      // Check if workflow exists and belongs to user
      const workflow = await prisma.workflow.findFirst({
        where: {
          id: workflowId,
          userId
        }
      });

      if (!workflow) {
        throw new ApiError(404, 'Workflow not found or you do not have permission to update it');
      }

      // Check if agent exists and user has access
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          OR: [
            { userId },
            { isPublic: true }
          ]
        }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found or you do not have access to it');
      }

      // Check if agent is already in workflow
      const existingWorkflowAgent = await prisma.workflowAgent.findUnique({
        where: {
          workflowId_agentId: {
            workflowId,
            agentId
          }
        }
      });

      if (existingWorkflowAgent) {
        // Update existing workflow agent
        return await prisma.workflowAgent.update({
          where: {
            workflowId_agentId: {
              workflowId,
              agentId
            }
          },
          data: {
            position,
            config: config || {}
          }
        });
      } else {
        // Create new workflow agent
        return await prisma.workflowAgent.create({
          data: {
            workflowId,
            agentId,
            position,
            config: config || {}
          }
        });
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error adding agent to workflow:', error);
      throw new ApiError(500, 'Failed to add agent to workflow');
    }
  }

  // Remove agent from workflow
  async removeAgentFromWorkflow(workflowId: string, agentId: string, userId: string): Promise<void> {
    try {
      // Check if workflow exists and belongs to user
      const workflow = await prisma.workflow.findFirst({
        where: {
          id: workflowId,
          userId
        }
      });

      if (!workflow) {
        throw new ApiError(404, 'Workflow not found or you do not have permission to update it');
      }

      // Check if agent is in workflow
      const workflowAgent = await prisma.workflowAgent.findUnique({
        where: {
          workflowId_agentId: {
            workflowId,
            agentId
          }
        }
      });

      if (!workflowAgent) {
        throw new ApiError(404, 'Agent not found in workflow');
      }

      // Remove agent from workflow
      await prisma.workflowAgent.delete({
        where: {
          workflowId_agentId: {
            workflowId,
            agentId
          }
        }
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error removing agent from workflow:', error);
      throw new ApiError(500, 'Failed to remove agent from workflow');
    }
  }

  // Run workflow
  async runWorkflow(id: string, userId: string, input: any): Promise<WorkflowExecution> {
    try {
      // Check if workflow exists and user has access
      const workflow = await this.getWorkflowById(id, userId);

      // Create execution record
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId: id,
          status: 'pending',
          input,
          progress: 0
        }
      });

      // Run workflow asynchronously
      this.executeWorkflow(workflow, execution, input).catch(error => {
        console.error('Error during workflow execution:', error);
      });

      return execution;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error running workflow:', error);
      throw new ApiError(500, 'Failed to run workflow');
    }
  }

  // Execute workflow (internal method)
  private async executeWorkflow(workflow: any, execution: WorkflowExecution, input: any): Promise<void> {
    try {
      // Update execution status to running
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'running',
          startedAt: new Date()
        }
      });

      // Create a room ID for socket communication
      const roomId = `workflow:${workflow.id}:execution:${execution.id}`;

      // Get workflow agents in order
      const workflowAgents = workflow.agents || [];
      if (workflowAgents.length === 0) {
        throw new Error('Workflow has no agents');
      }

      // Initialize result object
      let result = { input };
      let currentProgress = 0;
      const progressStep = 100 / workflowAgents.length;

      // Execute agents in sequence
      for (let i = 0; i < workflowAgents.length; i++) {
        const workflowAgent = workflowAgents[i];
        const agent = workflowAgent.agent;
        const agentConfig = workflowAgent.config || {};

        // Update progress
        currentProgress = i * progressStep;
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: { progress: currentProgress }
        });

        // Emit progress update
        emitWorkflowUpdate(this.io, roomId, workflow.id, 'running', currentProgress);

        // Prepare agent input
        const agentInput = {
          ...input,
          previousResults: result,
          agentConfig
        };

        // Create agent execution
        const agentExecution = await prisma.agentExecution.create({
          data: {
            agentId: agent.id,
            status: 'pending',
            input: agentInput,
            workflowExecutionId: execution.id
          }
        });

        // Execute agent
        try {
          // Run agent and wait for completion
          const agentResult = await this.runAgentAndWaitForCompletion(agent.id, userId, agentInput, agentExecution.id);

          // Update result with agent output
          result = {
            ...result,
            [`agent_${i + 1}`]: agentResult
          };
        } catch (agentError) {
          console.error(`Error executing agent ${agent.id} in workflow:`, agentError);

          // Update workflow execution with error
          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
              status: 'failed',
              error: `Error in agent ${agent.name}: ${agentError.message || 'Unknown error'}`,
              completedAt: new Date()
            }
          });

          // Emit error event
          emitWorkflowError(this.io, roomId, workflow.id, `Error in agent ${agent.name}: ${agentError.message || 'Unknown error'}`);

          return;
        }
      }

      // Update execution with success result
      const completedAt = new Date();
      const startedAt = execution.startedAt || new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          output: result,
          completedAt,
          duration,
          progress: 100
        }
      });

      // Emit completion event
      emitWorkflowComplete(this.io, roomId, workflow.id, result);
      
      // Trigger webhook for workflow completion
      this.webhookService.triggerWorkflowWebhook(workflow.userId, workflow.id, 'workflow.completed', {
        workflowId: workflow.id,
        executionId: execution.id,
        status: 'completed',
        result
      });
    } catch (error) {
      console.error('Workflow execution error:', error);

      // Update execution with error
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date()
        }
      });

      // Emit error event
      const roomId = `workflow:${workflow.id}:execution:${execution.id}`;
      emitWorkflowError(this.io, roomId, workflow.id, error instanceof Error ? error.message : 'Unknown error');
      
      // Trigger webhook for workflow error
      this.webhookService.triggerWorkflowWebhook(workflow.userId, workflow.id, 'workflow.failed', {
        workflowId: workflow.id,
        executionId: execution.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Run agent and wait for completion
  private async runAgentAndWaitForCompletion(agentId: string, userId: string, input: any, executionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Poll for agent execution completion
      const checkExecution = async () => {
        try {
          const execution = await prisma.agentExecution.findUnique({
            where: { id: executionId }
          });

          if (!execution) {
            reject(new Error('Agent execution not found'));
            return;
          }

          if (execution.status === 'completed') {
            resolve(execution.output);
            return;
          } else if (execution.status === 'failed' || execution.status === 'stopped') {
            reject(new Error(execution.error || 'Agent execution failed'));
            return;
          }

          // Continue polling
          setTimeout(checkExecution, 1000);
        } catch (error) {
          reject(error);
        }
      };

      // Start polling
      checkExecution();
    });
  }

  // Get workflow execution status
  async getWorkflowExecutionStatus(executionId: string, userId: string): Promise<WorkflowExecution> {
    try {
      const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
        include: {
          workflow: true,
          agentExecutions: true
        }
      });

      if (!execution) {
        throw new ApiError(404, 'Execution not found');
      }

      // Check if user has access to the workflow
      if (execution.workflow.userId !== userId && !execution.workflow.isPublic) {
        throw new ApiError(403, 'You do not have permission to access this execution');
      }

      return execution;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting execution status:', error);
      throw new ApiError(500, 'Failed to get execution status');
    }
  }

  // Stop workflow execution
  async stopWorkflowExecution(executionId: string, userId: string): Promise<WorkflowExecution> {
    try {
      const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
        include: {
          workflow: true,
          agentExecutions: {
            where: {
              status: {
                in: ['pending', 'running']
              }
            }
          }
        }
      });

      if (!execution) {
        throw new ApiError(404, 'Execution not found');
      }

      // Check if user has access to the workflow
      if (execution.workflow.userId !== userId) {
        throw new ApiError(403, 'You do not have permission to stop this execution');
      }

      // Check if execution is already completed or failed
      if (execution.status === 'completed' || execution.status === 'failed' || execution.status === 'stopped') {
        throw new ApiError(400, `Execution is already ${execution.status}`);
      }

      // Stop running agent executions
      for (const agentExecution of execution.agentExecutions) {
        await prisma.agentExecution.update({
          where: { id: agentExecution.id },
          data: {
            status: 'stopped',
            completedAt: new Date(),
            error: 'Execution stopped by user'
          }
        });
      }

      // Update workflow execution status
      const updatedExecution = await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'stopped',
          completedAt: new Date(),
          error: 'Execution stopped by user'
        }
      });

      // Emit stop event
      const roomId = `workflow:${execution.workflow.id}:execution:${execution.id}`;
      emitWorkflowError(this.io, roomId, execution.workflow.id, 'Execution stopped by user');
      
      // Trigger webhook for workflow stopped
      this.webhookService.triggerWorkflowWebhook(execution.workflow.userId, execution.workflow.id, 'workflow.stopped', {
        workflowId: execution.workflow.id,
        executionId: execution.id,
        status: 'stopped'
      });

      return updatedExecution;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error stopping execution:', error);
      throw new ApiError(500, 'Failed to stop execution');
    }
  }

  // Clone workflow
  async cloneWorkflow(id: string, userId: string, newName: string): Promise<Workflow> {
    try {
      // Get the original workflow with agents
      const originalWorkflow = await prisma.workflow.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { isPublic: true }
          ]
        },
        include: {
          agents: true
        }
      });

      if (!originalWorkflow) {
        throw new ApiError(404, 'Workflow not found');
      }

      // Create a new workflow with the same configuration
      const clonedWorkflow = await prisma.workflow.create({
        data: {
          name: newName || `${originalWorkflow.name} (Clone)`,
          description: originalWorkflow.description,
          config: originalWorkflow.config,
          isPublic: false, // Default to private for cloned workflows
          userId
        }
      });

      // Clone workflow agents
      for (const agent of originalWorkflow.agents) {
        await prisma.workflowAgent.create({
          data: {
            workflowId: clonedWorkflow.id,
            agentId: agent.agentId,
            position: agent.position,
            config: agent.config
          }
        });
      }

      return clonedWorkflow;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error cloning workflow:', error);
      throw new ApiError(500, 'Failed to clone workflow');
    }
  }

  // Export workflow configuration
  async exportWorkflow(id: string, userId: string): Promise<any> {
    try {
      // Get the workflow with agents
      const workflow = await prisma.workflow.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { isPublic: true }
          ]
        },
        include: {
          agents: {
            include: {
              agent: true
            }
          }
        }
      });

      if (!workflow) {
        throw new ApiError(404, 'Workflow not found');
      }

      // Prepare export data
      const exportData = {
        name: workflow.name,
        description: workflow.description,
        config: workflow.config,
        agents: workflow.agents.map(wa => ({
          id: wa.agent.id,
          name: wa.agent.name,
          type: wa.agent.type,
          position: wa.position,
          config: wa.config
        })),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      return exportData;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error exporting workflow:', error);
      throw new ApiError(500, 'Failed to export workflow');
    }
  }

  // Import workflow configuration
  async importWorkflow(userId: string, importData: any): Promise<Workflow> {
    try {
      // Validate import data
      if (!importData.name || !importData.config) {
        throw new ApiError(400, 'Invalid import data');
      }

      // Create the workflow
      const workflow = await prisma.workflow.create({
        data: {
          name: importData.name,
          description: importData.description,
          config: importData.config,
          isPublic: false, // Default to private for imported workflows
          userId
        }
      });

      // Import agents if available
      if (importData.agents && Array.isArray(importData.agents)) {
        for (const agentData of importData.agents) {
          // Check if agent exists and user has access
          const agent = await prisma.agent.findFirst({
            where: {
              id: agentData.id,
              OR: [
                { userId },
                { isPublic: true }
              ]
            }
          });

          if (agent) {
            // Add agent to workflow
            await prisma.workflowAgent.create({
              data: {
                workflowId: workflow.id,
                agentId: agent.id,
                position: agentData.position || 0,
                config: agentData.config || {}
              }
            });
          } else {
            console.warn(`Agent ${agentData.id} not found or not accessible, skipping`);
          }
        }
      }

      return workflow;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error importing workflow:', error);
      throw new ApiError(500, 'Failed to import workflow');
    }
  }
}