import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import {
  AgentChatRequest,
  AgentChatResponse,
  UploadAndChatResponse,
  ChatRequest,
  ChatResponse,
  TranslateRequest,
  TranslateResponse,
  DocGenRequest,
  DocGenResponse,
} from '../types/python-backend.types.js';

class PythonBackendService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.PYTHON_BACKEND_URL,
      timeout: parseInt(process.env.PYTHON_BACKEND_TIMEOUT || '90000'), // 90s for AI
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /*
   * Normal Chat - Uses general knowledge chatbot
   */
  async chat(prompt: string): Promise<ChatResponse> {
    const request: ChatRequest = {
      prompt, 
    };

    const response = await this.client.post<ChatResponse>('/api/v1/chat', request);
    return response.data;
  }

  /*
   * Agentic Chat - Uses AI agent with tools
   */
  async agentChat(
      message: string,
      sessionId?: string,
      documentId?: string
    ): Promise<AgentChatResponse> {
      const request: AgentChatRequest = {
        message,
        session_id: sessionId || '',
        document_id: documentId || '',
      };

      const response = await this.client.post<AgentChatResponse>(
        '/api/v1/agent/chat',
        request
      );
      return response.data;
    }

  /*
   * Upload and Chat 
   */
 async agentUploadAndChat(
    file: Buffer,
    fileName: string,
    initialMessage: string = 'Please analyze this document',
    sessionId?: string
  ): Promise<UploadAndChatResponse> {
    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('initial_message', initialMessage);
    if (sessionId) {
      formData.append('session_id', sessionId);
    }

    const response = await this.client.post<UploadAndChatResponse>(
      '/api/v1/agent/upload-and-chat',
      formData,
      {
        headers: formData.getHeaders(),
      }
    );
    return response.data;
  }


  /*
   * Detect Language
   */
  async detectLanguage(text: string): Promise<{ language: string; confidence?: number }> {
    const response = await this.client.get('/api/v1/agent/detect-language', {
      params: { text },
    });
    return response.data;
  }

  /*
   * Generate Document from Template
   */
  async generateDocument(
    templateName: string,
    data: Record<string, any>
  ): Promise<DocGenResponse> {
    const request: DocGenRequest = {
      template_name: templateName,
      data,
    };

    const response = await this.client.post<DocGenResponse>(
      '/api/v1/generate-document', // CORRECT: with hyphen
      request
    );
    return response.data;
  }

  /*
   * Translate Text
   */
  async translate(
    text: string,
    sourceLang: string = 'en',
    targetLang: string = 'hi'
  ): Promise<TranslateResponse> {
    const request: TranslateRequest = {
      text,
      source_lang: sourceLang,
      target_lang: targetLang,
    };

    const response = await this.client.post<TranslateResponse>('/api/v1/translate', request);
    return response.data;
  }
}

export default new PythonBackendService();