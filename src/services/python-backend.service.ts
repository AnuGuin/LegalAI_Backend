import axios from 'axios';
import FormData from 'form-data';

// Define interfaces for AI responses
interface BaseAIResponse {
  response?: string;
  message?: string;
  text?: string;
  answer?: string;
  metadata?: Record<string, any>;
  sources?: any[];
}

interface AgentUploadResponse extends BaseAIResponse {
  document_id?: string;
}

interface ChatResponse extends BaseAIResponse {}

interface RAGResponse extends BaseAIResponse {
  document_id?: string;
}

export interface LanguageDetectionResponse {
  language: string;
  confidence: number;
}

interface DocumentGenerationResponse {
  document_url?: string;
  status: string;
  message?: string;
}

interface TranslationResponse {
  translated_text: string;
  source_language?: string;
  target_language?: string;
}

class PythonBackendService {
  private client: ReturnType<typeof axios.create>;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.PYTHON_BACKEND_URL || 'http://localhost:8000',
      timeout: parseInt(process.env.PYTHON_BACKEND_TIMEOUT || '30000'),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

   async chat(message: string, conversationHistory?: any[]): Promise<ChatResponse> {
    const response = await this.client.post('/api/v1/chat', {
      message,
      conversation_history: conversationHistory || [],
    });
    return response.data as ChatResponse;
  }

  // Agentic Chat
  async agentChat(message: string, conversationHistory?: any[]): Promise<ChatResponse> {
    const response = await this.client.post('/api/v1/agent/chat', {
      message,
      conversation_history: conversationHistory || [],
    });
    return response.data as ChatResponse;
  }

  // Upload and Chat with Agent (First Time)
  async agentUploadAndChat(file: Buffer, fileName: string, message: string): Promise<AgentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('message', message);

    const response = await this.client.post('/api/v1/agent/upload-and-chat', formData, {
      headers: formData.getHeaders(),
    });
    
    return response.data as AgentUploadResponse;
  }

  // RAG Chat (Follow-up queries with document)
  async ragChat(message: string, documentId: string, conversationHistory?: any[]): Promise<RAGResponse> {
    const response = await this.client.post('/api/v1/chat/rag', {
      message,
      document_id: documentId,
      conversation_history: conversationHistory || [],
    });
    return response.data as RAGResponse;
  }

  // Detect Language
  async detectLanguage(text: string): Promise<LanguageDetectionResponse> {
    const response = await this.client.post('/api/v1/agent/detect-language', {
      text,
    });
    return response.data as LanguageDetectionResponse;
  }

  // Generate Document
  async generateDocument(prompt: string, format: string = 'pdf'): Promise<DocumentGenerationResponse> {
    const response = await this.client.post('/api/v1/generate/document', {
      prompt,
      format,
    });
    return response.data as DocumentGenerationResponse;
  }

  // Translate Text
  async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResponse> {
    const response = await this.client.post('/api/v1/translate', {
      text,
      source_lang: sourceLang,
      target_lang: targetLang,
    });
    return response.data as TranslationResponse;
  }
}

export default new PythonBackendService();