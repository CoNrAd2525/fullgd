import { PrismaClient, Agent, AgentExecution } from '@prisma/client';
import { ApiError } from '../middleware/errorHandler';
import { Server } from 'socket.io';
import { emitAgentStream, emitAgentComplete, emitAgentError } from '../socket';
import { OpenAI } from 'openai';
import { PineconeClient } from '@pinecone-database/pinecone';
import { WebhookService } from './webhook.service';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Pinecone client
let pinecone: PineconeClient | null = null;

const initPinecone = async () => {
  if (!pinecone) {
    pinecone = new PineconeClient();
    await pinecone.init({
      apiKey: process.env.PINECONE_API_KEY || '',
      environment: process.env.PINECONE_ENVIRONMENT || ''
    });
  }
  return pinecone;
};

// Agent service
export class AgentService {
  private io: Server;
  private webhookService: WebhookService;

  constructor(io: Server) {
    this.io = io;
    this.webhookService = new WebhookService(io);
  }

  // Create a new agent
  async createAgent(userId: string, agentData: any): Promise<Agent> {
    try {
      const agent = await prisma.agent.create({
        data: {
          name: agentData.name,
          description: agentData.description,
          type: agentData.type,
          config: agentData.config,
          isPublic: agentData.isPublic || false,
          userId
        }
      });

      return agent;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw new ApiError(500, 'Failed to create agent');
    }
  }

