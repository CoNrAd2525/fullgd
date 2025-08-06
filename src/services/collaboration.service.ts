import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { AgentService } from './agent.service';
import { WebhookService } from './webhook.service';
import { PipedreamService } from './pipedream.service';

interface CreateCollaborationSessionData {
  name: string;
  description?: string;
  userId: string;
  agentIds: string[];
  config?: any;
}

interface SendMessageData {
  sessionId: string;
  fromAgentId: string;
  toAgentId?: string; // If null, broadcast to all
  content: string;
  messageType: 'text' | 'task' | 'result' | 'question' | 'approval_request';
  metadata?: any;
}

interface AssignTaskData {
  sessionId: string;
  fromAgentId: string;
  toAgentId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  requirements?: any;
}

export class CollaborationService {
  private prisma: PrismaClient;
  private io: Server;
  private agentService: AgentService;
  private webhookService: WebhookService;
  private pipedreamService: PipedreamService;

  constructor(prisma: PrismaClient, io: Server, agentService: AgentService, webhookService: WebhookService) {
    this.prisma = prisma;
    this.io = io;
    this.agentService = agentService;
    this.webhookService = webhookService;
    this.pipedreamService = new PipedreamService(prisma);
  }

  // Create a new collaboration session
  async createCollaborationSession(data: CreateCollaborationSessionData) {
    try {
      const session = await this.prisma.collaborationSession.create({
        data: {
          name: data.name,
          description: data.description,
          userId: data.userId,
          config: data.config || {},
          status: 'active',
          participants: {
            create: data.agentIds.map((agentId, index) => ({
              agentId,
              role: index === 0 ? 'supervisor' : 'worker',
              joinedAt: new Date(),
            }))
          }
        },
        include: {
          participants: {
            include: {
              agent: true
            }
          },
          user: true
        }
      });

      // Emit session created event
      this.io.emit('collaboration:session_created', {
        sessionId: session.id,
        session
      });

      // Log collaboration event
      await this.logCollaborationEvent({
        sessionId: session.id,
        eventType: 'session_created',
        description: `Collaboration session '${session.name}' created with ${data.agentIds.length} agents`,
        metadata: { agentIds: data.agentIds }
      });

      // Send event to Pipedream
      try {
        await this.pipedreamService.sendCollaborationEvent(
          'session_created',
          session.id,
          {
            sessionName: session.name,
            description: session.description,
            agentCount: data.agentIds.length,
            agentIds: data.agentIds,
            config: session.config
          },
          data.userId
        );
      } catch (error) {
        console.error('Failed to send session_created event to Pipedream:', error);
      }

      return session;
    } catch (error) {
      console.error('Error creating collaboration session:', error);
      throw error;
    }
  }

