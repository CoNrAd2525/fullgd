-- Multi-Agent Collaboration Schema Extension
-- This migration adds support for agent roles, collaboration sessions, and agent-to-agent communication

-- Agent Roles and Capabilities
CREATE TABLE agent_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role_type VARCHAR(50) NOT NULL, -- 'supervisor', 'worker', 'specialist'
  capabilities JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  max_concurrent_tasks INTEGER DEFAULT 1,
  specializations TEXT[], -- Array of specialization areas
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Collaboration Sessions
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'paused', 'completed', 'failed'
  session_type VARCHAR(50) DEFAULT 'collaborative', -- 'collaborative', 'hierarchical', 'pipeline'
  shared_state JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}', -- Session configuration
  max_participants INTEGER DEFAULT 10,
  timeout_minutes INTEGER DEFAULT 60,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Session Participants (Agents in a collaboration session)
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'supervisor', 'worker', 'specialist', 'observer'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'busy', 'idle', 'disconnected'
  capabilities JSONB DEFAULT '{}',
  assigned_tasks JSONB DEFAULT '[]',
  performance_metrics JSONB DEFAULT '{}',
  joined_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(session_id, agent_id)
);

-- Agent Messages (Communication between agents)
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  to_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL, -- NULL for broadcast messages
  message_type VARCHAR(50) NOT NULL, -- 'task', 'response', 'notification', 'error', 'broadcast', 'delegation'
  content JSONB NOT NULL,
  priority INTEGER DEFAULT 0, -- Higher number = higher priority
  requires_response BOOLEAN DEFAULT FALSE,
  parent_message_id UUID REFERENCES agent_messages(id), -- For threading
  read_at TIMESTAMP,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Task Assignments (Dynamic task delegation)
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  assigned_to UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_type VARCHAR(100) NOT NULL,
  task_description TEXT NOT NULL,
  task_data JSONB DEFAULT '{}',
  requirements JSONB DEFAULT '{}', -- Required capabilities, resources, etc.
  priority INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'in_progress', 'completed', 'failed', 'rejected'
  progress INTEGER DEFAULT 0, -- 0-100
  result JSONB,
  error_message TEXT,
  estimated_duration INTEGER, -- in minutes
  actual_duration INTEGER, -- in minutes
  assigned_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  deadline TIMESTAMP
);

-- Human Approval Gates (Human-in-the-loop checkpoints)
CREATE TABLE approval_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  approval_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'automatic', 'conditional'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  required_approvers INTEGER DEFAULT 1,
  current_approvers INTEGER DEFAULT 0,
  approval_data JSONB DEFAULT '{}', -- Data to be approved
  approval_criteria JSONB DEFAULT '{}', -- Criteria for approval
  requested_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  approved_by UUID[] DEFAULT '{}', -- Array of user IDs who approved
  rejected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Collaboration Events (Audit trail for collaboration activities)
CREATE TABLE collaboration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'session_started', 'agent_joined', 'task_assigned', 'message_sent', etc.
  actor_type VARCHAR(50) NOT NULL, -- 'agent', 'user', 'system'
  actor_id UUID, -- agent_id or user_id
  target_type VARCHAR(50), -- 'agent', 'task', 'message', etc.
  target_id UUID,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agent Capabilities (Predefined capabilities that agents can have)
CREATE TABLE agent_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50), -- 'analysis', 'generation', 'integration', 'communication', etc.
  requirements JSONB DEFAULT '{}', -- Required tools, knowledge bases, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agent Capability Assignments (Many-to-many relationship)
CREATE TABLE agent_capability_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES agent_capabilities(id) ON DELETE CASCADE,
  proficiency_level INTEGER DEFAULT 1, -- 1-10 scale
  verified BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(agent_id, capability_id)
);

-- Indexes for performance
CREATE INDEX idx_agent_roles_agent_id ON agent_roles(agent_id);
CREATE INDEX idx_agent_roles_role_type ON agent_roles(role_type);
CREATE INDEX idx_collaboration_sessions_status ON collaboration_sessions(status);
CREATE INDEX idx_collaboration_sessions_created_by ON collaboration_sessions(created_by);
CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX idx_session_participants_agent_id ON session_participants(agent_id);
CREATE INDEX idx_agent_messages_session_id ON agent_messages(session_id);
CREATE INDEX idx_agent_messages_from_agent ON agent_messages(from_agent_id);
CREATE INDEX idx_agent_messages_to_agent ON agent_messages(to_agent_id);
CREATE INDEX idx_agent_messages_created_at ON agent_messages(created_at);
CREATE INDEX idx_task_assignments_session_id ON task_assignments(session_id);
CREATE INDEX idx_task_assignments_assigned_to ON task_assignments(assigned_to);
CREATE INDEX idx_task_assignments_status ON task_assignments(status);
CREATE INDEX idx_approval_gates_session_id ON approval_gates(session_id);
CREATE INDEX idx_approval_gates_status ON approval_gates(status);
CREATE INDEX idx_collaboration_events_session_id ON collaboration_events(session_id);
CREATE INDEX idx_collaboration_events_created_at ON collaboration_events(created_at);
CREATE INDEX idx_agent_capability_assignments_agent_id ON agent_capability_assignments(agent_id);

-- Insert default agent capabilities
INSERT INTO agent_capabilities (name, description, category) VALUES
('text_analysis', 'Ability to analyze and understand text content', 'analysis'),
('data_processing', 'Ability to process and transform data', 'analysis'),
('content_generation', 'Ability to generate text, code, or other content', 'generation'),
('api_integration', 'Ability to integrate with external APIs', 'integration'),
('database_operations', 'Ability to perform database operations', 'integration'),
('file_processing', 'Ability to process various file formats', 'integration'),
('web_scraping', 'Ability to extract data from websites', 'integration'),
('image_analysis', 'Ability to analyze and understand images', 'analysis'),
('code_generation', 'Ability to generate and review code', 'generation'),
('task_coordination', 'Ability to coordinate and manage tasks', 'communication'),
('decision_making', 'Ability to make complex decisions', 'analysis'),
('workflow_orchestration', 'Ability to orchestrate complex workflows', 'communication');

-- Add comments for documentation
COMMENT ON TABLE agent_roles IS 'Defines roles and capabilities for agents in multi-agent systems';
COMMENT ON TABLE collaboration_sessions IS 'Manages multi-agent collaboration sessions';
COMMENT ON TABLE session_participants IS 'Tracks agent participation in collaboration sessions';
COMMENT ON TABLE agent_messages IS 'Stores communication between agents';
COMMENT ON TABLE task_assignments IS 'Manages dynamic task delegation between agents';
COMMENT ON TABLE approval_gates IS 'Handles human-in-the-loop approval checkpoints';
COMMENT ON TABLE collaboration_events IS 'Audit trail for collaboration activities';
COMMENT ON TABLE agent_capabilities IS 'Predefined capabilities that agents can possess';
COMMENT ON TABLE agent_capability_assignments IS 'Assigns capabilities to specific agents';