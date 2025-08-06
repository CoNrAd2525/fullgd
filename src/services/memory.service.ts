import { PrismaClient, Memory } from '@prisma/client';
import { ApiError } from '../middleware/errorHandler';
import { OpenAI } from 'openai';
import { PineconeClient } from '@pinecone-database/pinecone';

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

// Memory service
export class MemoryService {
  // Create a new memory entry
  async createMemory(agentId: string, userId: string, memoryData: any): Promise<Memory> {
    try {
      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId
        }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found or you do not have permission to access it');
      }

      // Generate embedding for content
      const embedding = await this.generateEmbedding(memoryData.content);

      // Create memory entry
      const memory = await prisma.memory.create({
        data: {
          content: memoryData.content,
          type: memoryData.type || 'conversation',
          metadata: memoryData.metadata || {},
          embedding,
          agentId
        }
      });

      // Store vector in Pinecone
      await this.storeVectorInPinecone(memory.id, embedding, agentId);

      return memory;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error creating memory:', error);
      throw new ApiError(500, 'Failed to create memory');
    }
  }

  // Get all memories for an agent
  async getMemories(agentId: string, userId: string, limit: number = 50, offset: number = 0): Promise<Memory[]> {
    try {
      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId
        }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found or you do not have permission to access it');
      }

      // Get memories
      const memories = await prisma.memory.findMany({
        where: { agentId },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      });

      return memories;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting memories:', error);
      throw new ApiError(500, 'Failed to get memories');
    }
  }

  // Get memory by ID
  async getMemoryById(id: string, agentId: string, userId: string): Promise<Memory> {
    try {
      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId
        }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found or you do not have permission to access it');
      }

      // Get memory
      const memory = await prisma.memory.findFirst({
        where: {
          id,
          agentId
        }
      });

      if (!memory) {
        throw new ApiError(404, 'Memory not found');
      }

      return memory;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting memory:', error);
      throw new ApiError(500, 'Failed to get memory');
    }
  }

  // Update memory
  async updateMemory(id: string, agentId: string, userId: string, memoryData: any): Promise<Memory> {
    try {
      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId
        }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found or you do not have permission to access it');
      }

      // Check if memory exists
      const existingMemory = await prisma.memory.findFirst({
        where: {
          id,
          agentId
        }
      });

      if (!existingMemory) {
        throw new ApiError(404, 'Memory not found');
      }

      // Generate new embedding if content changed
      let embedding = existingMemory.embedding;
      if (memoryData.content && memoryData.content !== existingMemory.content) {
        embedding = await this.generateEmbedding(memoryData.content);
      }

      // Update memory
      const updatedMemory = await prisma.memory.update({
        where: { id },
        data: {
          content: memoryData.content,
          type: memoryData.type,
          metadata: memoryData.metadata,
          embedding
        }
      });

      // Update vector in Pinecone if embedding changed
      if (memoryData.content && memoryData.content !== existingMemory.content) {
        await this.storeVectorInPinecone(id, embedding, agentId);
      }

      return updatedMemory;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error updating memory:', error);
      throw new ApiError(500, 'Failed to update memory');
    }
  }

  // Delete memory
  async deleteMemory(id: string, agentId: string, userId: string): Promise<void> {
    try {
      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId
        }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found or you do not have permission to access it');
      }

      // Check if memory exists
      const memory = await prisma.memory.findFirst({
        where: {
          id,
          agentId
        }
      });

      if (!memory) {
        throw new ApiError(404, 'Memory not found');
      }

      // Delete memory
      await prisma.memory.delete({
        where: { id }
      });

      // Delete vector from Pinecone
      try {
        const pineconeClient = await initPinecone();
        if (pineconeClient) {
          const index = pineconeClient.Index(process.env.PINECONE_INDEX || '');
          await index.delete1({
            deleteRequest: {
              ids: [id],
              namespace: `agent-${agentId}`
            }
          });
        }
      } catch (pineconeError) {
        console.error('Error deleting vector from Pinecone:', pineconeError);
        // Continue with deletion even if Pinecone deletion fails
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error deleting memory:', error);
      throw new ApiError(500, 'Failed to delete memory');
    }
  }

  // Clear all memories for an agent
  async clearMemories(agentId: string, userId: string): Promise<void> {
    try {
      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId
        }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found or you do not have permission to access it');
      }

      // Delete all memories
      await prisma.memory.deleteMany({
        where: { agentId }
      });

      // Delete all vectors from Pinecone
      try {
        const pineconeClient = await initPinecone();
        if (pineconeClient) {
          const index = pineconeClient.Index(process.env.PINECONE_INDEX || '');
          await index.delete1({
            deleteRequest: {
              namespace: `agent-${agentId}`,
              deleteAll: true
            }
          });
        }
      } catch (pineconeError) {
        console.error('Error deleting vectors from Pinecone:', pineconeError);
        // Continue with deletion even if Pinecone deletion fails
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error clearing memories:', error);
      throw new ApiError(500, 'Failed to clear memories');
    }
  }

  // Search memories
  async searchMemories(agentId: string, userId: string, query: string, limit: number = 5): Promise<any[]> {
    try {
      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId
        }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found or you do not have permission to access it');
      }

      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);

      // Search Pinecone
      const pineconeClient = await initPinecone();
      if (!pineconeClient) {
        throw new Error('Failed to initialize Pinecone client');
      }

      const index = pineconeClient.Index(process.env.PINECONE_INDEX || '');

      const queryResponse = await index.query({
        queryRequest: {
          vector: queryEmbedding,
          topK: limit,
          includeMetadata: true,
          namespace: `agent-${agentId}`
        }
      });

      // Get memory details for matches
      const results = [];

      if (queryResponse.matches && queryResponse.matches.length > 0) {
        const memoryIds = queryResponse.matches
          .map(match => match.id)
          .filter(Boolean) as string[];

        if (memoryIds.length > 0) {
          const memories = await prisma.memory.findMany({
            where: {
              id: { in: memoryIds },
              agentId
            }
          });

          // Map memories to results with scores
          for (const match of queryResponse.matches) {
            const memory = memories.find(mem => mem.id === match.id);
            if (memory) {
              results.push({
                memory,
                score: match.score,
                metadata: match.metadata
              });
            }
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching memories:', error);
      throw new ApiError(500, 'Failed to search memories');
    }
  }

  // Import memories
  async importMemories(agentId: string, userId: string, memories: any[]): Promise<{ imported: number }> {
    try {
      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId
        }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found or you do not have permission to access it');
      }

      let importedCount = 0;

      // Process each memory
      for (const memoryData of memories) {
        try {
          // Generate embedding
          const embedding = await this.generateEmbedding(memoryData.content);

          // Create memory
          const memory = await prisma.memory.create({
            data: {
              content: memoryData.content,
              type: memoryData.type || 'conversation',
              metadata: memoryData.metadata || {},
              embedding,
              agentId
            }
          });

          // Store vector in Pinecone
          await this.storeVectorInPinecone(memory.id, embedding, agentId);

          importedCount++;
        } catch (memoryError) {
          console.error('Error importing memory:', memoryError);
          // Continue with other memories even if one fails
        }
      }

      return { imported: importedCount };
    } catch (error) {
      console.error('Error importing memories:', error);
      throw new ApiError(500, 'Failed to import memories');
    }
  }

  // Export memories
  async exportMemories(agentId: string, userId: string): Promise<Memory[]> {
    try {
      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId
        }
      });

      if (!agent) {
        throw new ApiError(404, 'Agent not found or you do not have permission to access it');
      }

      // Get all memories
      const memories = await prisma.memory.findMany({
        where: { agentId },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return memories;
    } catch (error) {
      console.error('Error exporting memories:', error);
      throw new ApiError(500, 'Failed to export memories');
    }
  }

  // Generate embedding for text
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.substring(0, 8000) // Limit text length to avoid token limits
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  // Store vector in Pinecone
  private async storeVectorInPinecone(memoryId: string, vector: number[], agentId: string): Promise<void> {
    try {
      const pineconeClient = await initPinecone();
      if (!pineconeClient) {
        throw new Error('Failed to initialize Pinecone client');
      }

      const index = pineconeClient.Index(process.env.PINECONE_INDEX || '');

      await index.upsert({
        upsertRequest: {
          vectors: [
            {
              id: memoryId,
              values: vector,
              metadata: {
                memoryId,
                agentId
              }
            }
          ],
          namespace: `agent-${agentId}`
        }
      });
    } catch (error) {
      console.error('Error storing vector in Pinecone:', error);
      throw new Error('Failed to store vector in Pinecone');
    }
  }
}