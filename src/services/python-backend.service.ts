import axios, { type AxiosInstance } from 'axios';
import FormData from 'form-data';
import type {
  DocumentGenerationResponse,
  ChatResponse,
  AgentChatResponse,
  RAGChatResponse,
  TranslationResponse,
  LanguageDetectionResponse,
} from '../types/python-backend.types.js';


class PythonBackendService {
  private client: AxiosInstance;

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
    const response = await this.client.post<ChatResponse>('/api/v1/chat', {
      message,
      conversation_history: conversationHistory || [],
    });
    return response.data;
  }

  async agentChat(message: string, conversationHistory?: any[]): Promise<AgentChatResponse> {
    const response = await this.client.post<AgentChatResponse>('/api/v1/agent/chat', {
      message,
      conversation_history: conversationHistory || [],
    });
    return response.data;
  }

  async agentUploadAndChat(
    file: Buffer,
    fileName: string,
    message: string
  ): Promise<AgentChatResponse> {
    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('message', message);

    const response = await this.client.post<AgentChatResponse>(
      '/api/v1/agent/upload-and-chat',
      formData,
      {
        headers: formData.getHeaders(),
      }
    );
    return response.data;
  }

  async ragChat(
    message: string,
    documentId: string,
    conversationHistory?: any[]
  ): Promise<RAGChatResponse> {
    const response = await this.client.post<RAGChatResponse>('/api/v1/chat/rag', {
      message,
      document_id: documentId,
      conversation_history: conversationHistory || [],
    });
    return response.data;
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResponse> {
    const response = await this.client.post<LanguageDetectionResponse>(
      '/api/v1/agent/detect-language',
      { text }
    );
    return response.data;
  }

  async generateDocument(
    prompt: string,
    format: string = 'pdf'
  ): Promise<DocumentGenerationResponse> {
    const response = await this.client.post<DocumentGenerationResponse>(
      '/api/v1/generate/document',
      {
        prompt,
        format,
      }
    );
    return response.data;
  }

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResponse> {
    const response = await this.client.post<TranslationResponse>('/api/v1/translate', {
      text,
      source_lang: sourceLang,
      target_lang: targetLang,
    });
    return response.data;
  }
}

export default new PythonBackendService();