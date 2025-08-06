import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/auth';

// Define event types
enum SocketEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  AGENT_STREAM = 'agent:stream',
  AGENT_COMPLETE = 'agent:complete',
  AGENT_ERROR = 'agent:error',
  WORKFLOW_UPDATE = 'workflow:update',
  WORKFLOW_COMPLETE = 'workflow:complete',
  WORKFLOW_ERROR = 'workflow:error',
  JOIN_ROOM = 'join:room',
  LEAVE_ROOM = 'leave:room',
  // Collaboration events
  COLLABORATION_SESSION_CREATED = 'collaboration:session_created',
  COLLABORATION_MESSAGE = 'collaboration:message',
  COLLABORATION_TASK_ASSIGNED = 'collaboration:task_assigned',
  COLLABORATION_TASK_UPDATED = 'collaboration:task_updated',
  COLLABORATION_APPROVAL_REQUESTED = 'collaboration:approval_requested',
  COLLABORATION_APPROVAL_RESPONDED = 'collaboration:approval_responded',
  JOIN_COLLABORATION_SESSION = 'collaboration:join_session',
  LEAVE_COLLABORATION_SESSION = 'collaboration:leave_session'
}

// Setup socket handlers
export const setupSocketHandlers = (io: Server): void => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      const decoded = await verifyToken(token);
      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'));
      }

      // Attach user data to socket
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on(SocketEvents.CONNECT, (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room handler
    socket.on(SocketEvents.JOIN_ROOM, (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room: ${roomId}`);
    });

    // Leave room handler
    socket.on(SocketEvents.LEAVE_ROOM, (roomId: string) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room: ${roomId}`);
    });

    // Agent stream handler
    socket.on(SocketEvents.AGENT_STREAM, (data: any) => {
      const { roomId, agentId, content } = data;
      if (roomId) {
        socket.to(roomId).emit(SocketEvents.AGENT_STREAM, { agentId, content });
      }
    });

    // Workflow update handler
    socket.on(SocketEvents.WORKFLOW_UPDATE, (data: any) => {
      const { roomId, workflowId, status, progress } = data;
      if (roomId) {
        socket.to(roomId).emit(SocketEvents.WORKFLOW_UPDATE, { workflowId, status, progress });
      }
    });

    // Collaboration session handlers
    socket.on(SocketEvents.JOIN_COLLABORATION_SESSION, (sessionId: string) => {
      const roomName = `session:${sessionId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined collaboration session: ${sessionId}`);
    });

    socket.on(SocketEvents.LEAVE_COLLABORATION_SESSION, (sessionId: string) => {
      const roomName = `session:${sessionId}`;
      socket.leave(roomName);
      console.log(`Socket ${socket.id} left collaboration session: ${sessionId}`);
    });

    // Join user-specific room for approval notifications
    if (socket.data.user) {
      const userRoom = `user:${socket.data.user.id}`;
      socket.join(userRoom);
      console.log(`Socket ${socket.id} joined user room: ${userRoom}`);
    }

    // Disconnect handler
    socket.on(SocketEvents.DISCONNECT, () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });

    // Error handler
    socket.on(SocketEvents.ERROR, (error: any) => {
      console.error(`Socket error: ${socket.id}`, error);
    });
  });
};

// Helper function to emit agent stream updates
export const emitAgentStream = (io: Server, roomId: string, agentId: string, content: any): void => {
  io.to(roomId).emit(SocketEvents.AGENT_STREAM, { agentId, content });
};

// Helper function to emit agent completion
export const emitAgentComplete = (io: Server, roomId: string, agentId: string, result: any): void => {
  io.to(roomId).emit(SocketEvents.AGENT_COMPLETE, { agentId, result });
};

// Helper function to emit agent errors
export const emitAgentError = (io: Server, roomId: string, agentId: string, error: any): void => {
  io.to(roomId).emit(SocketEvents.AGENT_ERROR, { agentId, error });
};

// Helper function to emit workflow updates
export const emitWorkflowUpdate = (io: Server, roomId: string, workflowId: string, status: string, progress: number): void => {
  io.to(roomId).emit(SocketEvents.WORKFLOW_UPDATE, { workflowId, status, progress });
};

// Helper function to emit workflow completion
export const emitWorkflowComplete = (io: Server, roomId: string, workflowId: string, result: any): void => {
  io.to(roomId).emit(SocketEvents.WORKFLOW_COMPLETE, { workflowId, result });
};

// Helper function to emit workflow errors
export const emitWorkflowError = (io: Server, roomId: string, workflowId: string, error: any): void => {
  io.to(roomId).emit(SocketEvents.WORKFLOW_ERROR, { workflowId, error });
};

export { SocketEvents };