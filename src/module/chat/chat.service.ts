import prisma from '../../config/database.js';
import pythonBackendService from '../../services/python-backend.service.js';
import cacheService from '../../services/cache.service.js';
import { AppError } from '../../middleware/error.middleware.js';

// Type for AI response 
type AIResponse = {
  response?: string;
  message?: string;
  text?: string;
  answer?: string;
  metadata?: Record<string, any>;
  sources?: any[];
  document_id?: string;
  session_id?: string;
};

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
            content: cachedResponse.response || cachedResponse.message || cachedResponse.text,
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
      
      if (aiResponse.document_id) {
        updateData.documentId = aiResponse.document_id;
        updateData.documentName = file.fileName;
      }
      
      if (aiResponse.session_id) {
        updateData.sessionId = aiResponse.session_id;
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
      
      // Update session_id if it changed
      if (aiResponse.session_id && aiResponse.session_id !== sessionId) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { sessionId: aiResponse.session_id },
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
      if (aiResponse.session_id && aiResponse.session_id !== sessionId) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { sessionId: aiResponse.session_id },
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
        content: aiResponse.response || aiResponse.message || aiResponse.text || aiResponse.answer || 'No response received',
        metadata: {
          ...aiResponse.metadata,
          document_id: conversation.documentId || aiResponse.document_id,
          sources: aiResponse.sources,
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