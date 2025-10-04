import axios from 'axios';
import FormData from 'form-data';
class PythonBackendService {
    constructor() {
        this.client = axios.create({
            baseURL: process.env.PYTHON_BACKEND_URL,
            timeout: parseInt(process.env.PYTHON_BACKEND_TIMEOUT || '30000'),
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    async chat(message, conversationHistory) {
        const response = await this.client.post('/api/v1/chat', {
            message,
            conversation_history: conversationHistory || [],
        });
        return response.data;
    }
    async agentChat(message, conversationHistory) {
        const response = await this.client.post('/api/v1/agent/chat', {
            message,
            conversation_history: conversationHistory || [],
        });
        return response.data;
    }
    async agentUploadAndChat(file, fileName, message) {
        const formData = new FormData();
        formData.append('file', file, fileName);
        formData.append('message', message);
        const response = await this.client.post('/api/v1/agent/upload-and-chat', formData, {
            headers: formData.getHeaders(),
        });
        return response.data;
    }
    async ragChat(message, documentId, conversationHistory) {
        const response = await this.client.post('/api/v1/chat/rag', {
            message,
            document_id: documentId,
            conversation_history: conversationHistory || [],
        });
        return response.data;
    }
    async detectLanguage(text) {
        const response = await this.client.post('/api/v1/agent/detect-language', { text });
        return response.data;
    }
    async generateDocument(prompt, format = 'pdf') {
        const response = await this.client.post('/api/v1/generate/document', {
            prompt,
            format,
        });
        return response.data;
    }
    async translate(text, sourceLang, targetLang) {
        const response = await this.client.post('/api/v1/translate', {
            text,
            source_lang: sourceLang,
            target_lang: targetLang,
        });
        return response.data;
    }
}
export default new PythonBackendService();
//# sourceMappingURL=python-backend.service.js.map