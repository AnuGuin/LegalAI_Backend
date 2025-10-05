declare class ChatService {
    createConversation(userId: string, title: string, mode: 'NORMAL' | 'AGENTIC', documentId?: string, documentName?: string, sessionId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        mode: import("@prisma/client").$Enums.ChatMode;
        documentId: string | null;
        documentName: string | null;
        sessionId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        language: string | null;
        lastMessageAt: Date;
    }>;
    sendMessage(userId: string, conversationId: string, message: string, mode: 'NORMAL' | 'AGENTIC', file?: {
        buffer: Buffer;
        fileName: string;
    }, inputLanguage?: string, outputLanguage?: string): Promise<{
        message: {
            id: string;
            content: string;
            role: string;
            createdAt: Date;
            metadata: Record<string, any>;
        };
        conversation: {
            id: string;
            sessionId: string | undefined;
            documentId: string | undefined;
        };
    }>;
    getConversations(userId: string): Promise<any>;
    getConversationMessages(userId: string, conversationId: string): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            role: import("@prisma/client").$Enums.MessageRole;
            content: string;
            tokens: number | null;
            model: string | null;
            attachments: string[];
            conversationId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        mode: import("@prisma/client").$Enums.ChatMode;
        documentId: string | null;
        documentName: string | null;
        sessionId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        language: string | null;
        lastMessageAt: Date;
    }>;
    deleteConversation(userId: string, conversationId: string): Promise<void>;
    deleteAllConversations(userId: string): Promise<{
        deletedCount: number;
    }>;
    getConversationInfo(userId: string, conversationId: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        mode: import("@prisma/client").$Enums.ChatMode;
        documentId: string | null;
        documentName: string | null;
        sessionId: string | null;
    }>;
}
declare const _default: ChatService;
export default _default;
//# sourceMappingURL=chat.service.d.ts.map