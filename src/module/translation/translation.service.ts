import prisma from '../../config/database.js';
import pythonBackend from '../../services/python-backend.service.js';
import cacheService from '../../services/cache.service.js';
import { TranslateResponse } from '../../types/python-backend.types.js';

interface TranslationResult {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  cached: boolean;
}

interface LanguageDetectionResult {
  language: string;
  confidence?: number;
}

class TranslationService {
  async translate(userId: string, text: string, sourceLang: string, targetLang: string ): Promise<TranslationResult> {
    // Check cache first
    const cached = await cacheService.getTranslation(text, sourceLang, targetLang);
    
    if (cached && typeof cached === 'string') {
      return {
        sourceText: text,
        translatedText: cached,
        sourceLang,
        targetLang,
        cached: true,
      };
    }

    // Call Python backend
    const result: TranslateResponse = await pythonBackend.translate(text, sourceLang, targetLang);

    // Extract translated text
    const translatedText = result.translated_text || '';

    if (!translatedText) {
      throw new Error('Translation failed: No translated text returned');
    }

    // Save to database
    await prisma.translation.create({
      data: {
        userId,
        sourceText: text,
        translatedText,
        sourceLang,
        targetLang,
        metadata: {},
      },
    });

    // Cache the translation
    await cacheService.cacheTranslation(text, sourceLang, targetLang, translatedText);

    return {
      sourceText: text,
      translatedText,
      sourceLang,
      targetLang,
      cached: false,
    };
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    const result = await pythonBackend.detectLanguage(text);
    
    return {
      language: result.language || 'unknown',
      confidence: result.confidence,
    };
  }

  async getUserTranslations(userId: string) {
    const translations = await prisma.translation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return translations;
  }
}

export default new TranslationService();
