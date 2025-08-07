"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvents = exports.emitWorkflowError = exports.emitWorkflowComplete = exports.emitWorkflowUpdate = exports.emitAgentError = exports.emitAgentComplete = exports.emitAgentStream = exports.setupSocketHandlers = void 0;
const auth_1 = require("../utils/auth");
// Define event types
var SocketEvents;
(function (SocketEvents) {
    SocketEvents["CONNECT"] = "connect";
    SocketEvents["DISCONNECT"] = "disconnect";
    SocketEvents["ERROR"] = "error";
    SocketEvents["AGENT_STREAM"] = "agent:stream";
    SocketEvents["AGENT_COMPLETE"] = "agent:complete";
    SocketEvents["AGENT_ERROR"] = "agent:error";
    SocketEvents["WORKFLOW_UPDATE"] = "workflow:update";
    SocketEvents["WORKFLOW_COMPLETE"] = "workflow:complete";
    SocketEvents["WORKFLOW_ERROR"] = "workflow:error";
    SocketEvents["JOIN_ROOM"] = "join:room";
    SocketEvents["LEAVE_ROOM"] = "leave:room";
    // Collaboration events
    SocketEvents["COLLABORATION_SESSION_CREATED"] = "collaboration:session_created";
    SocketEvents["COLLABORATION_MESSAGE"] = "collaboration:message";
    SocketEvents["COLLABORATION_TASK_ASSIGNED"] = "collaboration:task_assigned";
    SocketEvents["COLLABORATION_TASK_UPDATED"] = "collaboration:task_updated";
    SocketEvents["COLLABORATION_APPROVAL_REQUESTED"] = "collaboration:approval_requested";
    SocketEvents["COLLABORATION_APPROVAL_RESPONDED"] = "collaboration:approval_responded";
    SocketEvents["JOIN_COLLABORATION_SESSION"] = "collaboration:join_session";
    SocketEvents["LEAVE_COLLABORATION_SESSION"] = "collaboration:leave_session";
})(SocketEvents || (exports.SocketEvents = SocketEvents = {}));
// Setup socket handlers
const setupSocketHandlers = (io) => {
    // Middleware for authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: Token not provided'));
            }
            const decoded = await (0, auth_1.verifyToken)(token);
            if (!decoded) {
                return next(new Error('Authentication error: Invalid token'));
            }
            // Attach user data to socket
            socket.data.user = decoded;
            next();
        }
        catch (error) {
            next(new Error('Authentication error'));
        }
    });
    // Connection handler
    io.on(SocketEvents.CONNECT, (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        // Join room handler
        socket.on(SocketEvents.JOIN_ROOM, (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room: ${roomId}`);
        });
        // Leave room handler
        socket.on(SocketEvents.LEAVE_ROOM, (roomId) => {
            socket.leave(roomId);
            console.log(`Socket ${socket.id} left room: ${roomId}`);
        });
        // Agent stream handler
        socket.on(SocketEvents.AGENT_STREAM, (data) => {
            const { roomId, agentId, content } = data;
            if (roomId) {
                socket.to(roomId).emit(SocketEvents.AGENT_STREAM, { agentId, content });
            }
        });
        // Workflow update handler
        socket.on(SocketEvents.WORKFLOW_UPDATE, (data) => {
            const { roomId, workflowId, status, progress } = data;
            if (roomId) {
                socket.to(roomId).emit(SocketEvents.WORKFLOW_UPDATE, { workflowId, status, progress });
            }
        });
        // Collaboration session handlers
        socket.on(SocketEvents.JOIN_COLLABORATION_SESSION, (sessionId) => {
            const roomName = `session:${sessionId}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined collaboration session: ${sessionId}`);
        });
        socket.on(SocketEvents.LEAVE_COLLABORATION_SESSION, (sessionId) => {
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
        socket.on(SocketEvents.ERROR, (error) => {
            console.error(`Socket error: ${socket.id}`, error);
        });
    });
};
exports.setupSocketHandlers = setupSocketHandlers;
// Helper function to emit agent stream updates
const emitAgentStream = (io, roomId, agentId, content) => {
    io.to(roomId).emit(SocketEvents.AGENT_STREAM, { agentId, content });
};
exports.emitAgentStream = emitAgentStream;
// Helper function to emit agent completion
const emitAgentComplete = (io, roomId, agentId, result) => {
    io.to(roomId).emit(SocketEvents.AGENT_COMPLETE, { agentId, result });
};
exports.emitAgentComplete = emitAgentComplete;
// Helper function to emit agent errors
const emitAgentError = (io, roomId, agentId, error) => {
    io.to(roomId).emit(SocketEvents.AGENT_ERROR, { agentId, error });
};
exports.emitAgentError = emitAgentError;
// Helper function to emit workflow updates
const emitWorkflowUpdate = (io, roomId, workflowId, status, progress) => {
    io.to(roomId).emit(SocketEvents.WORKFLOW_UPDATE, { workflowId, status, progress });
};
exports.emitWorkflowUpdate = emitWorkflowUpdate;
// Helper function to emit workflow completion
const emitWorkflowComplete = (io, roomId, workflowId, result) => {
    io.to(roomId).emit(SocketEvents.WORKFLOW_COMPLETE, { workflowId, result });
};
exports.emitWorkflowComplete = emitWorkflowComplete;
// Helper function to emit workflow errors
const emitWorkflowError = (io, roomId, workflowId, error) => {
    io.to(roomId).emit(SocketEvents.WORKFLOW_ERROR, { workflowId, error });
};
exports.emitWorkflowError = emitWorkflowError;
