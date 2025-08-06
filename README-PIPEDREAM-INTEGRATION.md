# Pipedream OAuth Integration & Multi-Agent Collaboration

This document provides a comprehensive guide to the Pipedream OAuth integration and multi-agent collaboration features implemented in the AgentFlow platform.

## Overview

The Pipedream integration enables seamless connectivity between your AgentFlow multi-agent system and Pipedream workflows, allowing for automated event-driven processes and external integrations.

## Features

### 🔐 OAuth Authentication
- Secure OAuth 2.0 flow with Pipedream
- Token management and automatic refresh
- User-specific integration settings

### 🤝 Multi-Agent Collaboration
- Agent-to-agent communication
- Task assignment and delegation
- Human-in-the-loop approval gates
- Real-time collaboration sessions
- Event-driven workflow triggers

### 📡 Event Integration
- Automatic event sending to Pipedream workflows
- Configurable workflow triggers
- Real-time collaboration events
- Agent execution monitoring

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```env
# Pipedream OAuth Configuration
PIPEDREAM_CLIENT_ID=d76MK0ooJVBBZEfKG9N6HZbAI43kUbUJkwDO9VvYw5c
PIPEDREAM_CLIENT_SECRET=avIA0PYg1HOBo0k_5JaEWFURQl7jATv8NWljMRuYItk
PIPEDREAM_BASE_URL=https://app--swarm-os-b5215637.base44.app
PIPEDREAM_REDIRECT_URI=http://localhost:3000/api/v1/integrations/pipedream/oauth/callback

# Pipedream Workflow IDs (optional)
PIPEDREAM_WORKFLOW_COLLABORATION_SESSION=your_session_workflow_id
PIPEDREAM_WORKFLOW_COLLABORATION_MESSAGE=your_message_workflow_id
PIPEDREAM_WORKFLOW_COLLABORATION_TASK=your_task_workflow_id
PIPEDREAM_WORKFLOW_COLLABORATION_APPROVAL=your_approval_workflow_id
PIPEDREAM_WORKFLOW_AGENT_EXECUTION=your_execution_workflow_id
PIPEDREAM_WORKFLOW_AGENT_ERROR=your_error_workflow_id
PIPEDREAM_WORKFLOW_WORKFLOW_COMPLETED=your_completion_workflow_id
```

### Database Setup

Run the database migration to create the multi-agent collaboration tables:

```bash
npx prisma migrate dev --name multi_agent_collaboration
```

## API Endpoints

### Pipedream Integration

#### OAuth Flow

**Initiate OAuth**
```http
POST /api/v1/integrations/pipedream/oauth/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "scopes": ["agents:read", "workflows:read", "collaboration:read"]
}
```

**OAuth Callback**
```http
GET /api/v1/integrations/pipedream/oauth/callback?code=<auth_code>&state=<user_id>
```

**Check Integration Status**
```http
GET /api/v1/integrations/pipedream/status
Authorization: Bearer <token>
```

**Disconnect Integration**
```http
DELETE /api/v1/integrations/pipedream/disconnect
Authorization: Bearer <token>
```

#### Workflow Triggers

**Trigger Workflow**
```http
POST /api/v1/integrations/pipedream/workflows/{workflowId}/trigger
Authorization: Bearer <token>
Content-Type: application/json

{
  "event": "custom_event",
  "data": {
    "key": "value"
  },
  "sessionId": "session_id",
  "agentId": "agent_id"
}
```

**Send Collaboration Event**
```http
POST /api/v1/integrations/pipedream/events/collaboration
Authorization: Bearer <token>
Content-Type: application/json

{
  "event": "session_created",
  "sessionId": "session_id",
  "data": {
    "sessionName": "My Collaboration",
    "agentCount": 3
  }
}
```

### Multi-Agent Collaboration

#### Collaboration Sessions

**Create Session**
```http
POST /api/v1/collaboration/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Project Alpha Collaboration",
  "description": "Collaborative session for Project Alpha",
  "agentIds": ["agent1_id", "agent2_id", "agent3_id"],
  "config": {
    "maxParticipants": 5,
    "autoApproval": false
  }
}
```

**Get Session**
```http
GET /api/v1/collaboration/sessions/{sessionId}
Authorization: Bearer <token>
```

#### Agent Communication

**Send Message**
```http
POST /api/v1/collaboration/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "session_id",
  "fromAgentId": "agent1_id",
  "toAgentId": "agent2_id",
  "content": "Hello, can you help with this task?",
  "messageType": "text",
  "metadata": {
    "priority": "high"
  }
}
```

**Get Messages**
```http
GET /api/v1/collaboration/sessions/{sessionId}/messages
Authorization: Bearer <token>
```

#### Task Management

**Assign Task**
```http
POST /api/v1/collaboration/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "session_id",
  "fromAgentId": "agent1_id",
  "toAgentId": "agent2_id",
  "title": "Data Analysis Task",
  "description": "Analyze the customer data and provide insights",
  "priority": "high",
  "dueDate": "2024-01-15T10:00:00Z",
  "requirements": {
    "format": "JSON",
    "deadline": "urgent"
  }
}
```

**Update Task Status**
```http
PUT /api/v1/collaboration/tasks/{taskId}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "result": {
    "insights": "Customer engagement increased by 25%",
    "recommendations": ["Increase email frequency", "Personalize content"]
  }
}
```

#### Human Approvals

**Request Approval**
```http
POST /api/v1/collaboration/approvals
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "session_id",
  "agentId": "agent1_id",
  "title": "Budget Approval Required",
  "description": "Agent requests approval to purchase additional API credits",
  "data": {
    "amount": 500,
    "currency": "USD",
    "purpose": "Enhanced data processing"
  }
}
```

