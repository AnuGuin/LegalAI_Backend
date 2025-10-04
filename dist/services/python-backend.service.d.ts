import type { DocumentGenerationResponse, ChatResponse, AgentChatResponse, RAGChatResponse, TranslationResponse, LanguageDetectionResponse } from '../types/python-backend.types.js';
declare class PythonBackendService {
    private client;
    constructor();
    chat(message: string, conversationHistory?: any[]): Promise<ChatResponse>;
    agentChat(message: string, conversationHistory?: any[]): Promise<AgentChatResponse>;
    agentUploadAndChat(file: Buffer, fileName: string, message: string): Promise<AgentChatResponse>;
    ragChat(message: string, documentId: string, conversationHistory?: any[]): Promise<RAGChatResponse>;
    detectLanguage(text: string): Promise<LanguageDetectionResponse>;
    generateDocument(prompt: string, format?: string): Promise<DocumentGenerationResponse>;
    translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResponse>;
}
declare const _default: PythonBackendService;
export default _default;
//# sourceMappingURL=python-backend.service.d.ts.map