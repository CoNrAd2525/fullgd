import { PrismaClient, KnowledgeBase, Document } from '@prisma/client';
import { ApiError } from '../middleware/errorHandler';
import { OpenAI } from 'openai';
import { PineconeClient } from '@pinecone-database/pinecone';
import { createReadStream } from 'fs';
import { parse } from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

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

// Knowledge service
export class KnowledgeService {
  // Create a new knowledge base
  async createKnowledgeBase(userId: string, knowledgeBaseData: any): Promise<KnowledgeBase> {
    try {
      const knowledgeBase = await prisma.knowledgeBase.create({
        data: {
          name: knowledgeBaseData.name,
          description: knowledgeBaseData.description,
          type: knowledgeBaseData.type,
          config: knowledgeBaseData.config || {},
          userId
        }
      });

      return knowledgeBase;
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      throw new ApiError(500, 'Failed to create knowledge base');
    }
  }

  // Get all knowledge bases for a user
  async getKnowledgeBases(userId: string): Promise<KnowledgeBase[]> {
    try {
      const knowledgeBases = await prisma.knowledgeBase.findMany({
        where: { userId },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return knowledgeBases;
    } catch (error) {
      console.error('Error getting knowledge bases:', error);
      throw new ApiError(500, 'Failed to get knowledge bases');
    }
  }

  // Get knowledge base by ID
  async getKnowledgeBaseById(id: string, userId: string): Promise<KnowledgeBase> {
    try {
      const knowledgeBase = await prisma.knowledgeBase.findFirst({
        where: {
          id,
          userId
        },
        include: {
          documents: true
        }
      });

      if (!knowledgeBase) {
        throw new ApiError(404, 'Knowledge base not found');
      }

      return knowledgeBase;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting knowledge base:', error);
      throw new ApiError(500, 'Failed to get knowledge base');
    }
  }

  // Update knowledge base
  async updateKnowledgeBase(id: string, userId: string, knowledgeBaseData: any): Promise<KnowledgeBase> {
    try {
      // Check if knowledge base exists and belongs to user
      const existingKnowledgeBase = await prisma.knowledgeBase.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingKnowledgeBase) {
        throw new ApiError(404, 'Knowledge base not found or you do not have permission to update it');
      }

      const updatedKnowledgeBase = await prisma.knowledgeBase.update({
        where: { id },
        data: {
          name: knowledgeBaseData.name,
          description: knowledgeBaseData.description,
          type: knowledgeBaseData.type,
          config: knowledgeBaseData.config
        }
      });

      return updatedKnowledgeBase;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error updating knowledge base:', error);
      throw new ApiError(500, 'Failed to update knowledge base');
    }
  }

  // Delete knowledge base
  async deleteKnowledgeBase(id: string, userId: string): Promise<void> {
    try {
      // Check if knowledge base exists and belongs to user
      const existingKnowledgeBase = await prisma.knowledgeBase.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!existingKnowledgeBase) {
        throw new ApiError(404, 'Knowledge base not found or you do not have permission to delete it');
      }

      // Delete all documents in the knowledge base
      await prisma.document.deleteMany({
        where: { knowledgeBaseId: id }
      });

      // Delete the knowledge base
      await prisma.knowledgeBase.delete({
        where: { id }
      });

      // Delete vectors from Pinecone
      try {
        const pineconeClient = await initPinecone();
        if (pineconeClient) {
          const index = pineconeClient.Index(process.env.PINECONE_INDEX || '');
          await index.delete1({
            deleteRequest: {
              namespace: `kb-${id}`,
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
      console.error('Error deleting knowledge base:', error);
      throw new ApiError(500, 'Failed to delete knowledge base');
    }
  }

  // Upload document to knowledge base
  async uploadDocument(knowledgeBaseId: string, userId: string, file: any, metadata: any = {}): Promise<Document> {
    try {
      // Check if knowledge base exists and belongs to user
      const knowledgeBase = await this.getKnowledgeBaseById(knowledgeBaseId, userId);

      // Create temporary file path
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'upload-'));
      const tempFilePath = path.join(tempDir, file.originalname);

      // Write file to temporary location
      await fs.writeFile(tempFilePath, file.buffer);

      // Extract text from file (simplified implementation)
      const content = await this.extractTextFromFile(tempFilePath, file.mimetype);

      // Generate embedding
      const embedding = await this.generateEmbedding(content);

      // Create document in database
      const document = await prisma.document.create({
        data: {
          name: file.originalname,
          content,
          mimeType: file.mimetype,
          metadata: { ...metadata, fileSize: file.size },
          embedding,
          knowledgeBaseId
        }
      });

      // Store vector in Pinecone
      await this.storeVectorInPinecone(document.id, embedding, knowledgeBaseId, metadata);

      // Clean up temporary file
      await fs.unlink(tempFilePath);
      await fs.rmdir(tempDir);

      return document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new ApiError(500, 'Failed to upload document');
    }
  }

  // Extract text from file
  private async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    // This is a simplified implementation
    // In a real system, you would use different parsers based on file type
    // For example, pdf.js for PDFs, mammoth for Word docs, etc.
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error('Failed to extract text from file');
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
  private async storeVectorInPinecone(documentId: string, vector: number[], knowledgeBaseId: string, metadata: any = {}): Promise<void> {
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
              id: documentId,
              values: vector,
              metadata: {
                ...metadata,
                documentId,
                knowledgeBaseId
              }
            }
          ],
          namespace: `kb-${knowledgeBaseId}`
        }
      });
    } catch (error) {
      console.error('Error storing vector in Pinecone:', error);
      throw new Error('Failed to store vector in Pinecone');
    }
  }

  // Get all documents in a knowledge base
  async getDocuments(knowledgeBaseId: string, userId: string): Promise<Document[]> {
    try {
      // Check if knowledge base exists and belongs to user
      await this.getKnowledgeBaseById(knowledgeBaseId, userId);

      const documents = await prisma.document.findMany({
        where: { knowledgeBaseId },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return documents;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error getting documents:', error);
      throw new ApiError(500, 'Failed to get documents');
    }
  }

  // Delete document from knowledge base
  async deleteDocument(knowledgeBaseId: string, documentId: string, userId: string): Promise<void> {
    try {
      // Check if knowledge base exists and belongs to user
      await this.getKnowledgeBaseById(knowledgeBaseId, userId);

      // Check if document exists in the knowledge base
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          knowledgeBaseId
        }
      });

      if (!document) {
        throw new ApiError(404, 'Document not found in the knowledge base');
      }

      // Delete document from database
      await prisma.document.delete({
        where: { id: documentId }
      });

      // Delete vector from Pinecone
      try {
        const pineconeClient = await initPinecone();
        if (pineconeClient) {
          const index = pineconeClient.Index(process.env.PINECONE_INDEX || '');
          await index.delete1({
            deleteRequest: {
              ids: [documentId],
              namespace: `kb-${knowledgeBaseId}`
            }
          });
        }
      } catch (pineconeError) {
        console.error('Error deleting vector from Pinecone:', pineconeError);
        // Continue with deletion even if Pinecone deletion fails
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error deleting document:', error);
      throw new ApiError(500, 'Failed to delete document');
    }
  }

  // Search knowledge base
  async searchKnowledgeBase(knowledgeBaseId: string, userId: string, query: string, limit: number = 5): Promise<any[]> {
    try {
      // Check if knowledge base exists and belongs to user
      await this.getKnowledgeBaseById(knowledgeBaseId, userId);

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
          namespace: `kb-${knowledgeBaseId}`
        }
      });

      // Get document details for matches
      const results = [];

      if (queryResponse.matches && queryResponse.matches.length > 0) {
        const documentIds = queryResponse.matches
          .map(match => match.id)
          .filter(Boolean) as string[];

        if (documentIds.length > 0) {
          const documents = await prisma.document.findMany({
            where: {
              id: { in: documentIds },
              knowledgeBaseId
            }
          });

          // Map documents to results with scores
          for (const match of queryResponse.matches) {
            const document = documents.find(doc => doc.id === match.id);
            if (document) {
              results.push({
                document,
                score: match.score,
                metadata: match.metadata
              });
            }
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      throw new ApiError(500, 'Failed to search knowledge base');
    }
  }

  // Sync knowledge base (refresh embeddings)
  async syncKnowledgeBase(knowledgeBaseId: string, userId: string): Promise<{ syncId: string }> {
    try {
      // Check if knowledge base exists and belongs to user
      const knowledgeBase = await this.getKnowledgeBaseById(knowledgeBaseId, userId);

      // Generate a sync ID
      const syncId = `sync-${Date.now()}`;

      // Start sync process asynchronously
      this.performSync(knowledgeBase, syncId).catch(error => {
        console.error('Error during knowledge base sync:', error);
      });

      return { syncId };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error starting knowledge base sync:', error);
      throw new ApiError(500, 'Failed to start knowledge base sync');
    }
  }

  // Perform sync (internal method)
  private async performSync(knowledgeBase: any, syncId: string): Promise<void> {
    try {
      // Get all documents in the knowledge base
      const documents = await prisma.document.findMany({
        where: { knowledgeBaseId: knowledgeBase.id }
      });

      // Delete existing vectors from Pinecone
      const pineconeClient = await initPinecone();
      if (!pineconeClient) {
        throw new Error('Failed to initialize Pinecone client');
      }

      const index = pineconeClient.Index(process.env.PINECONE_INDEX || '');

      await index.delete1({
        deleteRequest: {
          namespace: `kb-${knowledgeBase.id}`,
          deleteAll: true
        }
      });

      // Re-generate embeddings and store in Pinecone
      for (const document of documents) {
        // Generate embedding
        const embedding = await this.generateEmbedding(document.content);

        // Update document with new embedding
        await prisma.document.update({
          where: { id: document.id },
          data: { embedding }
        });

        // Store vector in Pinecone
        await this.storeVectorInPinecone(
          document.id,
          embedding,
          knowledgeBase.id,
          document.metadata
        );
      }
    } catch (error) {
      console.error('Error performing knowledge base sync:', error);
      throw new Error('Failed to perform knowledge base sync');
    }
  }

  // Connect knowledge base to agent
  async connectKnowledgeBaseToAgent(knowledgeBaseId: string, agentId: string, userId: string): Promise<void> {
    try {
      // Check if knowledge base exists and belongs to user
      await this.getKnowledgeBaseById(knowledgeBaseId, userId);

      // Check if agent exists and user has access
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
      const existingConnection = await prisma.agentKnowledgeBase.findUnique({
        where: {
          agentId_knowledgeBaseId: {
            agentId,
            knowledgeBaseId
          }
        }
      });

      if (existingConnection) {
        // Connection already exists
        return;
      }

      // Create connection
      await prisma.agentKnowledgeBase.create({
        data: {
          agentId,
          knowledgeBaseId
        }
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error connecting knowledge base to agent:', error);
      throw new ApiError(500, 'Failed to connect knowledge base to agent');
    }
  }

  // Disconnect knowledge base from agent
  async disconnectKnowledgeBaseFromAgent(knowledgeBaseId: string, agentId: string, userId: string): Promise<void> {
    try {
      // Check if knowledge base exists and belongs to user
      await this.getKnowledgeBaseById(knowledgeBaseId, userId);

      // Check if agent exists and user has access
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
      await prisma.agentKnowledgeBase.delete({
        where: {
          agentId_knowledgeBaseId: {
            agentId,
            knowledgeBaseId
          }
        }
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('Error disconnecting knowledge base from agent:', error);
      throw new ApiError(500, 'Failed to disconnect knowledge base from agent');
    }
  }
}