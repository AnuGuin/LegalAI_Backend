export interface DocumentGenerationResponse {
  // The actual response fields from your Python backend
  document?: string;
  file_url?: string;
  url?: string;
  download_url?: string;
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
  success?: boolean;
  message?: string;
}

export interface ChatResponse {
  response?: string;
  message?: string;
  text?: string;
  answer?: string;
  metadata?: Record<string, any>;
  sources?: any[];
}

export interface AgentChatResponse extends ChatResponse {
  document_id?: string;
}

export interface RAGChatResponse extends ChatResponse {
  sources?: Array<{
    page?: number;
    content?: string;
    score?: number;
  }>;
}

export interface TranslationResponse {
  translated_text?: string;
  translation?: string;
  text?: string;
  source_language?: string;
  target_language?: string;
  metadata?: Record<string, any>;
}

export interface LanguageDetectionResponse {
  language?: string;
  detected_language?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}