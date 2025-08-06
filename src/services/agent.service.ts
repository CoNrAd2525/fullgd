// Update the method signatures:
getAgentExecutionLogs(agentId: string, userId: string, options?: any) {
  // ...implementation
}

// Fix OpenAI API tools mapping:
import { ChatCompletionTool } from "openai"; // Adjust import if needed

const tools: ChatCompletionTool[] = agent.tools.map(tool => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description || "",
    parameters: tool.schema as Record<string, unknown>
  }
}));

// Fix type inference for contextResults:
const contextResults: { documentId: string, content: string }[] = [];