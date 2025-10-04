import prisma from '../../config/database.js';
import pythonBackend from '../../services/python-backend.service.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { DocGenResponse } from '../../types/python-backend.types.js';

class DocumentService {
  async generateDocument(
    userId: string,
    prompt: string,
    format: string = 'pdf'
  ) {
    // Call Python backend to generate document
    const templateData = {
      prompt: prompt,
      format: format,
      user_instructions: prompt
    };
    
    const result = await pythonBackend.generateDocument('default', templateData);

    // Save document metadata to database
    const document = await prisma.document.create({
      data: {
        userId,
        title: `Document ${new Date().toISOString()}`,
        content: result.document_content || '',
        format,
        fileUrl: '', // File URL would need to be handled by the Python backend
        prompt,
        generatedBy: 'legal-ai-python-backend',
        metadata: { generated_content: result.document_content },
      },
    });

    return {
      document,
      downloadUrl: '', // This would be provided by the Python backend
    };
  }

  async getUserDocuments(userId: string) {
    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        format: true,
        fileUrl: true,
        createdAt: true,
      },
    });

    return documents;
  }

  async getDocument(userId: string, documentId: string) {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    return document;
  }

  async deleteDocument(userId: string, documentId: string) {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    await prisma.document.delete({
      where: { id: documentId },
    });
  }
}

export default new DocumentService();