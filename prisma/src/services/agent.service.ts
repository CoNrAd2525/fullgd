// Update getAgentExecutionLogs definition and all calls:
getAgentExecutionLogs(agentId: string, userId: string, options?: any) { ... }

// Fix OpenAI tools structure:
const tools: ChatCompletionTool[] = agent.tools.map(tool => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description || "",
    parameters: tool.schema as Record<string, unknown>
  }
}));

// Explicitly type contextResults:
const contextResults: { documentId: string; content: string }[] = [];