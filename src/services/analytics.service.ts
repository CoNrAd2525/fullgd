import { PrismaClient } from '@prisma/client';
import { ApiError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// Analytics service
export class AnalyticsService {
  // Get platform overview
  async getPlatformOverview(): Promise<any> {
    try {
      // Get user count
      const userCount = await prisma.user.count();

      // Get agent count
      const agentCount = await prisma.agent.count();

      // Get workflow count
      const workflowCount = await prisma.workflow.count();

      // Get execution counts
      const agentExecutionCount = await prisma.agentExecution.count();
      const workflowExecutionCount = await prisma.workflowExecution.count();

      // Get recent activity
      const recentActivity = await prisma.activity.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Get new users in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newUserCount = await prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      });

      return {
        userCount,
        agentCount,
        workflowCount,
        executionCount: {
          agent: agentExecutionCount,
          workflow: workflowExecutionCount,
          total: agentExecutionCount + workflowExecutionCount
        },
        newUserCount,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting platform overview:', error);
      throw new ApiError(500, 'Failed to get platform overview');
    }
  }

  // Get user activity metrics
  async getUserActivityMetrics(timeframe: string = 'week'): Promise<any> {
    try {
      let startDate = new Date();
      
      // Set start date based on timeframe
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7); // Default to week
      }

      // Get login activity
      const loginActivity = await prisma.activity.findMany({
        where: {
          category: 'auth',
          action: 'login',
          createdAt: {
            gte: startDate
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Get active users
      const activeUsers = await prisma.user.count({
        where: {
          lastLoginAt: {
            gte: startDate
          }
        }
      });

      // Group login activity by day
      const activityByDay = this.groupActivityByDay(loginActivity);

      return {
        activeUsers,
        loginActivity: activityByDay,
        timeframe
      };
    } catch (error) {
      console.error('Error getting user activity metrics:', error);
      throw new ApiError(500, 'Failed to get user activity metrics');
    }
  }

  // Get agent usage metrics
  async getAgentUsageMetrics(timeframe: string = 'week'): Promise<any> {
    try {
      let startDate = new Date();
      
      // Set start date based on timeframe
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7); // Default to week
      }

      // Get agent executions
      const agentExecutions = await prisma.agentExecution.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        include: {
          agent: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Get top agents by execution count
      const topAgents = await prisma.agent.findMany({
        take: 10,
        orderBy: {
          executions: {
            _count: 'desc'
          }
        },
        include: {
          _count: {
            select: {
              executions: true
            }
          }
        }
      });

      // Group executions by day
      const executionsByDay = this.groupExecutionsByDay(agentExecutions);

      // Group executions by agent
      const executionsByAgent = this.groupExecutionsByAgent(agentExecutions);

      return {
        totalExecutions: agentExecutions.length,
        executionsByDay,
        executionsByAgent,
        topAgents: topAgents.map(agent => ({
          id: agent.id,
          name: agent.name,
          executionCount: agent._count.executions
        })),
        timeframe
      };
    } catch (error) {
      console.error('Error getting agent usage metrics:', error);
      throw new ApiError(500, 'Failed to get agent usage metrics');
    }
  }

  // Get workflow performance metrics
  async getWorkflowPerformanceMetrics(timeframe: string = 'week'): Promise<any> {
    try {
      let startDate = new Date();
      
      // Set start date based on timeframe
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7); // Default to week
      }

      // Get workflow executions
      const workflowExecutions = await prisma.workflowExecution.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        include: {
          workflow: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Get top workflows by execution count
      const topWorkflows = await prisma.workflow.findMany({
        take: 10,
        orderBy: {
          executions: {
            _count: 'desc'
          }
        },
        include: {
          _count: {
            select: {
              executions: true
            }
          }
        }
      });

      // Group executions by day
      const executionsByDay = this.groupWorkflowExecutionsByDay(workflowExecutions);

      // Group executions by workflow
      const executionsByWorkflow = this.groupExecutionsByWorkflow(workflowExecutions);

      // Calculate average execution time
      const averageExecutionTime = this.calculateAverageExecutionTime(workflowExecutions);

      return {
        totalExecutions: workflowExecutions.length,
        executionsByDay,
        executionsByWorkflow,
        averageExecutionTime,
        topWorkflows: topWorkflows.map(workflow => ({
          id: workflow.id,
          name: workflow.name,
          executionCount: workflow._count.executions
        })),
        timeframe
      };
    } catch (error) {
      console.error('Error getting workflow performance metrics:', error);
      throw new ApiError(500, 'Failed to get workflow performance metrics');
    }
  }

  // Get resource usage metrics
  async getResourceUsageMetrics(): Promise<any> {
    try {
      // This is a simplified implementation
      // In a real system, you would track actual resource usage

      // Get total document count
      const documentCount = await prisma.document.count();

      // Get total memory count
      const memoryCount = await prisma.memory.count();

      // Calculate total storage used (simplified)
      const storageUsed = {
        documents: documentCount * 100, // Assume average 100KB per document
        memories: memoryCount * 10, // Assume average 10KB per memory
        total: (documentCount * 100) + (memoryCount * 10)
      };

      return {
        storageUsed,
        documentCount,
        memoryCount
      };
    } catch (error) {
      console.error('Error getting resource usage metrics:', error);
      throw new ApiError(500, 'Failed to get resource usage metrics');
    }
  }

  // Get error metrics
  async getErrorMetrics(timeframe: string = 'week'): Promise<any> {
    try {
      let startDate = new Date();
      
      // Set start date based on timeframe
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7); // Default to week
      }

      // Get failed agent executions
      const failedAgentExecutions = await prisma.agentExecution.findMany({
        where: {
          status: 'error',
          createdAt: {
            gte: startDate
          }
        },
        include: {
          agent: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Get failed workflow executions
      const failedWorkflowExecutions = await prisma.workflowExecution.findMany({
        where: {
          status: 'error',
          createdAt: {
            gte: startDate
          }
        },
        include: {
          workflow: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Group errors by day
      const errorsByDay = this.groupErrorsByDay(failedAgentExecutions, failedWorkflowExecutions);

      // Group errors by type
      const errorsByType = this.groupErrorsByType(failedAgentExecutions, failedWorkflowExecutions);

      return {
        totalErrors: failedAgentExecutions.length + failedWorkflowExecutions.length,
        errorsByDay,
        errorsByType,
        timeframe
      };
    } catch (error) {
      console.error('Error getting error metrics:', error);
      throw new ApiError(500, 'Failed to get error metrics');
    }
  }

  // Get agent analytics
  async getAgentAnalytics(agentId: string, timeframe: string = 'week'): Promise<any> {
    try {
      // Check if agent exists
      const agent = await prisma.agent.findUnique({
        where: { id: agentId }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found');
      }

      let startDate = new Date();
      
      // Set start date based on timeframe
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7); // Default to week
      }

      // Get agent executions
      const executions = await prisma.agentExecution.findMany({
        where: {
          agentId,
          createdAt: {
            gte: startDate
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Get execution status counts
      const statusCounts = {
        completed: 0,
        error: 0,
        running: 0,
        cancelled: 0
      };

      executions.forEach(execution => {
        if (statusCounts.hasOwnProperty(execution.status)) {
          statusCounts[execution.status as keyof typeof statusCounts]++;
        }
      });

      // Group executions by day
      const executionsByDay = this.groupExecutionsByDay(executions);

      // Calculate average execution time
      const averageExecutionTime = this.calculateAverageAgentExecutionTime(executions);

      return {
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description
        },
        totalExecutions: executions.length,
        statusCounts,
        executionsByDay,
        averageExecutionTime,
        timeframe
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting agent analytics:', error);
      throw new ApiError(500, 'Failed to get agent analytics');
    }
  }

  // Get workflow analytics
  async getWorkflowAnalytics(workflowId: string, timeframe: string = 'week'): Promise<any> {
    try {
      // Check if workflow exists
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId }
      });

      if (!workflow) {
        throw new ApiError(404, 'Workflow not found');
      }

      let startDate = new Date();
      
      // Set start date based on timeframe
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7); // Default to week
      }

      // Get workflow executions
      const executions = await prisma.workflowExecution.findMany({
        where: {
          workflowId,
          createdAt: {
            gte: startDate
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Get execution status counts
      const statusCounts = {
        completed: 0,
        error: 0,
        running: 0,
        cancelled: 0
      };

      executions.forEach(execution => {
        if (statusCounts.hasOwnProperty(execution.status)) {
          statusCounts[execution.status as keyof typeof statusCounts]++;
        }
      });

      // Group executions by day
      const executionsByDay = this.groupWorkflowExecutionsByDay(executions);

      // Calculate average execution time
      const averageExecutionTime = this.calculateAverageWorkflowExecutionTime(executions);

      return {
        workflow: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description
        },
        totalExecutions: executions.length,
        statusCounts,
        executionsByDay,
        averageExecutionTime,
        timeframe
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting workflow analytics:', error);
      throw new ApiError(500, 'Failed to get workflow analytics');
    }
  }

  // Get user analytics
  async getUserAnalytics(userId: string, timeframe: string = 'week'): Promise<any> {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      let startDate = new Date();
      
      // Set start date based on timeframe
      switch (timeframe) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7); // Default to week
      }

      // Get user activity
      const activity = await prisma.activity.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Get agent executions
      const agentExecutions = await prisma.agentExecution.count({
        where: {
          agent: {
            userId
          },
          createdAt: {
            gte: startDate
          }
        }
      });

      // Get workflow executions
      const workflowExecutions = await prisma.workflowExecution.count({
        where: {
          workflow: {
            userId
          },
          createdAt: {
            gte: startDate
          }
        }
      });

      // Group activity by day
      const activityByDay = this.groupActivityByDay(activity);

      // Group activity by category
      const activityByCategory = this.groupActivityByCategory(activity);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        totalActivity: activity.length,
        activityByDay,
        activityByCategory,
        executionCounts: {
          agent: agentExecutions,
          workflow: workflowExecutions,
          total: agentExecutions + workflowExecutions
        },
        timeframe
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting user analytics:', error);
      throw new ApiError(500, 'Failed to get user analytics');
    }
  }

  // Export analytics data
  async exportAnalyticsData(type: string, timeframe: string = 'month', format: string = 'json'): Promise<any> {
    try {
      let data: any;

      // Get data based on type
      switch (type) {
        case 'platform':
          data = await this.getPlatformOverview();
          break;
        case 'user_activity':
          data = await this.getUserActivityMetrics(timeframe);
          break;
        case 'agent_usage':
          data = await this.getAgentUsageMetrics(timeframe);
          break;
        case 'workflow_performance':
          data = await this.getWorkflowPerformanceMetrics(timeframe);
          break;
        case 'resource_usage':
          data = await this.getResourceUsageMetrics();
          break;
        case 'errors':
          data = await this.getErrorMetrics(timeframe);
          break;
        default:
          throw new ApiError(400, `Invalid analytics type: ${type}`);
      }

      // Format data
      switch (format.toLowerCase()) {
        case 'json':
          return { data, format: 'json' };
        case 'csv':
          // Convert to CSV (simplified)
          return { data: 'CSV data would be here', format: 'csv' };
        default:
          return { data, format: 'json' };
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error exporting analytics data:', error);
      throw new ApiError(500, 'Failed to export analytics data');
    }
  }

  // Helper methods
  private groupActivityByDay(activity: any[]): any {
    const groupedActivity: { [key: string]: number } = {};

    activity.forEach(item => {
      const date = new Date(item.createdAt).toISOString().split('T')[0];
      if (!groupedActivity[date]) {
        groupedActivity[date] = 0;
      }
      groupedActivity[date]++;
    });

    return Object.entries(groupedActivity).map(([date, count]) => ({ date, count }));
  }

  private groupActivityByCategory(activity: any[]): any {
    const groupedActivity: { [key: string]: number } = {};

    activity.forEach(item => {
      const category = item.category || 'unknown';
      if (!groupedActivity[category]) {
        groupedActivity[category] = 0;
      }
      groupedActivity[category]++;
    });

    return Object.entries(groupedActivity).map(([category, count]) => ({ category, count }));
  }

  private groupExecutionsByDay(executions: any[]): any {
    const groupedExecutions: { [key: string]: number } = {};

    executions.forEach(execution => {
      const date = new Date(execution.createdAt).toISOString().split('T')[0];
      if (!groupedExecutions[date]) {
        groupedExecutions[date] = 0;
      }
      groupedExecutions[date]++;
    });

    return Object.entries(groupedExecutions).map(([date, count]) => ({ date, count }));
  }

  private groupWorkflowExecutionsByDay(executions: any[]): any {
    const groupedExecutions: { [key: string]: number } = {};

    executions.forEach(execution => {
      const date = new Date(execution.createdAt).toISOString().split('T')[0];
      if (!groupedExecutions[date]) {
        groupedExecutions[date] = 0;
      }
      groupedExecutions[date]++;
    });

    return Object.entries(groupedExecutions).map(([date, count]) => ({ date, count }));
  }

  private groupExecutionsByAgent(executions: any[]): any {
    const groupedExecutions: { [key: string]: number } = {};

    executions.forEach(execution => {
      const agentName = execution.agent?.name || 'Unknown Agent';
      if (!groupedExecutions[agentName]) {
        groupedExecutions[agentName] = 0;
      }
      groupedExecutions[agentName]++;
    });

    return Object.entries(groupedExecutions).map(([agentName, count]) => ({ agentName, count }));
  }

  private groupExecutionsByWorkflow(executions: any[]): any {
    const groupedExecutions: { [key: string]: number } = {};

    executions.forEach(execution => {
      const workflowName = execution.workflow?.name || 'Unknown Workflow';
      if (!groupedExecutions[workflowName]) {
        groupedExecutions[workflowName] = 0;
      }
      groupedExecutions[workflowName]++;
    });

    return Object.entries(groupedExecutions).map(([workflowName, count]) => ({ workflowName, count }));
  }

  private calculateAverageExecutionTime(executions: any[]): number {
    if (executions.length === 0) return 0;

    const completedExecutions = executions.filter(execution => 
      execution.status === 'completed' && execution.startedAt && execution.completedAt
    );

    if (completedExecutions.length === 0) return 0;

    const totalTime = completedExecutions.reduce((sum, execution) => {
      const startTime = new Date(execution.startedAt).getTime();
      const endTime = new Date(execution.completedAt).getTime();
      return sum + (endTime - startTime);
    }, 0);

    return Math.round(totalTime / completedExecutions.length / 1000); // Average time in seconds
  }

  private calculateAverageAgentExecutionTime(executions: any[]): number {
    if (executions.length === 0) return 0;

    const completedExecutions = executions.filter(execution => 
      execution.status === 'completed' && execution.startedAt && execution.completedAt
    );

    if (completedExecutions.length === 0) return 0;

    const totalTime = completedExecutions.reduce((sum, execution) => {
      const startTime = new Date(execution.startedAt).getTime();
      const endTime = new Date(execution.completedAt).getTime();
      return sum + (endTime - startTime);
    }, 0);

    return Math.round(totalTime / completedExecutions.length / 1000); // Average time in seconds
  }

  private calculateAverageWorkflowExecutionTime(executions: any[]): number {
    if (executions.length === 0) return 0;

    const completedExecutions = executions.filter(execution => 
      execution.status === 'completed' && execution.startedAt && execution.completedAt
    );

    if (completedExecutions.length === 0) return 0;

    const totalTime = completedExecutions.reduce((sum, execution) => {
      const startTime = new Date(execution.startedAt).getTime();
      const endTime = new Date(execution.completedAt).getTime();
      return sum + (endTime - startTime);
    }, 0);

    return Math.round(totalTime / completedExecutions.length / 1000); // Average time in seconds
  }

  private groupErrorsByDay(agentExecutions: any[], workflowExecutions: any[]): any {
    const groupedErrors: { [key: string]: number } = {};

    // Group agent execution errors
    agentExecutions.forEach(execution => {
      const date = new Date(execution.createdAt).toISOString().split('T')[0];
      if (!groupedErrors[date]) {
        groupedErrors[date] = 0;
      }
      groupedErrors[date]++;
    });

    // Group workflow execution errors
    workflowExecutions.forEach(execution => {
      const date = new Date(execution.createdAt).toISOString().split('T')[0];
      if (!groupedErrors[date]) {
        groupedErrors[date] = 0;
      }
      groupedErrors[date]++;
    });

    return Object.entries(groupedErrors).map(([date, count]) => ({ date, count }));
  }

  private groupErrorsByType(agentExecutions: any[], workflowExecutions: any[]): any {
    const errorTypes: { [key: string]: number } = {
      'agent': agentExecutions.length,
      'workflow': workflowExecutions.length
    };

    return Object.entries(errorTypes).map(([type, count]) => ({ type, count }));
  }
}