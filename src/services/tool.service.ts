import { PrismaClient, Tool, AgentTool } from '@prisma/client';
import { ApiError } from '../middleware/errorHandler';
import axios from 'axios';

const prisma = new PrismaClient();

// Tool service
export class ToolService {
  // Create a new tool
  async createTool(userId: string, toolData: any): Promise<Tool> {
    try {
      // Validate tool data
      if (!toolData.name || !toolData.type) {
        throw new ApiError(400, 'Tool name and type are required');
      }

      // Create tool
      const tool = await prisma.tool.create({
        data: {
          name: toolData.name,
          description: toolData.description || '',
          type: toolData.type,
          config: toolData.config || {},
          schema: toolData.schema || {},
          category: toolData.category || 'custom',
          userId
        }
      });

      return tool;
    } catch (error) {
      console.error('Error creating tool:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to create tool');
    }
  }

  // Get all tools for a user
  async getTools(userId: string, category?: string): Promise<Tool[]> {
    try {
      const whereClause: any = { userId };
      
      if (category) {
        whereClause.category = category;
      }

      const tools = await prisma.tool.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return tools;
    } catch (error) {
      console.error('Error getting tools:', error);
      throw new ApiError(500, 'Failed to get tools');
    }
  }

  // Get tool by ID
  async getToolById(id: string, userId: string): Promise<Tool> {
    try {
      const tool = await prisma.tool.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!tool) {
        throw new ApiError(404, 'Tool not found');
      }

      return tool;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting tool:', error);
      throw new ApiError(500, 'Failed to get tool');
    }
  }

  // Update tool
  async updateTool(id: string, userId: string, toolData: any): Promise<Tool> {
    try {
      // Check if tool exists and belongs to user
      const existingTool = await prisma.tool.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingTool) {
        throw new ApiError(404, 'Tool not found or you do not have permission to update it');
      }

      // Update tool
      const updatedTool = await prisma.tool.update({
        where: { id },
        data: {
          name: toolData.name,
          description: toolData.description,
          type: toolData.type,
          config: toolData.config,
          schema: toolData.schema,
          category: toolData.category
        }
      });

      return updatedTool;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error updating tool:', error);
      throw new ApiError(500, 'Failed to update tool');
    }
  }

  // Delete tool
  async deleteTool(id: string, userId: string): Promise<void> {
    try {
      // Check if tool exists and belongs to user
      const existingTool = await prisma.tool.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingTool) {
        throw new ApiError(404, 'Tool not found or you do not have permission to delete it');
      }

      // Delete agent tool connections
      await prisma.agentTool.deleteMany({
        where: { toolId: id }
      });

      // Delete tool
      await prisma.tool.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error deleting tool:', error);
      throw new ApiError(500, 'Failed to delete tool');
    }
  }

  // Test tool connection
  async testConnection(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get tool
      const tool = await this.getToolById(id, userId);

      // Test connection based on tool type
      switch (tool.type) {
        case 'api':
          return await this.testApiConnection(tool);
        case 'database':
          return await this.testDatabaseConnection(tool);
        case 'custom':
          return { success: true, message: 'Custom tool connection test is not supported' };
        default:
          return { success: false, message: `Unsupported tool type: ${tool.type}` };
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error testing tool connection:', error);
      throw new ApiError(500, 'Failed to test tool connection');
    }
  }

  // Test API connection
  private async testApiConnection(tool: Tool): Promise<{ success: boolean; message: string }> {
    try {
      const config = tool.config as any;
      if (!config.baseUrl) {
        return { success: false, message: 'Base URL is required for API tools' };
      }

      // Make a simple request to the base URL
      const response = await axios.get(config.baseUrl, {
        headers: config.headers || {},
        timeout: 5000 // 5 second timeout
      });

      return {
        success: response.status >= 200 && response.status < 300,
        message: `API responded with status ${response.status}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `API connection failed: ${error.message}`
      };
    }
  }

  // Test database connection
  private async testDatabaseConnection(tool: Tool): Promise<{ success: boolean; message: string }> {
    // This is a simplified implementation
    // In a real system, you would use the appropriate database client
    // based on the database type (MySQL, PostgreSQL, etc.)
    try {
      const config = tool.config as any;
      if (!config.connectionString && !config.host) {
        return { success: false, message: 'Connection string or host is required for database tools' };
      }

      // Simulate a connection test
      return { success: true, message: 'Database connection test successful' };
    } catch (error: any) {
      return {
        success: false,
        message: `Database connection failed: ${error.message}`
      };
    }
  }

  // Get tool schema
  async getToolSchema(id: string, userId: string): Promise<any> {
    try {
      // Get tool
      const tool = await this.getToolById(id, userId);

      return tool.schema;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting tool schema:', error);
      throw new ApiError(500, 'Failed to get tool schema');
    }
  }

  // Execute tool
  async executeTool(id: string, userId: string, params: any): Promise<any> {
    try {
      // Get tool
      const tool = await this.getToolById(id, userId);

      // Execute tool based on type
      switch (tool.type) {
        case 'api':
          return await this.executeApiTool(tool, params);
        case 'database':
          return await this.executeDatabaseTool(tool, params);
        case 'custom':
          return await this.executeCustomTool(tool, params);
        default:
          throw new ApiError(400, `Unsupported tool type: ${tool.type}`);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error executing tool:', error);
      throw new ApiError(500, 'Failed to execute tool');
    }
  }

  // Execute API tool
  private async executeApiTool(tool: Tool, params: any): Promise<any> {
    try {
      const config = tool.config as any;
      if (!config.baseUrl) {
        throw new Error('Base URL is required for API tools');
      }

      // Build request options
      const method = (params.method || config.defaultMethod || 'GET').toUpperCase();
      const url = `${config.baseUrl}${params.endpoint || ''}`;
      const headers = { ...config.headers, ...params.headers };
      const timeout = params.timeout || config.timeout || 30000;

      // Execute request
      const requestOptions: any = {
        method,
        url,
        headers,
        timeout
      };

      // Add data for POST, PUT, PATCH
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        requestOptions.data = params.data || {};
      }

      // Add query parameters for GET, DELETE
      if (['GET', 'DELETE'].includes(method)) {
        requestOptions.params = params.params || {};
      }

      const response = await axios(requestOptions);

      return {
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error: any) {
      if (error.response) {
        return {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
          error: error.message
        };
      }
      throw error;
    }
  }

  // Execute database tool
  private async executeDatabaseTool(tool: Tool, params: any): Promise<any> {
    // This is a simplified implementation
    // In a real system, you would use the appropriate database client
    try {
      const config = tool.config as any;
      if (!config.connectionString && !config.host) {
        throw new Error('Connection string or host is required for database tools');
      }

      // Simulate database query execution
      return {
        success: true,
        message: 'Database query executed successfully',
        data: [{ id: 1, name: 'Sample data' }]
      };
    } catch (error: any) {
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  // Execute custom tool
  private async executeCustomTool(tool: Tool, params: any): Promise<any> {
    try {
      // Custom tools would typically have a handler function defined in their schema
      // This is a simplified implementation
      return {
        success: true,
        message: 'Custom tool executed successfully',
        params
      };
    } catch (error: any) {
      throw new Error(`Custom tool execution failed: ${error.message}`);
    }
  }

  // Connect tool to agent
  async connectToolToAgent(toolId: string, agentId: string, userId: string): Promise<AgentTool> {
    try {
      // Check if tool exists and belongs to user
      const tool = await prisma.tool.findFirst({
        where: {
          id: toolId,
          userId
        }
      });

      if (!tool) {
        throw new ApiError(404, 'Tool not found or you do not have access to it');
      }

      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId
        }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found or you do not have access to it');
      }

      // Check if connection already exists
      const existingConnection = await prisma.agentTool.findUnique({
        where: {
          agentId_toolId: {
            agentId,
            toolId
          }
        }
      });

      if (existingConnection) {
        return existingConnection;
      }

      // Create connection
      const agentTool = await prisma.agentTool.create({
        data: {
          agentId,
          toolId,
          config: {}
        }
      });

      return agentTool;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error connecting tool to agent:', error);
      throw new ApiError(500, 'Failed to connect tool to agent');
    }
  }

  // Disconnect tool from agent
  async disconnectToolFromAgent(toolId: string, agentId: string, userId: string): Promise<void> {
    try {
      // Check if tool exists and belongs to user
      const tool = await prisma.tool.findFirst({
        where: {
          id: toolId,
          userId
        }
      });

      if (!tool) {
        throw new ApiError(404, 'Tool not found or you do not have access to it');
      }

      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId
        }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found or you do not have access to it');
      }

      // Delete connection
      await prisma.agentTool.delete({
        where: {
          agentId_toolId: {
            agentId,
            toolId
          }
        }
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error disconnecting tool from agent:', error);
      throw new ApiError(500, 'Failed to disconnect tool from agent');
    }
  }

  // Get tool categories
  async getToolCategories(): Promise<string[]> {
    try {
      // Get distinct categories
      const tools = await prisma.tool.findMany({
        select: {
          category: true
        },
        distinct: ['category']
      });

      return tools.map(tool => tool.category).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error getting tool categories:', error);
      throw new ApiError(500, 'Failed to get tool categories');
    }
  }

  // Import tool from marketplace
  async importToolFromMarketplace(userId: string, marketplaceToolId: string): Promise<Tool> {
    try {
      // This is a simplified implementation
      // In a real system, you would fetch the tool from a marketplace API
      const marketplaceTool = {
        name: `Marketplace Tool ${marketplaceToolId}`,
        description: 'Imported from marketplace',
        type: 'api',
        config: { baseUrl: 'https://api.example.com' },
        schema: { properties: {} },
        category: 'marketplace'
      };

      // Create tool
      const tool = await this.createTool(userId, marketplaceTool);

      return tool;
    } catch (error) {
      console.error('Error importing tool from marketplace:', error);
      throw new ApiError(500, 'Failed to import tool from marketplace');
    }
  }
}