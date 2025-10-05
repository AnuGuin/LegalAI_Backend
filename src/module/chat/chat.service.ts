import prisma from '../../config/database.js';
import pythonBackendService from '../../services/python-backend.service.js';
import cacheService from '../../services/cache.service.js';
import { AppError } from '../../middleware/error.middleware.js';
import { 
  AgentChatResponse, 
  UploadAndChatResponse, 
  ChatResponse 
} from '../../types/python-backend.types.js';

// Union type for all possible AI response types
// NORMAL mode: ChatResponse (simple response)
// AGENTIC mode: 
//   - AgentChatResponse (with session_id only document_id is optional)
//   - UploadAndChatResponse (with both document_id and session_id when uploading a document)
type AIResponse = AgentChatResponse | UploadAndChatResponse | ChatResponse;

// Type guards for agentic mode responses
function isUploadAndChatResponse(response: AIResponse): response is UploadAndChatResponse {
  return 'document_id' in response && 'agent_response' in response;
}

function isAgentChatResponse(response: AIResponse): response is AgentChatResponse {
  return 'session_id' in response && !('document_id' in response);
}

// Helper functions to extract data from different response types
function getResponseText(response: AIResponse): string {
  if (isUploadAndChatResponse(response)) {
    return response.agent_response.response;
  } else if (isAgentChatResponse(response)) {
    return response.response;
  } else {
    return response.response;
  }
}

function getSessionId(response: AIResponse): string | undefined {
  if (isUploadAndChatResponse(response)) {
    return response.session_id;
  } else if (isAgentChatResponse(response)) {
    return response.session_id;
  }
  return undefined;
}

function getDocumentId(response: AIResponse): string | undefined {
  if (isUploadAndChatResponse(response)) {
    return response.document_id;
  }
  return undefined;
}

function getMetadata(response: AIResponse): Record<string, any> {
  if (isUploadAndChatResponse(response)) {
    return {
      tools_used: response.tools_used,
      intermediate_steps: response.intermediate_steps,
      raw_results: response.raw_results,
      language_info: response.language_info,
      deduplication_info: response.deduplication_info,
      storage_url: response.storage_url,
    };
  } else if (isAgentChatResponse(response)) {
    return {
      tools_used: response.tools_used,
      intermediate_steps: response.intermediate_steps,
      raw_results: response.raw_results,
      language_info: response.language_info,
    };
  }
  return {};
}

class ChatService {
  async createConversation(
    userId: string, 
    title: string, 
    mode: 'NORMAL' | 'AGENTIC',
    documentId?: string,
    documentName?: string,
    sessionId?: string
  ) {
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title,
        mode,
        documentId: documentId || null,
        documentName: documentName || null,
        sessionId: sessionId || null,
      },
    });

    return conversation;
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    message: string,
    mode: 'NORMAL' | 'AGENTIC',
    file?: { buffer: Buffer; fileName: string }
  ) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20, // Last 20 messages for context
        },
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Check cache (only for non-file queries)
    if (!file) {
      const cachedResponse = await cacheService.getAIResponse(message, mode);
      if (cachedResponse) {
        //save to database 
        const userMessage = await prisma.message.create({
          data: {
            conversationId,
            role: 'USER',
            content: message,
          },
        });

        const assistantMessage = await prisma.message.create({
          data: {
            conversationId,
            role: 'ASSISTANT',
            content: getResponseText(cachedResponse),
            metadata: { cached: true },
          },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        });

        return {
          userMessage,
          assistantMessage,
          aiResponse: cachedResponse,
        };
      }
    }

    // History
    const conversationHistory = conversation.messages.map((msg : any) => ({
      role: msg.role.toLowerCase(),
      content: msg.content,
    }));

    let aiResponse: AIResponse;

    // Handle different scenarios
    if (file && mode === 'AGENTIC') {
      // First time upload - use upload-and-chat endpoint
      aiResponse = await pythonBackendService.agentUploadAndChat(
        file.buffer,
        file.fileName,
        message,
        conversation.sessionId || undefined
      );

      // Extract document_id and session_id from response and save to conversation
      const updateData: { documentId?: string; documentName?: string; sessionId?: string } = {};
      
      const docId = getDocumentId(aiResponse);
      if (docId) {
        updateData.documentId = docId;
        updateData.documentName = file.fileName;
      }
      
      const newSessionId = getSessionId(aiResponse);
      if (newSessionId) {
        updateData.sessionId = newSessionId;
      }
      
      if (Object.keys(updateData).length > 0) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: updateData,
        });
      }
    } else if (conversation.documentId && mode === 'AGENTIC') {
      // Follow-up query with existing document - use agent chat with document_id
      const sessionId = conversation.sessionId;
      aiResponse = await pythonBackendService.agentChat(
        message,
        sessionId || undefined,
        conversation.documentId
      );
      
      // Update session_id if changed
      const newSessionId = getSessionId(aiResponse);
      if (newSessionId && newSessionId !== sessionId) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { sessionId: newSessionId },
        });
      }
    } else if (mode === 'AGENTIC') {
      // Agentic mode without document
      const sessionId = conversation.sessionId;
      aiResponse = await pythonBackendService.agentChat(
        message,
        sessionId || undefined
      );
      
      // Update session_id if it changed
      const newSessionId = getSessionId(aiResponse);
      if (newSessionId && newSessionId !== sessionId) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { sessionId: newSessionId },
        });
      }
    } else {
      // Normal chat mode
      aiResponse = await pythonBackendService.chat(message);
    }

    // Cache the response (only for non-file queries)
    if (!file) {
      await cacheService.cacheAIResponse(message, mode, aiResponse);
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'USER',
        content: message,
        attachments: file ? [file.fileName] : [],
      },
    });

    // Save AI response
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: getResponseText(aiResponse),
        metadata: {
          ...getMetadata(aiResponse),
          document_id: conversation.documentId || getDocumentId(aiResponse),
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Invalidate conversation cache
    await cacheService.clearUserCache(userId);

    return {
      userMessage,
      assistantMessage,
      aiResponse,
    };
  }

  async getConversations(userId: string) {
    // Check cache
    const cached = await cacheService.getUserData(`conversations:${userId}`);
    if (cached) return cached;

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Cache for 30 minutes
    await cacheService.cacheUserData(`conversations:${userId}`, conversations, 1800);

    return conversations;
  }

  async getConversationMessages(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    return conversation;
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    // Clear cache
    await cacheService.clearUserCache(userId);
  }

  // Get conversation info including document
  async getConversationInfo(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      select: {
        id: true,
        title: true,
        mode: true,
        documentId: true,
        documentName: true,
        sessionId: true,
        createdAt: true,
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    return conversation;
  }
}

export default new ChatService();