**Respond to Approval**
```http
POST /api/v1/collaboration/approvals/{approvalId}/respond
Authorization: Bearer <token>
Content-Type: application/json

{
  "approved": true,
  "feedback": "Approved for Q1 budget. Please track usage carefully."
}
```

## WebSocket Events

The system emits real-time events via Socket.IO:

### Collaboration Events

- `COLLABORATION_SESSION_CREATED` - New collaboration session created
- `COLLABORATION_MESSAGE` - New message in session
- `COLLABORATION_TASK_ASSIGNED` - Task assigned to agent
- `COLLABORATION_TASK_UPDATED` - Task status updated
- `COLLABORATION_APPROVAL_REQUESTED` - Human approval requested
- `COLLABORATION_APPROVAL_RESPONDED` - Approval response received

### Usage Example

```javascript
// Client-side Socket.IO connection
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  }
});

// Join a collaboration session
socket.emit('JOIN_COLLABORATION_SESSION', { sessionId: 'session_id' });

// Listen for collaboration events
socket.on('COLLABORATION_MESSAGE', (data) => {
  console.log('New message:', data.message);
});

socket.on('COLLABORATION_TASK_ASSIGNED', (data) => {
  console.log('Task assigned:', data.task);
});

socket.on('COLLABORATION_APPROVAL_REQUESTED', (data) => {
  console.log('Approval requested:', data.approval);
});
```

## Pipedream Event Data

When events are sent to Pipedream, they include the following structure:

### Session Created Event
```json
{
  "event": "collaboration.session_created",
  "data": {
    "sessionName": "Project Alpha",
    "description": "Collaborative session",
    "agentCount": 3,
    "agentIds": ["agent1", "agent2", "agent3"],
    "config": {}
  },
  "timestamp": "2024-01-10T10:00:00Z",
  "sessionId": "session_id",
  "userId": "user_id"
}
```

### Message Sent Event
```json
{
  "event": "collaboration.message_sent",
  "data": {
    "messageId": "message_id",
    "fromAgent": "Agent Alpha",
    "toAgent": "Agent Beta",
    "messageType": "text",
    "content": "Hello, can you help?",
    "metadata": {}
  },
  "timestamp": "2024-01-10T10:05:00Z",
  "sessionId": "session_id",
  "userId": "user_id"
}
```

### Task Assigned Event
```json
{
  "event": "collaboration.task_assigned",
  "data": {
    "taskId": "task_id",
    "title": "Data Analysis",
    "description": "Analyze customer data",
    "priority": "high",
    "fromAgent": "Agent Alpha",
    "toAgent": "Agent Beta",
    "dueDate": "2024-01-15T10:00:00Z",
    "requirements": {}
  },
  "timestamp": "2024-01-10T10:10:00Z",
  "sessionId": "session_id",
  "userId": "user_id"
}
```

### Approval Requested Event
```json
{
  "event": "collaboration.approval_requested",
  "data": {
    "approvalId": "approval_id",
    "title": "Budget Approval",
    "description": "Request for additional credits",
    "requestingAgent": "Agent Alpha",
    "requestData": {
      "amount": 500,
      "currency": "USD"
    },
    "userId": "user_id"
  },
  "timestamp": "2024-01-10T10:15:00Z",
  "sessionId": "session_id",
  "userId": "user_id"
}
```

## Security Considerations

1. **Token Storage**: OAuth tokens are stored securely in the user's settings
2. **Token Refresh**: Automatic token refresh prevents expired token issues
3. **Scope Validation**: OAuth scopes limit access to specific resources
4. **User Authorization**: All endpoints require valid JWT authentication
5. **Data Validation**: Input validation prevents malicious data injection

## Error Handling

The integration includes comprehensive error handling:

- **OAuth Errors**: Invalid codes, expired tokens, network issues
- **API Errors**: Rate limiting, invalid requests, server errors
- **Validation Errors**: Missing parameters, invalid data types
- **Network Errors**: Connection timeouts, DNS resolution failures

## Monitoring and Logging

- All Pipedream events are logged for debugging
- Failed event deliveries are logged with error details
- OAuth token refresh attempts are tracked
- Collaboration events are stored in the database

## Best Practices

1. **Configure Workflows**: Set up specific Pipedream workflows for different event types
2. **Monitor Usage**: Track API usage to avoid rate limits
3. **Handle Failures**: Implement retry logic for failed event deliveries
4. **Secure Tokens**: Regularly rotate OAuth credentials
5. **Test Integration**: Use the test endpoint to verify connectivity

## Troubleshooting

### Common Issues

1. **OAuth Authorization Failed**
   - Check client ID and secret
   - Verify redirect URI configuration
   - Ensure user has proper permissions

2. **Event Delivery Failed**
   - Check workflow ID configuration
   - Verify network connectivity
   - Review Pipedream workflow logs

3. **Token Expired**
   - Use the refresh token endpoint
   - Re-authorize if refresh fails
   - Check token expiration settings

### Debug Commands

```bash
# Test Pipedream integration
curl -X GET "http://localhost:3000/api/v1/integrations/pipedream/test" \
  -H "Authorization: Bearer <token>"

# Check integration status
curl -X GET "http://localhost:3000/api/v1/integrations/pipedream/status" \
  -H "Authorization: Bearer <token>"

# Refresh access token
curl -X POST "http://localhost:3000/api/v1/integrations/pipedream/refresh-token" \
  -H "Authorization: Bearer <token>"
```

## Support

For additional support:

1. Check the application logs for detailed error messages
2. Review Pipedream workflow execution logs
3. Verify environment variable configuration
4. Test OAuth flow in isolation
5. Contact support with specific error details

---

*This integration enables powerful automation and collaboration capabilities between your AgentFlow platform and external systems via Pipedream workflows.*