  // Send message between agents
  async sendMessage(data: SendMessageData) {
    try {
      const message = await this.prisma.agentMessage.create({
        data: {
          sessionId: data.sessionId,
          fromAgentId: data.fromAgentId,
          toAgentId: data.toAgentId,
          content: data.content,
          messageType: data.messageType,
          metadata: data.metadata || {}
        },
        include: {
          fromAgent: true,
          toAgent: true,
          session: true
        }
      });

      // Emit message to relevant agents
      const roomName = `session:${data.sessionId}`;
      this.io.to(roomName).emit('collaboration:message', {
        messageId: message.id,
        message
      });

      // If it's a task or approval request, handle accordingly
      if (data.messageType === 'task') {
        await this.handleTaskMessage(message);
      } else if (data.messageType === 'approval_request') {
        await this.handleApprovalRequest(message);
      }

      // Log collaboration event
      await this.logCollaborationEvent({
        sessionId: data.sessionId,
        eventType: 'message_sent',
        description: `Agent ${message.fromAgent.name} sent ${data.messageType} message`,
        metadata: { messageId: message.id, messageType: data.messageType }
      });

      // Send event to Pipedream
      try {
        await this.pipedreamService.sendCollaborationEvent(
          'message_sent',
          data.sessionId,
          {
            messageId: message.id,
            fromAgent: message.fromAgent.name,
            toAgent: message.toAgent?.name || 'all',
            messageType: data.messageType,
            content: data.content,
            metadata: data.metadata
          },
          message.session.userId
        );
      } catch (error) {
        console.error('Failed to send message_sent event to Pipedream:', error);
      }

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Assign task to an agent
  async assignTask(data: AssignTaskData) {
    try {
      const task = await this.prisma.taskAssignment.create({
        data: {
          sessionId: data.sessionId,
          fromAgentId: data.fromAgentId,
          toAgentId: data.toAgentId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          dueDate: data.dueDate,
          requirements: data.requirements || {},
          status: 'assigned'
        },
        include: {
          fromAgent: true,
          toAgent: true,
          session: true
        }
      });

      // Send task assignment message
      await this.sendMessage({
        sessionId: data.sessionId,
        fromAgentId: data.fromAgentId,
        toAgentId: data.toAgentId,
        content: `Task assigned: ${data.title}`,
        messageType: 'task',
        metadata: { taskId: task.id }
      });

      // Emit task assignment event
      this.io.to(`session:${data.sessionId}`).emit('collaboration:task_assigned', {
        taskId: task.id,
        task
      });

      // Send event to Pipedream
      try {
        await this.pipedreamService.sendCollaborationEvent(
          'task_assigned',
          data.sessionId,
          {
            taskId: task.id,
            title: data.title,
            description: data.description,
            priority: data.priority,
            fromAgent: task.fromAgent.name,
            toAgent: task.toAgent.name,
            dueDate: data.dueDate,
            requirements: data.requirements
          },
          task.session.userId
        );
      } catch (error) {
        console.error('Failed to send task_assigned event to Pipedream:', error);
      }

      return task;
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  }

  // Update task status
  async updateTaskStatus(taskId: string, status: string, result?: any) {
    try {
      const task = await this.prisma.taskAssignment.update({
        where: { id: taskId },
        data: {
          status,
          result,
          completedAt: status === 'completed' ? new Date() : null
        },
        include: {
          fromAgent: true,
          toAgent: true,
          session: true
        }
      });

      // Notify task completion
      if (status === 'completed') {
        await this.sendMessage({
          sessionId: task.sessionId,
          fromAgentId: task.toAgentId,
          toAgentId: task.fromAgentId,
          content: `Task completed: ${task.title}`,
          messageType: 'result',
          metadata: { taskId: task.id, result }
        });
      }

      // Emit task status update
      this.io.to(`session:${task.sessionId}`).emit('collaboration:task_updated', {
        taskId: task.id,
        task,
        status
      });

      return task;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // Request human approval
  async requestApproval(sessionId: string, agentId: string, title: string, description: string, data: any) {
    try {
      const approval = await this.prisma.approvalGate.create({
        data: {
          sessionId,
          requestingAgentId: agentId,
          title,
          description,
          requestData: data,
          status: 'pending'
        },
        include: {
          requestingAgent: true,
          session: {
            include: {
              user: true
            }
          }
        }
      });

      // Emit approval request to user
      this.io.to(`user:${approval.session.userId}`).emit('collaboration:approval_requested', {
        approvalId: approval.id,
        approval
      });

      // Send webhook notification
      await this.webhookService.triggerWebhook(approval.session.userId, 'approval.requested', {
        approvalId: approval.id,
        sessionId,
        agentName: approval.requestingAgent.name,
        title,
        description
      });

      // Send event to Pipedream
      try {
        await this.pipedreamService.sendCollaborationEvent(
          'approval_requested',
          sessionId,
          {
            approvalId: approval.id,
            title,
            description,
            requestingAgent: approval.requestingAgent.name,
            requestData: data,
            userId: approval.session.userId
          },
          approval.session.userId
        );
      } catch (error) {
        console.error('Failed to send approval_requested event to Pipedream:', error);
      }

      return approval;
    } catch (error) {
      console.error('Error requesting approval:', error);
      throw error;
    }
  }

  // Handle approval response
  async handleApprovalResponse(approvalId: string, userId: string, approved: boolean, feedback?: string) {
    try {
      const approval = await this.prisma.approvalGate.update({
        where: { id: approvalId },
        data: {
          status: approved ? 'approved' : 'rejected',
          approvedByUserId: approved ? userId : undefined,
          rejectedByUserId: approved ? undefined : userId,
          feedback,
          respondedAt: new Date()
        },
        include: {
          requestingAgent: true,
          session: true
        }
      });

      // Notify the requesting agent
      await this.sendMessage({
        sessionId: approval.sessionId,
        fromAgentId: 'system',
        toAgentId: approval.requestingAgentId,
        content: `Approval ${approved ? 'granted' : 'denied'}: ${approval.title}`,
        messageType: 'approval_request',
        metadata: { approvalId: approval.id, approved, feedback }
      });

      // Emit approval response
      this.io.to(`session:${approval.sessionId}`).emit('collaboration:approval_responded', {
        approvalId: approval.id,
        approved,
        feedback
      });

      return approval;
    } catch (error) {
      console.error('Error handling approval response:', error);
      throw error;
    }
  }

  // Get collaboration session details
  async getCollaborationSession(sessionId: string) {
    try {
      return await this.prisma.collaborationSession.findUnique({
        where: { id: sessionId },
        include: {
          participants: {
            include: {
              agent: true
            }
          },
          messages: {
            include: {
              fromAgent: true,
              toAgent: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          },
          tasks: {
            include: {
              fromAgent: true,
              toAgent: true
            }
          },
          approvals: {
            include: {
              requestingAgent: true
            }
          },
          events: {
            orderBy: {
              createdAt: 'desc'
            }
          },
          user: true
        }
      });
    } catch (error) {
      console.error('Error getting collaboration session:', error);
      throw error;
    }
  }

  // Private helper methods
  private async handleTaskMessage(message: any) {
    // Extract task information from message metadata and create task assignment
    if (message.metadata?.taskData) {
      await this.assignTask({
        sessionId: message.sessionId,
        fromAgentId: message.fromAgentId,
        toAgentId: message.toAgentId,
        ...message.metadata.taskData
      });
    }
  }

  private async handleApprovalRequest(message: any) {
    // Extract approval information from message metadata
    if (message.metadata?.approvalData) {
      await this.requestApproval(
        message.sessionId,
        message.fromAgentId,
        message.metadata.approvalData.title,
        message.metadata.approvalData.description,
        message.metadata.approvalData.data
      );
    }
  }

  private async logCollaborationEvent(data: {
    sessionId: string;
    eventType: string;
    description: string;
    metadata?: any;
  }) {
    try {
      await this.prisma.collaborationEvent.create({
        data: {
          sessionId: data.sessionId,
          eventType: data.eventType,
          description: data.description,
          metadata: data.metadata || {}
        }
      });
    } catch (error) {
      console.error('Error logging collaboration event:', error);
    }
  }
}