  // Get all agents for a user
  async getAgents(userId: string): Promise<Agent[]> {
    try {
      const agents = await prisma.agent.findMany({
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

      return agents;
    } catch (error) {
      console.error('Error getting agents:', error);
      throw new ApiError(500, 'Failed to get agents');
    }
  }

  // Get agent by ID
  async getAgentById(id: string, userId: string): Promise<Agent> {
    try {
      const agent = await prisma.agent.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { isPublic: true }
          ]
        }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found');
      }

      return agent;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting agent:', error);
      throw new ApiError(500, 'Failed to get agent');
    }
  }

  // Update agent
  async updateAgent(id: string, userId: string, agentData: any): Promise<Agent> {
    try {
      // Check if agent exists and belongs to user
      const existingAgent = await prisma.agent.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingAgent) {
        throw new ApiError(404, 'Agent not found or you do not have permission to update it');
      }

      const updatedAgent = await prisma.agent.update({
        where: { id },
        data: {
          name: agentData.name,
          description: agentData.description,
          type: agentData.type,
          config: agentData.config,
          isPublic: agentData.isPublic
        }
      });

      return updatedAgent;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error updating agent:', error);
      throw new ApiError(500, 'Failed to update agent');
    }
  }

  // Delete agent
  async deleteAgent(id: string, userId: string): Promise<void> {
    try {
      // Check if agent exists and belongs to user
      const existingAgent = await prisma.agent.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingAgent) {
        throw new ApiError(404, 'Agent not found or you do not have permission to delete it');
      }

      await prisma.agent.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error deleting agent:', error);
      throw new ApiError(500, 'Failed to delete agent');
    }
  }

  // Run agent
  async runAgent(id: string, userId: string, input: any): Promise<AgentExecution> {
    try {
      // Check if agent exists and user has access
      const agent = await this.getAgentById(id, userId);

      // Create execution record
      const execution = await prisma.agentExecution.create({
        data: {
          agentId: id,
          status: 'pending',
          input
        }
      });

      // Run agent asynchronously
      this.executeAgent(agent, execution, input).catch(error => {
        console.error('Error during agent execution:', error);
      });

      return execution;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error running agent:', error);
      throw new ApiError(500, 'Failed to run agent');
    }
  }

  // Execute agent (internal method)
  private async executeAgent(agent: Agent, execution: AgentExecution, input: any): Promise<void> {
    try {
      // Update execution status to running
      await prisma.agentExecution.update({
        where: { id: execution.id },
        data: {
          status: 'running',
          startedAt: new Date()
        }
      });

      // Create a room ID for socket communication
      const roomId = `agent:${agent.id}:execution:${execution.id}`;

      // Process based on agent type
      let result;
      switch (agent.type) {
        case 'llm':
          result = await this.executeLLMAgent(agent, execution, input, roomId);
          break;
        case 'function':
          result = await this.executeFunctionAgent(agent, execution, input, roomId);
          break;
        default:
          throw new Error(`Unsupported agent type: ${agent.type}`);
      }

      // Update execution with success result
      const completedAt = new Date();
      const startedAt = execution.startedAt || new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      await prisma.agentExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          output: result,
          completedAt,
          duration
        }
      });

      // Emit completion event
      emitAgentComplete(this.io, roomId, agent.id, result);
      
      // Trigger webhook for agent completion
      this.webhookService.triggerAgentWebhook(agent.userId, agent.id, 'agent.completed', {
        agentId: agent.id,
        executionId: execution.id,
        status: 'completed',
        result
      });
    } catch (error) {
      console.error('Agent execution error:', error);

      // Update execution with error
      await prisma.agentExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date()
        }
      });

      // Emit error event
      const roomId = `agent:${agent.id}:execution:${execution.id}`;
      emitAgentError(this.io, roomId, agent.id, error instanceof Error ? error.message : 'Unknown error');
      
      // Trigger webhook for agent error
      this.webhookService.triggerAgentWebhook(agent.userId, agent.id, 'agent.failed', {
        agentId: agent.id,
        executionId: execution.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Execute LLM agent
  private async executeLLMAgent(agent: Agent, execution: AgentExecution, input: any, roomId: string): Promise<any> {
    // Extract agent configuration
    const config = agent.config as any;
    const model = config.model || 'gpt-4';
    const systemPrompt = config.systemPrompt || 'You are a helpful assistant.';
    const temperature = config.temperature || 0.7;

    // Get agent tools
    const agentTools = await prisma.agentTool.findMany({
      where: { agentId: agent.id },
      include: { tool: true }
    });

    // Get agent knowledge bases
    const agentKnowledgeBases = await prisma.agentKnowledgeBase.findMany({
      where: { agentId: agent.id },
      include: { knowledgeBase: true }
    });

    // Prepare context from knowledge bases if available
    let context = '';
    if (agentKnowledgeBases.length > 0) {
      context = await this.getContextFromKnowledgeBases(agentKnowledgeBases, input.query);
    }

    // Prepare tools for function calling
    const tools = agentTools.map(agentTool => {
      const toolConfig = agentTool.tool.config as any;
      return {
        type: 'function',
        function: {
          name: agentTool.tool.name,
          description: agentTool.tool.description,
          parameters: toolConfig.parameters || {}
        }
      };
    });

    // Prepare messages
    const messages = [
      { role: 'system', content: systemPrompt + (context ? `\n\nContext information: ${context}` : '') },
      { role: 'user', content: input.query }
    ];

    // Stream the response
    const stream = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      stream: true,
      tools: tools.length > 0 ? tools : undefined
    });

    let fullResponse = '';
    let toolCalls = [];

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const toolCall = chunk.choices[0]?.delta?.tool_calls?.[0];

      if (content) {
        fullResponse += content;
        // Emit streaming content
        emitAgentStream(this.io, roomId, agent.id, { type: 'text', content });
      }

      if (toolCall) {
        if (toolCall.index === 0) {
          toolCalls.push({
            id: toolCall.id || '',
            type: 'function',
            function: {
              name: toolCall.function?.name || '',
              arguments: toolCall.function?.arguments || ''
            }
          });
        } else if (toolCall.function?.arguments) {
          const lastToolCall = toolCalls[toolCalls.length - 1];
          lastToolCall.function.arguments += toolCall.function.arguments;
        }
      }
    }

    // Handle tool calls if any
    if (toolCalls.length > 0) {
      const toolResults = await Promise.all(
        toolCalls.map(async toolCall => {
          try {
            // Find the tool
            const tool = agentTools.find(t => t.tool.name === toolCall.function.name);
            if (!tool) {
              throw new Error(`Tool not found: ${toolCall.function.name}`);
            }

            // Execute the tool (simplified implementation)
            const args = JSON.parse(toolCall.function.arguments);
            const result = await this.executeTool(tool, args);

            return {
              tool_call_id: toolCall.id,
              role: 'tool',
              name: toolCall.function.name,
              content: JSON.stringify(result)
            };
          } catch (error) {
            console.error(`Error executing tool ${toolCall.function.name}:`, error);
            return {
              tool_call_id: toolCall.id,
              role: 'tool',
              name: toolCall.function.name,
              content: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
            };
          }
        })
      );

      // Continue the conversation with tool results
      const newMessages = [
        ...messages,
        { role: 'assistant', content: null, tool_calls: toolCalls },
        ...toolResults
      ];

      const completion = await openai.chat.completions.create({
        model,
        messages: newMessages,
        temperature
      });

      const finalResponse = completion.choices[0]?.message?.content || '';
      fullResponse += '\n' + finalResponse;

      // Emit final response
      emitAgentStream(this.io, roomId, agent.id, { type: 'text', content: finalResponse });
    }

    return { response: fullResponse, toolCalls };
  }

  // Execute function agent
  private async executeFunctionAgent(agent: Agent, execution: AgentExecution, input: any, roomId: string): Promise<any> {
    // This is a simplified implementation
    // In a real system, this would execute custom code or serverless functions
    const config = agent.config as any;
    const functionCode = config.function;

    if (!functionCode) {
      throw new Error('Function code not provided in agent configuration');
    }

    // Emit start message
    emitAgentStream(this.io, roomId, agent.id, { type: 'text', content: 'Executing function agent...' });

    // Simulate function execution (in a real system, this would be more sophisticated)
    const result = { message: 'Function executed successfully', input };

    // Emit result
    emitAgentStream(this.io, roomId, agent.id, { type: 'text', content: JSON.stringify(result) });

    return result;
  }

  // Execute a tool
  private async executeTool(agentTool: any, args: any): Promise<any> {
    // This is a simplified implementation
    // In a real system, this would handle different tool types and integrations
    const tool = agentTool.tool;
    const toolType = tool.type;

    switch (toolType) {
      case 'api':
        // Execute API call
        return { message: 'API call simulated', args };
      case 'function':
        // Execute function
        return { message: 'Function executed', args };
      default:
        throw new Error(`Unsupported tool type: ${toolType}`);
    }
  }

  // Get context from knowledge bases
  private async getContextFromKnowledgeBases(agentKnowledgeBases: any[], query: string): Promise<string> {
    try {
      // Initialize Pinecone
      const pineconeClient = await initPinecone();
      if (!pineconeClient) {
        throw new Error('Failed to initialize Pinecone client');
      }

      // Get embedding for query
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Search each knowledge base
      let contextResults = [];

      for (const kb of agentKnowledgeBases) {
        const knowledgeBase = kb.knowledgeBase;
        const index = pineconeClient.Index(process.env.PINECONE_INDEX || '');

        // Query Pinecone
        const queryResponse = await index.query({
          queryRequest: {
            vector: queryEmbedding,
            topK: 5,
            includeMetadata: true,
            namespace: `kb-${knowledgeBase.id}`
          }
        });

        // Get document content for matches
        if (queryResponse.matches && queryResponse.matches.length > 0) {
          const documentIds = queryResponse.matches
            .map(match => match.metadata?.documentId)
            .filter(Boolean) as string[];

          if (documentIds.length > 0) {
            const documents = await prisma.document.findMany({
              where: {
                id: { in: documentIds },
                knowledgeBaseId: knowledgeBase.id
              }
            });

            // Add document content to context
            documents.forEach(doc => {
              contextResults.push(doc.content);
            });
          }
        }
      }

      // Combine and return context
      return contextResults.join('\n\n');
    } catch (error) {
      console.error('Error getting context from knowledge bases:', error);
      return '';
    }
  }

  // Get agent execution status
  async getAgentExecutionStatus(executionId: string, userId: string): Promise<AgentExecution> {
    try {
      const execution = await prisma.agentExecution.findUnique({
        where: { id: executionId },
        include: { agent: true }
      });

      if (!execution) {
        throw new ApiError(404, 'Execution not found');
      }

      // Check if user has access to the agent
      if (execution.agent.userId !== userId && !execution.agent.isPublic) {
        throw new ApiError(403, 'You do not have permission to access this execution');
      }

      return execution;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting execution status:', error);
      throw new ApiError(500, 'Failed to get execution status');
    }
  }

  // Stop agent execution
  async stopAgentExecution(executionId: string, userId: string): Promise<AgentExecution> {
    try {
      const execution = await prisma.agentExecution.findUnique({
        where: { id: executionId },
        include: { agent: true }
      });

      if (!execution) {
        throw new ApiError(404, 'Execution not found');
      }

      // Check if user has access to the agent
      if (execution.agent.userId !== userId) {
        throw new ApiError(403, 'You do not have permission to stop this execution');
      }

      // Check if execution is already completed or failed
      if (execution.status === 'completed' || execution.status === 'failed') {
        throw new ApiError(400, `Execution is already ${execution.status}`);
      }

      // Update execution status
      const updatedExecution = await prisma.agentExecution.update({
        where: { id: executionId },
        data: {
          status: 'stopped',
          completedAt: new Date(),
          error: 'Execution stopped by user'
        }
      });

      // Emit stop event
      const roomId = `agent:${execution.agent.id}:execution:${execution.id}`;
      emitAgentError(this.io, roomId, execution.agent.id, 'Execution stopped by user');
      
      // Trigger webhook for agent stopped
      this.webhookService.triggerAgentWebhook(execution.agent.userId, execution.agent.id, 'agent.stopped', {
        agentId: execution.agent.id,
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

  // Clone agent
  async cloneAgent(id: string, userId: string, newName: string): Promise<Agent> {
    try {
      // Get the original agent
      const originalAgent = await this.getAgentById(id, userId);

      // Create a new agent with the same configuration
      const clonedAgent = await prisma.agent.create({
        data: {
          name: newName || `${originalAgent.name} (Clone)`,
          description: originalAgent.description,
          type: originalAgent.type,
          config: originalAgent.config,
          isPublic: false, // Default to private for cloned agents
          userId
        }
      });

      // Clone agent tools
      const agentTools = await prisma.agentTool.findMany({
        where: { agentId: id }
      });

      for (const tool of agentTools) {
        await prisma.agentTool.create({
          data: {
            agentId: clonedAgent.id,
            toolId: tool.toolId,
            config: tool.config
          }
        });
      }

      // Clone agent knowledge bases
      const agentKnowledgeBases = await prisma.agentKnowledgeBase.findMany({
        where: { agentId: id }
      });

      for (const kb of agentKnowledgeBases) {
        await prisma.agentKnowledgeBase.create({
          data: {
            agentId: clonedAgent.id,
            knowledgeBaseId: kb.knowledgeBaseId
          }
        });
      }

      return clonedAgent;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error cloning agent:', error);
      throw new ApiError(500, 'Failed to clone agent');
    }
  }

  // Export agent configuration
  async exportAgent(id: string, userId: string): Promise<any> {
    try {
      // Get the agent
      const agent = await this.getAgentById(id, userId);

      // Get agent tools
      const agentTools = await prisma.agentTool.findMany({
        where: { agentId: id },
        include: { tool: true }
      });

      // Get agent knowledge bases
      const agentKnowledgeBases = await prisma.agentKnowledgeBase.findMany({
        where: { agentId: id },
        include: { knowledgeBase: true }
      });

      // Prepare export data
      const exportData = {
        name: agent.name,
        description: agent.description,
        type: agent.type,
        config: agent.config,
        tools: agentTools.map(tool => ({
          name: tool.tool.name,
          type: tool.tool.type,
          config: tool.config
        })),
        knowledgeBases: agentKnowledgeBases.map(kb => ({
          name: kb.knowledgeBase.name,
          type: kb.knowledgeBase.type
        })),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      return exportData;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error exporting agent:', error);
      throw new ApiError(500, 'Failed to export agent');
    }
  }

  // Import agent configuration
  async importAgent(userId: string, importData: any): Promise<Agent> {
    try {
      // Validate import data
      if (!importData.name || !importData.type || !importData.config) {
        throw new ApiError(400, 'Invalid import data');
      }

      // Create the agent
      const agent = await prisma.agent.create({
        data: {
          name: importData.name,
          description: importData.description,
          type: importData.type,
          config: importData.config,
          isPublic: false, // Default to private for imported agents
          userId
        }
      });

      // Import tools if available
      if (importData.tools && Array.isArray(importData.tools)) {
        for (const toolData of importData.tools) {
          // Find or create the tool
          let tool = await prisma.tool.findFirst({
            where: {
              name: toolData.name,
              type: toolData.type,
              userId
            }
          });

          if (!tool) {
            tool = await prisma.tool.create({
              data: {
                name: toolData.name,
                type: toolData.type,
                description: toolData.description || '',
                config: toolData.config || {},
                userId
              }
            });
          }

          // Connect tool to agent
          await prisma.agentTool.create({
            data: {
              agentId: agent.id,
              toolId: tool.id,
              config: toolData.config
            }
          });
        }
      }

      // Import knowledge bases if available
      if (importData.knowledgeBases && Array.isArray(importData.knowledgeBases)) {
        for (const kbData of importData.knowledgeBases) {
          // Find or create the knowledge base
          let knowledgeBase = await prisma.knowledgeBase.findFirst({
            where: {
              name: kbData.name,
              type: kbData.type,
              userId
            }
          });

          if (!knowledgeBase) {
            knowledgeBase = await prisma.knowledgeBase.create({
              data: {
                name: kbData.name,
                type: kbData.type,
                description: kbData.description || '',
                config: kbData.config || {},
                userId
              }
            });
          }

          // Connect knowledge base to agent
          await prisma.agentKnowledgeBase.create({
            data: {
              agentId: agent.id,
              knowledgeBaseId: knowledgeBase.id
            }
          });
        }
      }

      return agent;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error importing agent:', error);
      throw new ApiError(500, 'Failed to import agent');
    }
  }
}